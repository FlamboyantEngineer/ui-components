import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { toolCallKindGlyphs, type ChatToolCallKind } from '../chat-tool-call/chat-tool-call.js';
import { ActivityDisclosure, type ActivityExpansionProps } from './activity-disclosure.js';
import { toWholeSeconds } from './chat-activity.js';

export interface ChatStepsProps extends Omit<BaseProps, 'id'>, ActivityExpansionProps {
  /** The run goes on: the group is open and busy. Defaults to `false`. */
  isRunning?: boolean | undefined;
  /** What the run is doing now, such as its reasoning's latest heading; labels it while it runs. */
  title?: string | undefined;
  /** How long the run took, in milliseconds; labels a run that ended without `actions`. */
  durationMs?: number | undefined;
  /** What the run did, by kind of tool call in order; sums it up once it ended. */
  actions?: readonly ChatStepsAction[] | undefined;
  /** The steps: consecutive reasoning and tool-call parts of one reply. */
  children?: ReactNode;
}

/** How many tool calls of one kind a run made. */
export interface ChatStepsAction {
  kind: ChatToolCallKind;
  count: number;
}

const hooks = createHooks('chat-steps', [
  'trigger',
  'indicator',
  'glyph',
  'label',
  'spinner',
  'panel',
]);

/**
 * The consecutive reasoning and tool calls of one reply folded into one disclosure. While the run
 * goes on it is open (unless it does not expand automatically), labelled by its `title` or
 * "Working…"; once the run ends it collapses to one line summing up what it did ("Edited files,
 * ran a command"), led by the glyph of its first kind of call. The reader's own choice wins over both.
 */
export function ChatSteps({
  isRunning = false,
  title,
  durationMs,
  actions = [],
  children,
  className,
  ...rest
}: ChatStepsProps) {
  const strings = useUiStrings();
  const label = isRunning
    ? title || strings.chatStepsRunning
    : strings.chatStepsComplete(actions, toWholeSeconds(durationMs));
  const [first] = actions;
  return (
    <ActivityDisclosure
      {...rest}
      className={className}
      hooks={hooks}
      isActive={isRunning}
      label={label}
      glyph={
        first ? (
          <Glyph name={toolCallKindGlyphs[first.kind]} className={hooks.slotClass('glyph')} />
        ) : null
      }
      data={{ running: isRunning }}
    >
      {children}
    </ActivityDisclosure>
  );
}
