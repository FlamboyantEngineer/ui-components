import { useRef, useState, type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { Disclosure, DisclosurePanel } from '../disclosure/disclosure.js';
import { formatToolName } from './format-tool-call.js';
import { ToolCallApproval, type ChatToolCallApproval } from './tool-call-approval.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
import {
  ToolCallBody,
  ToolCallError,
  ToolCallTitle,
  type ChatToolCallKind,
  type ChatToolCallStatus,
} from './tool-call-parts.js';
import { useToolCallApproval } from './use-tool-call-approval.js';

export type { ChatToolCallApproval, ChatToolCallDecision } from './tool-call-approval.js';
export { toolCallKindGlyphs } from './tool-call-parts.js';
export type { ChatToolCallKind, ChatToolCallStatus } from './tool-call-parts.js';

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

export interface ChatToolCallProps extends Omit<BaseProps, 'id'>, ChatToolCallData {
  /** How the call shows, published as `data-variant`: `card` (the default) or `row`. */
  variant?: ChatToolCallVariant | undefined;
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
  'status' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange'
>;

/**
 * The card's expanded state. Uncontrolled, it follows the status (open while an approval is
 * requested) until the reader toggles it or `defaultExpanded` sets it. A failure stays closed.
 */
function useToolCallExpansion({
  status,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
}: ExpansionOptions): [boolean, (next: boolean) => void] {
  const [toggled, setToggled] = useState<boolean>();
  const shown = isExpanded ?? toggled ?? defaultExpanded ?? status === 'approval-requested';
  const setExpanded = (next: boolean) => {
    if (isExpanded === undefined) setToggled(next);
    onExpandedChange?.(next);
  };
  return [shown, setExpanded];
}

/** The card's trigger, where focus goes when the approval leaves while holding it. */
function findTrigger(root: HTMLElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`.${hooks.slotClass('heading')} button`) ?? null;
}

/**
 * One call of a tool by an assistant, as a collapsible card: a trigger with the status, the label
 * and the duration, a body with the error of a failed call and the arguments and result as JSON
 * (or a custom body), and, when the call asks for approval, Approve, Deny with a reason and Always
 * allow, with keyboard shortcuts, then the decision.
 */
export function ChatToolCall({
  id,
  name,
  label,
  target,
  kind = 'other',
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useToolCallExpansion({
    status,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
  });
  const isPending = status === 'approval-requested' && approval?.decision === undefined;
  const approvalState = useToolCallApproval({ isPending, onApprove, onDeny });
  const title = label ?? formatToolName(name);
  return (
    <div
      {...hooks.root({
        className,
        props: rest,
        data: { variant, status, kind, autoApproved: approval?.isAutoApproved },
      })}
      id={id}
      ref={rootRef}
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
          kind={kind}
          status={status}
          durationMs={durationMs}
          isAutoApproved={approval?.isAutoApproved ?? false}
        />
        <DisclosurePanel className={hooks.slotClass('body')}>
          {status === 'failed' && error ? <ToolCallError message={error} /> : null}
          <ToolCallBody args={args} result={result}>
            {children}
          </ToolCallBody>
        </DisclosurePanel>
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
          getFallbackFocus={() => findTrigger(rootRef.current)}
        />
      ) : null}
    </div>
  );
}
