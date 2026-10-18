import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { StateTimeline, type StateTimelineEntry } from './state-timeline.js';

const getNow = () => new Date(2026, 3, 20, 10, 30);

const entries: StateTimelineEntry[] = [
  {
    id: 1,
    label: 'Draft',
    time: new Date(2026, 3, 20, 9, 30).toISOString(),
    person: { name: 'Maria Santos' },
  },
  {
    id: 2,
    label: 'In review',
    tone: 'info',
    time: new Date(2026, 3, 20, 10, 0).toISOString(),
    person: { name: 'Jon Berg' },
    comment: 'Ready for a second pair of eyes.',
  },
  { id: 3, label: 'Approved', tone: 'success', time: new Date(2026, 3, 20, 10, 25).toISOString() },
];

const upcoming = [
  { id: 'released', label: 'Released' },
  { id: 'archived', label: 'Archived' },
];

const labels = () =>
  screen
    .getAllByRole('listitem')
    .map((row) => row.querySelector('.ui-state-timeline__state')?.textContent);

describe('StateTimeline', () => {
  it('UIC-STATE-TIMELINE-1.1 renders an ordered list of state badges', () => {
    const { container } = render(
      <StateTimeline entries={entries} upcoming={upcoming} getNow={getNow} />,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-state-timeline');
    expect(labels()).toEqual(['Draft', 'In review', 'Approved', 'Released', 'Archived']);
    const badges = container.querySelectorAll('.ui-state-timeline__state');
    expect(badges[0]).toHaveClass('ui-badge');
    expect(badges[0]).toHaveAttribute('data-tone', 'neutral');
    expect(badges[1]).toHaveAttribute('data-tone', 'info');
    expect(badges[1]).toHaveAttribute('data-variant', 'status');
    expect(container.querySelector('[role="status"]')).toBeNull();
    for (const row of screen.getAllByRole('listitem')) {
      expect(row.querySelector(':scope > .ui-state-timeline__marker')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
    expectHooksMatchSpec(container, 'STATE-TIMELINE', {
      slots: ['entry', 'marker', 'body', 'header', 'state', 'current', 'attribution', 'comment'],
    });
  });

  it('UIC-STATE-TIMELINE-1.2 says who made each change and when', () => {
    const { container } = render(
      <StateTimeline
        entries={[...entries, { id: 4, label: 'Closed' }]}
        upcoming={upcoming}
        getNow={getNow}
        showAvatar
        fallbackAfterDays={1}
      />,
    );
    const attribution = (index: number) =>
      screen.getAllByRole('listitem')[index]?.querySelector('.ui-state-timeline__attribution');
    expect(attribution(0)).toHaveTextContent('1 hour ago by MSMaria Santos');
    expect(attribution(0)).toHaveClass('ui-attribution');
    expect(attribution(0)?.querySelector('.ui-attribution__avatar')).not.toBeNull();
    expect(attribution(2)).toHaveTextContent('5 minutes ago');
    expect(attribution(3)).toBeNull();
    expect(attribution(4)).toBeNull();
    expectHooksMatchSpec(container, 'STATE-TIMELINE');
  });

  it('UIC-STATE-TIMELINE-1.3 renders comments under the header', () => {
    render(<StateTimeline entries={entries} getNow={getNow} />);
    const rows = screen.getAllByRole('listitem');
    expect(
      rows[1]?.querySelector('.ui-state-timeline__body > .ui-state-timeline__comment'),
    ).toHaveTextContent('Ready for a second pair of eyes.');
    expect(rows[0]?.querySelector('.ui-state-timeline__comment')).toBeNull();
  });

  it('UIC-STATE-TIMELINE-1.4 marks the current state and the upcoming ones', () => {
    render(
      <UiProvider strings={{ currentState: 'Now', upcomingState: 'Later' }}>
        <StateTimeline entries={entries} upcoming={upcoming} getNow={getNow} />
      </UiProvider>,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-status'))).toEqual([
      'past',
      'past',
      'current',
      'upcoming',
      'upcoming',
    ]);
    expect(rows[2]).toHaveAttribute('aria-current', 'step');
    expect(rows[2]?.querySelector('.ui-state-timeline__current')).toHaveTextContent('Now');
    expect(rows.filter((row) => row.hasAttribute('aria-current'))).toHaveLength(1);
    expect(rows[3]).toHaveTextContent('ReleasedLater');
    expect(within(rows[3]!).getByText('Later').style.position).toBe('absolute');
    expect(rows[1]).not.toHaveTextContent('Later');
  });

  it('UIC-STATE-TIMELINE-1.5 lists the newest first when descending', () => {
    const { rerender } = render(
      <StateTimeline entries={entries} upcoming={upcoming} getNow={getNow} />,
    );
    expect(screen.getByRole('list')).toHaveAttribute('data-direction', 'ascending');
    rerender(
      <StateTimeline
        entries={entries}
        upcoming={upcoming}
        getNow={getNow}
        direction="descending"
      />,
    );
    expect(screen.getByRole('list')).toHaveAttribute('data-direction', 'descending');
    expect(labels()).toEqual(['Archived', 'Released', 'Approved', 'In review', 'Draft']);
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step');
  });

  it('UIC-STATE-TIMELINE-1.6 forwards id, ref, class names and caller attributes', () => {
    const ref = createRef<HTMLOListElement>();
    const { container } = render(
      <StateTimeline
        entries={entries}
        getNow={getNow}
        id="history"
        ref={ref}
        className="host"
        data-direction="caller"
        data-test="timeline"
      />,
    );
    const list = screen.getByRole('list');
    expect(ref.current).toBe(list);
    expect(list).toHaveAttribute('id', 'history');
    expect(list).toHaveClass('ui-state-timeline', 'host');
    expect(list).toHaveAttribute('data-direction', 'ascending');
    expect(list).toHaveAttribute('data-test', 'timeline');
    expectHooksMatchSpec(container, 'STATE-TIMELINE', { callerAttributes: ['data-test'] });
  });

  it('UIC-STATE-TIMELINE-2.1 names the list', () => {
    const { rerender } = render(<StateTimeline entries={entries} getNow={getNow} />);
    expect(screen.getByRole('list', { name: 'State history' })).toBeInTheDocument();
    rerender(<StateTimeline entries={entries} getNow={getNow} aria-label="Approval history" />);
    expect(screen.getByRole('list', { name: 'Approval history' })).toBeInTheDocument();
  });

  it('UIC-STATE-TIMELINE-2.2 adds no tab stop beyond its times', async () => {
    render(
      <StateTimeline
        entries={entries.map((entry) => ({ ...entry, time: null }))}
        getNow={getNow}
      />,
    );
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });
});
