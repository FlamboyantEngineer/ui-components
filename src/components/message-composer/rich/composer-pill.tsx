'use client';

// The rich composer's pills as the editor draws them: a mention or command as its text, a host
// trigger's token as its icon and label, a record reference as a record chip (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.3 and 4.9).

import {
  useEditorEventCallback,
  useStopEvent,
  type NodeViewComponentProps,
} from '@handlewithcare/react-prosemirror';
import { createContext, useContext, useMemo, useRef } from 'react';
import { mergeClassNames } from '../../../core/hooks.js';
import { mergeRefs } from '../../../utils/merge-props.js';
import { RecordLabel, type RecordLabelResolver } from '../../record-label/record-label.js';
import { Icon, toIconProps } from '../../icon/icon.js';
import { composerHooks as hooks } from '../composer-hooks.js';
import type { MessageComposerTrigger } from './composer-triggers.js';
import { getPillText, type PillAttributes } from './composer-schema.js';

/** What the editor's pills draw with. */
interface ComposerPillOptions {
  getReference: RecordLabelResolver | undefined;
  isEditable: boolean;
  /** The host's triggers, whose `getIcon` draws their tokens' icons. */
  triggers?: readonly MessageComposerTrigger[] | undefined;
}

export const ComposerPillContext = createContext<ComposerPillOptions>({
  getReference: undefined,
  isEditable: false,
});

/** A host trigger's token: its trigger's icon and its label, while the message keeps its raw text. */
function TriggerToken({ pill }: { pill: PillAttributes }) {
  const { triggers } = useContext(ComposerPillContext);
  const trigger = triggers?.find((candidate) => candidate.id === pill.trigger);
  const { kind, id, label, recordType } = pill;
  const icon = trigger?.getIcon?.({
    kind,
    id,
    label,
    ...(recordType === undefined ? {} : { recordType }),
    ...(pill.trigger === undefined ? {} : { trigger: pill.trigger }),
  });
  return (
    <>
      {icon ? (
        <Icon {...toIconProps(icon)} size="sm" className={hooks.slotClass('pill-icon')} />
      ) : null}
      {label}
    </>
  );
}

/** What a pill shows: a reference's chip, a host token's label, or a mention's or command's text. */
function PillContent({ nodeProps }: Pick<NodeViewComponentProps, 'nodeProps'>) {
  const pill = nodeProps.node.attrs as PillAttributes;
  if (pill.kind === 'reference') return <ReferenceChip nodeProps={nodeProps} />;
  if (pill.kind === 'trigger') return <TriggerToken pill={pill} />;
  return getPillText(nodeProps.node);
}

/** A reference's chip, with a remove button while the composer is editable. */
function ReferenceChip({ nodeProps }: Pick<NodeViewComponentProps, 'nodeProps'>) {
  const { getReference, isEditable } = useContext(ComposerPillContext);
  const { id, label, recordType } = nodeProps.node.attrs as PillAttributes;
  const remove = useEditorEventCallback((view) => {
    const from = nodeProps.getPos();
    view.dispatch(view.state.tr.delete(from, from + nodeProps.node.nodeSize));
    view.focus();
  });
  return (
    <RecordLabel
      mode="chip"
      {...getReference?.({ id, label, ...(recordType === undefined ? {} : { recordType }) })}
      identifier={label}
      onRemove={isEditable ? remove : undefined}
    />
  );
}

/** A pill drawn by the editor: atomic, its text or its chip. */
function ComposerPill({ nodeProps, ref, className, ...props }: NodeViewComponentProps) {
  const { kind } = nodeProps.node.attrs as PillAttributes;
  const element = useRef<HTMLSpanElement | null>(null);
  // The editor leaves events in a chip to it, so its link and remove button take presses and keys.
  useStopEvent(
    (_view, event) =>
      kind === 'reference' && (element.current?.contains(event.target as Node | null) ?? false),
  );
  const refs = useMemo(() => mergeRefs(element, ref), [ref]);
  const { trigger } = nodeProps.node.attrs as PillAttributes;
  const hookProps = hooks.slot('pill', { kind, trigger });
  return (
    <span
      {...props}
      {...hookProps}
      className={mergeClassNames(hookProps.className, className)}
      ref={refs}
      contentEditable={false}
    >
      <PillContent nodeProps={nodeProps} />
    </span>
  );
}

/** The editor's node views. */
export const composerNodeViews = { pill: ComposerPill };
