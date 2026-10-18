import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ActivityFeed, type ActivityFeedItem } from './activity-feed.js';
import { groupByDay } from './day-groups.js';

const getNow = () => new Date(2026, 3, 20, 10, 30);
const maria = { name: 'Maria Santos' };
const jon = { name: 'Jon Berg' };

const items: ActivityFeedItem[] = [
  {
    id: 'a',
    person: maria,
    action: 'commented on',
    target: 'Report.pdf',
    time: '2026-04-20T10:25:00',
    detail: 'Looks good to me.',
  },
  { id: 'b', person: jon, action: 'renamed', target: 'Budget', time: '2026-04-20T08:00:00' },
  { id: 'c', action: 'Nightly import finished', icon: 'refresh', time: '2026-04-19T23:10:00' },
  { id: 'd', person: { name: '  ' }, action: 'joined', time: '2026-04-14' },
  { id: 'e', person: maria, action: 'left', time: 'not a time' },
];

const summaries = (scope: HTMLElement) =>
  [...scope.querySelectorAll('.ui-activity-feed__summary')].map((node) => node.textContent);

afterEach(() => vi.unstubAllGlobals());

describe('ActivityFeed', () => {
  it('UIC-ACTIVITY-FEED-1.1 lists the entries in the order given', () => {
    const { container } = render(<ActivityFeed items={items} groupBy="none" getNow={getNow} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-activity-feed');
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-activity-feed__list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(summaries(list)).toEqual([
      'Maria Santos commented on Report.pdf',
      'Jon Berg renamed Budget',
      'Nightly import finished',
      'Unnamed joined',
      'Maria Santos left',
    ]);
    expectHooksMatchSpec(container, 'ACTIVITY-FEED', {
      slots: ['list', 'entry', 'marker', 'body', 'summary', 'actor', 'action', 'target'],
    });
  });

  it('UIC-ACTIVITY-FEED-1.2 draws each entry with its marker, time and detail', () => {
    const { container } = render(
      <ActivityFeed items={items} groupBy="none" getNow={getNow} fallbackAfterDays={3} />,
    );
    const entries = screen.getAllByRole('listitem');
    const marker = (index: number) => entries[index]!.querySelector('.ui-activity-feed__marker');
    expect(marker(0)).toHaveAttribute('aria-hidden', 'true');
    expect(marker(0)?.querySelector('.ui-avatar')).toHaveTextContent('MS');
    expect(marker(2)?.querySelector('.ui-icon')).not.toBeNull();
    expect(marker(2)?.querySelector('.ui-avatar')).toBeNull();
    const time = (index: number) => entries[index]!.querySelector('.ui-activity-feed__time');
    expect(time(0)).toHaveClass('ui-relative-time');
    expect(time(0)).toHaveTextContent('5 minutes ago');
    expect(time(0)).toHaveAttribute('datetime', '2026-04-20T10:25:00');
    expect(time(3)).toHaveTextContent(/^Apr 14, 2026$/);
    expect(time(4)).toHaveTextContent('Unknown time');
    expect(
      entries[0]!.querySelector('.ui-activity-feed__body > .ui-activity-feed__detail'),
    ).toHaveTextContent('Looks good to me.');
    expect(entries[1]!.querySelector('.ui-activity-feed__detail')).toBeNull();
    expect(entries[2]!.querySelector('.ui-activity-feed__actor')).toBeNull();
    expect(entries[3]!.querySelector('.ui-activity-feed__target')).toBeNull();
    expectHooksMatchSpec(container, 'ACTIVITY-FEED', { slots: ['time', 'detail'] });
  });

  it('UIC-ACTIVITY-FEED-1.3 groups entries under a heading per day', () => {
    const { container, rerender } = render(<ActivityFeed items={items} getNow={getNow} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-group-by', 'day');
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Today',
      'Yesterday',
      'Tuesday, April 14, 2026',
      'Unknown time',
    ]);
    const today = screen.getByRole('list', { name: 'Today' });
    expect(today).toHaveClass('ui-activity-feed__entries');
    expect(summaries(today)).toEqual([
      'Maria Santos commented on Report.pdf',
      'Jon Berg renamed Budget',
    ]);
    expect(headings[0]!.closest('li')).toHaveClass('ui-activity-feed__group');
    expectHooksMatchSpec(container, 'ACTIVITY-FEED', { slots: ['group', 'day', 'entries'] });
    rerender(<ActivityFeed items={items} getNow={getNow} headingLevel={4} />);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(4);
    rerender(<ActivityFeed items={items} getNow={getNow} groupBy="none" />);
    expect(root).toHaveAttribute('data-group-by', 'none');
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('UIC-ACTIVITY-FEED-1.3 splits runs by local calendar day, reading near days in words', () => {
    const now = new Date(2026, 3, 20, 10, 30);
    const groups = groupByDay(
      [
        { time: '2026-04-21T09:00:00' },
        { time: '2026-04-20' },
        { time: '2026-04-20T00:00:00' },
        { time: '2026-04-19T23:59:00' },
        { time: 'nope' },
        { time: 'still nope' },
        { time: '2026-04-20T12:00:00' },
      ],
      { now, locale: 'en-US', unknownLabel: 'Unknown' },
    );
    expect(groups.map(({ day, label, items: run }) => [day, label, run.length])).toEqual([
      ['2026-04-21', 'Tomorrow', 1],
      ['2026-04-20', 'Today', 2],
      ['2026-04-19', 'Yesterday', 1],
      ['', 'Unknown', 2],
      ['2026-04-20', 'Today', 1],
    ]);
    const french = groupByDay([{ time: '2026-04-19' }], { now, locale: 'fr-FR', unknownLabel: '' });
    expect(french[0]?.label).toBe('Hier');
  });

  it('UIC-ACTIVITY-FEED-1.4 shows the filter above the feed', () => {
    const { container, rerender } = render(
      <ActivityFeed items={items} getNow={getNow} filter={<button type="button">All</button>} />,
    );
    const filter = container.querySelector('.ui-activity-feed > .ui-activity-feed__filter');
    expect(filter).toHaveTextContent('All');
    expect(filter?.nextElementSibling).toHaveClass('ui-activity-feed__list');
    rerender(<ActivityFeed items={items} getNow={getNow} filter={null} />);
    expect(container.querySelector('.ui-activity-feed__filter')).toBeNull();
  });

  it('UIC-ACTIVITY-FEED-1.5 forwards id, ref, class names and caller attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ActivityFeed
        items={items}
        getNow={getNow}
        id="feed"
        ref={ref}
        className="host"
        data-group-by="caller"
        data-test="feed"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'feed');
    expect(root).toHaveClass('ui-activity-feed', 'host');
    expect(root).toHaveAttribute('data-group-by', 'day');
    expect(root).toHaveAttribute('data-test', 'feed');
    expectHooksMatchSpec(container, 'ACTIVITY-FEED', { callerAttributes: ['data-test'] });
  });

  it('UIC-ACTIVITY-FEED-2.1 loads older entries as the end comes into view', async () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(readonly callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          queueMicrotask(() =>
            this.callback(
              [{ target, isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            ),
          );
        }
        unobserve() {}
        disconnect() {}
      },
    );
    const onLoadMore = vi.fn();
    const { container, rerender } = render(
      <ActivityFeed items={items} getNow={getNow} onLoadMore={onLoadMore} />,
    );
    const control = container.querySelector('.ui-activity-feed__load-more');
    expect(control).toHaveClass('ui-load-more');
    expect(control?.previousElementSibling).toHaveClass('ui-activity-feed__list');
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
    expectHooksMatchSpec(container, 'ACTIVITY-FEED', { slots: ['load-more'] });
    rerender(<ActivityFeed items={items} getNow={getNow} onLoadMore={onLoadMore} isLoading />);
    expect(container.querySelector('.ui-activity-feed__load-more')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    rerender(<ActivityFeed items={items} getNow={getNow} />);
    expect(container.querySelector('.ui-activity-feed__load-more')).toBeNull();
    rerender(<ActivityFeed items={[]} getNow={getNow} onLoadMore={onLoadMore} />);
    expect(container.querySelector('.ui-activity-feed__load-more')).toBeNull();
  });

  it('UIC-ACTIVITY-FEED-2.2 is busy while it loads', () => {
    const { container, rerender } = render(
      <ActivityFeed items={items} getNow={getNow} isLoading />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(screen.getByRole('list', { name: 'Activity' })).toHaveAttribute('aria-busy', 'true');
    rerender(<ActivityFeed items={items} getNow={getNow} />);
    expect(root).not.toHaveAttribute('data-loading');
    expect(screen.getByRole('list', { name: 'Activity' })).not.toHaveAttribute('aria-busy');
    rerender(<ActivityFeed items={[]} getNow={getNow} isLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('UIC-ACTIVITY-FEED-2.3 shows an empty state without entries', () => {
    const { container, rerender } = render(
      <UiProvider strings={{ noActivity: 'Nothing happened.' }}>
        <ActivityFeed items={[]} getNow={getNow} />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-empty-state')).toHaveTextContent('Nothing happened.');
    rerender(
      <ActivityFeed items={[]} getNow={getNow} renderEmptyState={() => <p>Quiet so far</p>} />,
    );
    expect(screen.getByText('Quiet so far')).toBeInTheDocument();
    expect(container.querySelector('.ui-empty-state')).toBeNull();
  });

  it('UIC-ACTIVITY-FEED-3.1 names the list', () => {
    const { rerender } = render(<ActivityFeed items={items} getNow={getNow} />);
    expect(screen.getByRole('list', { name: 'Activity' })).toHaveClass('ui-activity-feed__list');
    rerender(
      <>
        <h2 id="title">Recent changes</h2>
        <ActivityFeed
          items={items}
          getNow={getNow}
          aria-labelledby="title"
          aria-describedby="title"
        />
      </>,
    );
    const list = screen.getByRole('list', { name: 'Recent changes' });
    expect(list).toHaveAttribute('aria-describedby', 'title');
    expect(list).not.toHaveAttribute('aria-label');
    rerender(<ActivityFeed items={items} getNow={getNow} aria-label="Team activity" />);
    expect(screen.getByRole('list', { name: 'Team activity' })).toBeInTheDocument();
  });

  it('UIC-ACTIVITY-FEED-3.2 adds no tab stop of its own', async () => {
    render(
      <ActivityFeed
        items={items.map((item) => ({ ...item, time: '2026-01-02' }))}
        getNow={getNow}
      />,
    );
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });
});
