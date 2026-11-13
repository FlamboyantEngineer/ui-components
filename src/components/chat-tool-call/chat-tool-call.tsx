'use client';

import { type ReactNode, useRef, useState } from 'react';
import type { GlyphComponent } from '../../core/glyphs.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Disclosure } from '../disclosure/disclosure.js';
import { formatToolName } from './format-tool-call.js';
import { type ChatToolCallApproval, ToolCallApproval } from './tool-call-approval.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
import {
  type ChatToolCallKind,
  type ChatToolCallStatus,
  ToolCallPanel,
  ToolCallTitle,
} from './tool-call-parts.js';
import { useToolCallApproval } from './use-tool-call-approval.js';

export type { ChatToolCallApproval, ChatToolCallDecision } from './tool-call-approval.js';
export type { ChatToolCallKind, ChatToolCallStatus } from './tool-call-parts.js';
export { toolCallKindGlyphs } from './tool-call-parts.js';

/** A tool call as data: what a host stores for one call of a tool by an assistant. */
export interface ChatToolCallData {
  /** The call's id, also the root element's `id`. */
  id: string;
  /** The tool's name, such as `search_recipes`. */
  name: string;
  /** A readable title, such as `Searched recipes`. Defaults to one derived from `name`. */
  label?: string | undefined;
  /** What the call acted on, such as a file path or a command; shown after the label. */
  target?: string | undefined;
  /**
   * What provides the tool, such as an integration named `OneDrive`. A succeeded call of kind
   * `other` without a glyph shows its first letter in a box, else the first letter of `name`.
   */
  source?: string | undefined;
  /** What the call does: its glyph once it succeeded, and how a group of steps sums it up. Defaults to `other`. */
  kind?: ChatToolCallKind | undefined;
  /** Where the call stands. */
  status: ChatToolCallStatus;
  /** The arguments the tool takes, shown as JSON. */
  args?: unknown;
  /** What the tool returned, shown as JSON. */
  result?: unknown;
  /** Why a `failed` call failed, shown in the body above the details. */
  error?: string | undefined;
  /** How long the call ran, in milliseconds. */
  durationMs?: number | undefined;
  /** How the call was, or is to be, approved. */
  approval?: ChatToolCallApproval | undefined;
}

/** How a tool call shows: a bordered `card`, or a quiet `row` among the steps of a reply. */
export type ChatToolCallVariant = 'card' | 'row';

export interface ChatToolCallProps
  extends RefProps<HTMLDivElement>, Omit<BaseProps, 'id'>, ChatToolCallData {
  /** How the call shows, published as `data-variant`: `card` (the default) or `row`. */
  variant?: ChatToolCallVariant | undefined;
  /** The tool's own glyph, shown once the call succeeded in place of its kind's glyph or letter. */
  glyph?: GlyphComponent | undefined;
  /** Lets the call run once. Shows Approve while the approval is pending. */
  onApprove?: (() => void) | undefined;
  /** Refuses the call, with the reader's reason when they gave one. Shows Deny while pending. */
  onDeny?: ((reason?: string) => void) | undefined;
  /** Lets the call run, and the tool run from then on without asking. Shows Always allow. */
  onAlwaysAllow?: (() => void) | undefined;
  /** Whether the body shows (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether the body shows at first. Defaults to following the status: open while an approval waits. */
  defaultExpanded?: boolean | undefined;
  /** Receives each requested expanded state, also while controlled. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** A custom body for the tool, which replaces the arguments and result. */
  children?: ReactNode;
}

type ExpansionOptions = Pick<
  ChatToolCallProps,
  'id' | 'status' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange'
>;

/**
 * The card's expanded state. Uncontrolled, it follows the status (open while an approval is
 * requested) until the reader toggles it or `defaultExpanded` sets it. A failure stays closed.
 * The reader's toggle belongs to the call `id`: another call follows its own status again.
 */
function useToolCallExpansion({
  id,
  status,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
}: ExpansionOptions): [boolean, (next: boolean) => void] {
  const [toggle, setToggle] = useState<{ id: string; value: boolean }>();
  let toggled = toggle?.value;
  if (toggle && toggle.id !== id) {
    toggled = undefined;
    setToggle(undefined);
  }
  const shown = isExpanded ?? toggled ?? defaultExpanded ?? status === 'approval-requested';
  const setExpanded = (next: boolean) => {
    if (isExpanded === undefined) setToggle({ id, value: next });
    onExpandedChange?.(next);
  };
  return [shown, setExpanded];
}

/**
 * One call of a tool by an assistant, as a collapsible card: a trigger with the status, the label
 * and the duration, a body with the error of a failed call and the arguments and result as JSON
 * (or a custom body), and, when the call asks for approval, Approve, Deny with a reason and Always
 * allow, with keyboard shortcuts, then the decision.
 */
export function ChatToolCall({
  ref,
  id,
  name,
  label,
  target,
  source,
  kind = 'other',
  glyph,
  status,
  args,
  result,
  error,
  durationMs,
  approval,
  variant = 'card',
  onApprove,
  onDeny,
  onAlwaysAllow,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  children,
  className,
  ...rest
}: ChatToolCallProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useToolCallExpansion({
    id,
    status,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
  });
  const isPending = status === 'approval-requested' && approval?.decision === undefined;
  const approvalState = useToolCallApproval({ callId: id, isPending, onApprove, onDeny });
  const title = label ?? formatToolName(name);
  const data = { variant, status, kind, autoApproved: approval?.isAutoApproved };
  return (
    <div
      ref={ref}
      {...hooks.root({ className, props: rest, data })}
      id={id}
      aria-busy={status === 'running' || undefined}
      onKeyDownCapture={approvalState.onKeyDownCapture}
    >
      <Disclosure
        className={hooks.slotClass('disclosure')}
        isExpanded={expanded}
        onExpandedChange={setExpanded}
      >
        <ToolCallTitle
          label={title}
          target={target}
          identity={{ name, source, kind, glyph }}
          status={status}
          durationMs={durationMs}
          isAutoApproved={approval?.isAutoApproved ?? false}
          triggerRef={triggerRef}
        />
        <ToolCallPanel args={args} result={result} error={status === 'failed' ? error : undefined}>
          {children}
        </ToolCallPanel>
      </Disclosure>
      {isPending || approval?.decision !== undefined ? (
        <ToolCallApproval
          label={title}
          approval={approval}
          isPending={isPending}
          state={approvalState}
          onApprove={onApprove}
          onDeny={onDeny}
          onAlwaysAllow={onAlwaysAllow}
          getFallbackFocus={() => triggerRef.current}
        />
      ) : null}
    </div>
  );
}
