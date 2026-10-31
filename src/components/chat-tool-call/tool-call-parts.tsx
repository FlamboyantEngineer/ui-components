'use client';

import {
  ClockGlyph,
  EditGlyph,
  ErrorGlyph,
  FileTextGlyph,
  GlobeGlyph,
  HandRaisedGlyph,
  NoSymbolGlyph,
  RefreshGlyph,
  SearchGlyph,
  SuccessGlyph,
  TerminalGlyph,
  WrenchGlyph,
  XCircleGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { useId, useMemo, type ReactNode, type Ref } from 'react';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { DisclosureTitle } from '../disclosure/disclosure.js';
import { CopyButton } from '../copy-button/copy-button.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { formatToolValue } from './format-tool-call.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';

/** Where a tool call stands, from queued to finished. */
export type ChatToolCallStatus =
  | 'pending'
  | 'running'
  | 'approval-requested'
  | 'succeeded'
  | 'failed'
  | 'denied'
  | 'cancelled';

/** What a tool call does, which picks its glyph and how a group of steps sums it up. */
export type ChatToolCallKind = 'read' | 'edit' | 'command' | 'search' | 'fetch' | 'other';

/** A part of a tool call the body shows as JSON. */
type ToolCallPartName = 'arguments' | 'result';

interface ToolCallTitleProps {
  label: string;
  target: string | undefined;
  kind: ChatToolCallKind;
  status: ChatToolCallStatus;
  durationMs: number | undefined;
  isAutoApproved: boolean;
  /** The trigger, where focus goes when the approval leaves while holding it. */
  triggerRef: Ref<HTMLButtonElement>;
}

interface ToolCallBodyProps {
  args: unknown;
  result: unknown;
  /** A custom body, which replaces the arguments and result. */
  children?: ReactNode;
}

const statusGlyphs: Readonly<Record<ChatToolCallStatus, GlyphComponent>> = {
  pending: ClockGlyph,
  running: RefreshGlyph,
  'approval-requested': HandRaisedGlyph,
  succeeded: SuccessGlyph,
  failed: ErrorGlyph,
  denied: NoSymbolGlyph,
  cancelled: XCircleGlyph,
};

/** The glyph of each kind of call, shown once the call succeeded and by groups of steps. */
export const toolCallKindGlyphs: Readonly<Record<ChatToolCallKind, GlyphComponent>> = {
  read: FileTextGlyph,
  edit: EditGlyph,
  command: TerminalGlyph,
  search: SearchGlyph,
  fetch: GlobeGlyph,
  other: WrenchGlyph,
};

/** How long the call ran: the short form shown, the long one read by assistive technology. */
function ToolCallDuration({ milliseconds }: { milliseconds: number }) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot('duration')}>
      <span aria-hidden="true">{strings.toolCallDuration(milliseconds, 'short')}</span>
      <VisuallyHidden elementType="span">
        {strings.toolCallDuration(milliseconds, 'long')}
      </VisuallyHidden>
    </span>
  );
}

/**
 * The title heading, whose trigger holds the status glyph (the kind's once the call succeeded), then
 * the summary that wraps beside it: the label, the target, the status, the duration and the badge,
 * spaced so the trigger's name reads them as words.
 */
export function ToolCallTitle({
  label,
  target,
  kind,
  status,
  durationMs,
  isAutoApproved,
  triggerRef,
}: ToolCallTitleProps) {
  const strings = useUiStrings();
  const glyph = status === 'succeeded' ? toolCallKindGlyphs[kind] : statusGlyphs[status];
  return (
    <DisclosureTitle className={hooks.slotClass('heading')} triggerRef={triggerRef}>
      <Glyph icon={glyph} className={hooks.slotClass('status-glyph')} />
      <span {...hooks.slot('summary')}>
        <span {...hooks.slot('label')}>{label}</span>{' '}
        {target ? (
          <>
            <span {...hooks.slot('target')}>{target}</span>{' '}
          </>
        ) : null}
        <span {...hooks.slot('status')}>{strings.toolCallStatus(status)}</span>
        {durationMs === undefined ? null : (
          <>
            {' '}
            <ToolCallDuration milliseconds={durationMs} />
          </>
        )}
        {isAutoApproved ? (
          <>
            {' '}
            <Badge size="sm" className={hooks.slotClass('badge')}>
              {strings.toolCallAutoApproved}
            </Badge>
          </>
        ) : null}
      </span>
    </DisclosureTitle>
  );
}

/** A failed call's error, at the top of the body. */
export function ToolCallError({ message }: { message: string }) {
  return (
    <div {...hooks.slot('error')}>
      <Glyph icon={ErrorGlyph} />
      {message}
    </div>
  );
}

/** Arguments or a result: a title, a copy button and the formatted JSON in a scrolling view. */
function ToolCallPart({ part, value }: { part: ToolCallPartName; value: unknown }) {
  const strings = useUiStrings();
  const titleId = useId();
  const text = useMemo(() => formatToolValue(value), [value]);
  const title = part === 'arguments' ? strings.toolCallArguments : strings.toolCallResult;
  return (
    <div {...hooks.slot('part', { part })}>
      <div {...hooks.slot('part-header')}>
        <span {...hooks.slot('part-title')} id={titleId}>
          {title}
        </span>
        <CopyButton
          className={hooks.slotClass('copy')}
          value={text}
          label={strings.copyToolCallPart(part)}
          size="sm"
          variant="ghost"
        />
      </div>
      <ScrollRegion
        className={hooks.slotClass('json')}
        axis="both"
        role="group"
        tabIndex={0}
        aria-labelledby={titleId}
      >
        <pre>
          <code>{text}</code>
        </pre>
      </ScrollRegion>
    </div>
  );
}

/** The panel's content: the custom body, else the arguments and result, else a note. */
export function ToolCallBody({ args, result, children }: ToolCallBodyProps) {
  const strings = useUiStrings();
  if (!isEmptyNode(children)) return children;
  if (args === undefined && result === undefined) {
    return <p {...hooks.slot('empty')}>{strings.toolCallNoDetails}</p>;
  }
  return (
    <>
      {args === undefined ? null : <ToolCallPart part="arguments" value={args} />}
      {result === undefined ? null : <ToolCallPart part="result" value={result} />}
    </>
  );
}
