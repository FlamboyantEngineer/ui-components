import { Children, useRef, useState, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';

export interface ChatTranscriptProps extends BaseProps, AriaLabellingProps {
  /** The messages, usually `ChatMessage` elements, oldest first. */
  children?: ReactNode;
  /** Shown while there are no messages, such as suggested first questions. */
  emptyState?: ReactNode;
}

/** How far from the bottom, in pixels, the reader still counts as reading the latest message. */
const BOTTOM_SLACK = 1;

const hooks = createHooks('chat-transcript', ['log', 'empty', 'jump']);

/** Whether the reader scrolled up from the latest message. */
function isAwayFromBottom(viewport: HTMLElement): boolean {
  return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > BOTTOM_SLACK;
}

/**
 * A conversation log (`role="log"`, announced politely) that follows the latest message as messages
 * arrive and stream in, stops following once the reader scrolls up, and offers a control that jumps
 * back to the latest message and follows again.
 */
export function ChatTranscript({
  children,
  emptyState,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-details': details,
  ...rest
}: ChatTranscriptProps) {
  const strings = useUiStrings();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isAway, setIsAway] = useState(false);
  const isEmpty = Children.toArray(children).length === 0;
  const jumpToLatest = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
    // The control leaves, so focus moves to the log the reader is now following.
    viewport.focus({ preventScroll: true });
    setIsAway(false);
  };
  return (
    <div {...hooks.root({ className, props: rest, data: { empty: isEmpty } })} id={id}>
      <ScrollRegion
        ref={viewportRef}
        className={hooks.slotClass('log')}
        stickToBottom
        role="log"
        aria-label={labelledBy ? ariaLabel : (ariaLabel ?? strings.conversation)}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-details={details}
        tabIndex={0}
        onScroll={(event) => setIsAway(isAwayFromBottom(event.currentTarget))}
      >
        {isEmpty && emptyState ? <div {...hooks.slot('empty')}>{emptyState}</div> : children}
      </ScrollRegion>
      {isAway ? (
        <Button
          className={hooks.slotClass('jump')}
          size="sm"
          startIcon="arrow-down"
          onPress={jumpToLatest}
        >
          {strings.jumpToLatest}
        </Button>
      ) : null}
    </div>
  );
}

export { ChatMessage } from './chat-message.js';
export type { ChatMessageOrigin, ChatMessageProps, ChatMessageStatus } from './chat-message.js';
