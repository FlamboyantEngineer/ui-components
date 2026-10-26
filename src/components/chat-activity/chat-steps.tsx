import { Children, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ActivityDisclosure, type ActivityExpansionProps } from './activity-disclosure.js';
import { toWholeSeconds } from './chat-activity.js';

export interface ChatStepsProps extends Omit<BaseProps, 'id'>, ActivityExpansionProps {
  /** The run goes on: the group is open and busy. Defaults to `false`. */
  isRunning?: boolean | undefined;
  /** What the run is doing now, such as its reasoning's latest heading; labels it while it runs. */
  title?: string | undefined;
  /** How long the run took, in milliseconds, once it ended. */
  durationMs?: number | undefined;
  /** How many steps the group holds. Defaults to the number of children. */
  stepCount?: number | undefined;
  /** The steps: consecutive reasoning and tool-call parts of one reply. */
  children?: ReactNode;
}

const hooks = createHooks('chat-steps', ['trigger', 'indicator', 'label', 'spinner', 'panel']);

/**
 * The consecutive reasoning and tool calls of one reply folded into one disclosure. While the run
 * goes on it is open (unless it does not expand automatically), labelled by its `title` or "Working…"
 * with the number of steps; once the run ends it collapses,
 * labelled with how long it took. The reader's own choice wins over both.
 */
export function ChatSteps({
  isRunning = false,
  title,
  durationMs,
  stepCount,
  children,
  className,
  ...rest
}: ChatStepsProps) {
  const strings = useUiStrings();
  const count = stepCount ?? Children.toArray(children).length;
  const label = isRunning
    ? title || strings.chatStepsRunning(count)
    : strings.chatStepsComplete(count, toWholeSeconds(durationMs));
  return (
    <ActivityDisclosure
      {...rest}
      className={className}
      hooks={hooks}
      isActive={isRunning}
      label={label}
      data={{ running: isRunning }}
    >
      {children}
    </ActivityDisclosure>
  );
}
