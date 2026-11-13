'use client';

import { type ReactNode, type Ref, useId, useMemo } from 'react';
import {
  ClockGlyph,
  EditGlyph,
  ErrorGlyph,
  FileTextGlyph,
  GlobeGlyph,
  type GlyphComponent,
  HandRaisedGlyph,
  NoSymbolGlyph,
  RefreshGlyph,
  SearchGlyph,
  SuccessGlyph,
  TerminalGlyph,
  WrenchGlyph,
  XCircleGlyph,
} from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getLeadingLetter } from '../../utils/initials.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { CopyButton } from '../copy-button/copy-button.js';
import { DisclosurePanel, DisclosureTitle } from '../disclosure/disclosure.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { formatToolValue } from './format-tool-call.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
import { ToolCallLetterGlyph } from './tool-call-letter-glyph.js';

/** Where a tool call stands, from queued to finished. */
export type ChatToolCallStatus =
  'pending' | 'running' | 'approval-requested' | 'succeeded' | 'failed' | 'denied' | 'cancelled';

/** What a tool call does, which picks its glyph and how a group of steps sums it up. */
export type ChatToolCallKind = 'read' | 'edit' | 'command' | 'search' | 'fetch' | 'other';

/** A part of a tool call the body shows as JSON. */
type ToolCallPartName = 'arguments' | 'result';

/** Who the call is: what names its letter, and the host's own glyph for the tool. */
export interface ToolCallIdentity {
  name: string;
  source: string | undefined;
  kind: ChatToolCallKind;
  glyph: GlyphComponent | undefined;
}

interface ToolCallTitleProps {
  label: string;
  target: string | undefined;
  identity: ToolCallIdentity;
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

/**
 * The glyph a succeeded call shows: the host's glyph for the tool, else its kind's, else, for a call
 * of kind `other`, a letter in a box from its source or name, else the kind's wrench.
 */
function ToolCallIdentityGlyph({ identity }: { identity: ToolCallIdentity }) {
  const className = hooks.slotClass('status-glyph');
  const { name, source, kind, glyph } = identity;
  if (glyph) return <Glyph icon={glyph} className={className} />;
  const letter = kind === 'other' ? getLeadingLetter(source ?? name) : undefined;
  if (letter === undefined) return <Glyph icon={toolCallKindGlyphs[kind]} className={className} />;
  return <ToolCallLetterGlyph letter={letter} className={className} />;
}

/** How long the call ran: the short form shown, the long one read by assistive technology. */
function ToolCallDuration({ milliseconds }: { milliseconds: number }) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot('duration')}>
      <span aria-hidden="true">{strings.toolCallDuration(milliseconds, 'short')}</span>
      <VisuallyHidden as="span">{strings.toolCallDuration(milliseconds, 'long')}</VisuallyHidden>
    </span>
  );
}

/**
 * The title heading, whose trigger holds the status glyph (the tool's once the call succeeded), then
 * the summary that wraps beside it: the label, the target, the status, the duration and the badge,
 * spaced so the trigger's name reads them as words.
 */
export function ToolCallTitle({
  label,
  target,
  identity,
  status,
  durationMs,
  isAutoApproved,
  triggerRef,
}: ToolCallTitleProps) {
  const strings = useUiStrings();
  return (
    <DisclosureTitle className={hooks.slotClass('heading')} triggerRef={triggerRef}>
      {status === 'succeeded' ? (
        <ToolCallIdentityGlyph identity={identity} />
      ) : (
        <Glyph icon={statusGlyphs[status]} className={hooks.slotClass('status-glyph')} />
      )}
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
function ToolCallError({ message }: { message: string }) {
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
function ToolCallBody({ args, result, children }: ToolCallBodyProps) {
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

/** The collapsible panel: a failed call's error, then the content. */
export function ToolCallPanel({
  error,
  ...body
}: ToolCallBodyProps & { error: string | undefined }) {
  return (
    <DisclosurePanel className={hooks.slotClass('body')}>
      {error ? <ToolCallError message={error} /> : null}
      <ToolCallBody {...body} />
    </DisclosurePanel>
  );
}
