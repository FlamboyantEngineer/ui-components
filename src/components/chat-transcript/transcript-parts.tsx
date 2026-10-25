import { useId, type ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Spinner } from '../progress-bar/progress-bar.js';
import { TranscriptItemContext } from './transcript-context.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';
import type { TranscriptItem } from './transcript-items.js';
import type { WindowModel } from './transcript-window.js';

/** One child, telling the message inside which child it is. */
function renderItem(item: TranscriptItem) {
  return (
    <TranscriptItemContext key={`item:${item.key}`} value={item.key}>
      {item.node}
    </TranscriptItemContext>
  );
}

/**
 * The children to draw: every one, or with virtualization the mounted ones, with a spacer as tall
 * as each run of unmounted children between them.
 */
export function renderTranscriptItems(
  items: readonly TranscriptItem[],
  mounted: readonly number[] | null,
  model: WindowModel,
): ReactNode[] {
  if (!mounted) return items.map(renderItem);
  const keys = items.map((item) => item.key);
  const nodes: ReactNode[] = [];
  const pushGap = (start: number, end: number) => {
    if (end <= start) return;
    const height = model.gapHeight(keys, start, end);
    nodes.push(<div key={`gap:${start}`} ref={model.spacerRef} style={{ height }} />);
  };
  let next = 0;
  for (const index of mounted) {
    pushGap(next, index);
    nodes.push(renderItem(items[index] as TranscriptItem));
    next = index + 1;
  }
  pushGap(next, items.length);
  return nodes;
}

/** The control shown while the reader is away from the bottom, counting what arrived meanwhile. */
export function TranscriptJumpButton({
  unseenCount,
  onJump,
}: {
  unseenCount: number;
  onJump: () => void;
}) {
  const strings = useUiStrings();
  return (
    <Button className={hooks.slotClass('jump')} size="sm" startIcon="arrow-down" onPress={onJump}>
      {unseenCount > 0 ? strings.newMessageCount(unseenCount) : strings.jumpToLatest}
    </Button>
  );
}

/** The bar shown while the first unread message is above the view, with a control to jump to it. */
export function TranscriptUnreadBar({ count, onJump }: { count: number; onJump: () => void }) {
  const strings = useUiStrings();
  const countId = useId();
  return (
    <div {...hooks.slot('unread')}>
      <span id={countId}>{strings.unreadMessageCount(count)}</span>
      <Button size="sm" startIcon="arrow-up" aria-describedby={countId} onPress={onJump}>
        {strings.jumpToUnread}
      </Button>
    </div>
  );
}

/**
 * The place above the messages while older ones remain, holding the indicator while they load. It
 * stays while older messages remain, so the indicator appearing never moves the messages.
 */
export function TranscriptHistory({ isLoading }: { isLoading: boolean }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('history')}>
      {isLoading ? <Spinner size="sm" label={strings.loadingOlderMessages} /> : null}
    </div>
  );
}
