import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import {
  EventTimeline,
  type EventTimelineEvent,
  type EventTimelineProps,
} from './event-timeline.js';

const run: EventTimelineEvent[] = [
  { id: 'arm', label: 'Armed', at: 0 },
  { id: 'fire', label: 'Fired', at: 2.5, duration: 1.5, tone: 'warning', details: 'Held open' },
  { id: 'settle', label: 'Settled', at: 7, tone: 'success' },
];

function renderTimeline(props: Partial<EventTimelineProps> = {}, locale = 'en-US') {
  return render(
    <UiProvider locale={locale}>
      <EventTimeline label="Run" events={run} range={{ start: 0, end: 10 }} unit="ms" {...props} />
    </UiProvider>,
  );
}

const eventButton = (name: string) => screen.getByRole('button', { name });

const offsets = (container: HTMLElement, property: 'left' | 'right' = 'left') =>
  [...container.querySelectorAll<HTMLElement>('.ui-event-timeline__event')].map(
    (element) => element.style[property],
  );

describe('EventTimeline', () => {
  it('UIC-EVENT-TIMELINE-1.1 UIC-EVENT-TIMELINE-2.1 renders a named group with its parts and hooks', async () => {
    const user = userEvent.setup();
    const { container } = renderTimeline({ showTable: true });
    const group = screen.getByRole('group', { name: 'Run' });
    expect(group).toHaveClass('ui-event-timeline');
    expect(group.querySelector('.ui-event-timeline__axis')).toHaveAttribute('aria-hidden', 'true');
    await user.click(eventButton('Fired'));
    expect([...group.children].map((child) => child.className)).toEqual([
      'ui-event-timeline__label',
      'ui-event-timeline__plot',
      'ui-event-timeline__axis',
      'ui-event-timeline__details',
      'ui-prose-table ui-event-timeline__table',
    ]);
    expectHooksMatchSpec(container, 'EVENT-TIMELINE', {
      slots: [
        'label',
        'plot',
        'event',
        'event-label',
        'axis',
        'tick',
        'tick-label',
        'unit',
        'details',
        'details-label',
        'details-list',
        'details-body',
        'table',
      ],
    });
  });

  it('UIC-EVENT-TIMELINE-1.1 UIC-EVENT-TIMELINE-2.1 lets aria-label name the group when the label renders nothing', () => {
    const { container } = renderTimeline({ label: false, 'aria-label': 'Recorded run' });
    expect(screen.getByRole('group', { name: 'Recorded run' })).toBeInTheDocument();
    expect(container.querySelector('.ui-event-timeline__label')).toBeNull();
  });

  it('UIC-EVENT-TIMELINE-1.2 publishes kind and tone and keeps numeric and text ids apart', () => {
    const { container, rerender } = render(
      <EventTimeline
        aria-label="Run"
        events={[
          { id: 1, label: 'Numeric', at: 1 },
          { id: '1', label: 'Text', at: 1, duration: 2, tone: 'danger' },
        ]}
      />,
    );
    expect(eventButton('Numeric')).toHaveAttribute('data-kind', 'marker');
    expect(eventButton('Numeric')).toHaveAttribute('data-tone', 'neutral');
    const text = eventButton('Text');
    expect(text).toHaveAttribute('data-kind', 'interval');
    expect(text).toHaveAttribute('data-tone', 'danger');
    rerender(
      <EventTimeline aria-label="Run" events={[{ id: '1', label: 'Text', at: 1, duration: 2 }]} />,
    );
    expect(eventButton('Text')).toBe(text);
    expect(container.querySelectorAll('.ui-event-timeline__event')).toHaveLength(1);
  });

  it('UIC-EVENT-TIMELINE-1.3 offsets events and sizes intervals as exact shares of the range', () => {
    const { container } = renderTimeline();
    expect(offsets(container)).toEqual(['0%', '25%', '70%']);
    expect(eventButton('Fired').style.width).toBe('15%');
    expect(eventButton('Armed').style.width).toBe('');
  });

  it('UIC-EVENT-TIMELINE-1.3 offsets from the right when the locale reads right to left', () => {
    const { container } = renderTimeline({}, 'ar-EG');
    expect(offsets(container, 'right')).toEqual(['0%', '25%', '70%']);
    expect(offsets(container)).toEqual(['', '', '']);
  });

  it('UIC-EVENT-TIMELINE-1.3 leaves out events outside the range and marks cut intervals', () => {
    const { container } = renderTimeline({ range: { start: 3, end: 5 }, showTable: true });
    expect(container.querySelectorAll('.ui-event-timeline__event')).toHaveLength(1);
    expect(eventButton('Fired')).toHaveAttribute('data-clipped', 'start');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4);
  });

  it('UIC-EVENT-TIMELINE-1.4 stacks coincident events in lanes', () => {
    const { container } = render(
      <EventTimeline
        aria-label="Run"
        range={{ start: 0, end: 10 }}
        events={[
          { id: 'a', label: 'First', at: 4 },
          { id: 'b', label: 'Second', at: 4 },
          { id: 'c', label: 'Later', at: 6 },
        ]}
      />,
    );
    const root = container.querySelector<HTMLElement>('.ui-event-timeline');
    expect(root?.style.getPropertyValue('--ui-event-timeline-lanes')).toBe('2');
    expect(
      ['First', 'Second', 'Later'].map((name) =>
        eventButton(name).style.getPropertyValue('--ui-event-lane'),
      ),
    ).toEqual(['0', '1', '0']);
  });

  it('UIC-EVENT-TIMELINE-1.4 keeps eventSpacing free after each event in its lane', () => {
    const events = [
      { id: 'a', label: 'First', at: 0 },
      { id: 'b', label: 'Near', at: 1 },
    ];
    const lanes = () =>
      ['First', 'Near'].map((name) => eventButton(name).style.getPropertyValue('--ui-event-lane'));
    const { rerender } = render(
      <EventTimeline aria-label="Run" range={{ start: 0, end: 10 }} events={events} />,
    );
    expect(lanes()).toEqual(['0', '1']);
    rerender(
      <EventTimeline
        aria-label="Run"
        range={{ start: 0, end: 10 }}
        events={events}
        eventSpacing={Number.NaN}
      />,
    );
    expect(lanes()).toEqual(['0', '0']);
    rerender(
      <EventTimeline
        aria-label="Run"
        range={{ start: 0, end: 10 }}
        events={events}
        eventSpacing={0.05}
      />,
    );
    expect(lanes()).toEqual(['0', '0']);
  });

  it('UIC-EVENT-TIMELINE-1.5 writes ticks for the locale and the unit after the axis', () => {
    const { container } = renderTimeline({}, 'fr-FR');
    const labels = [...container.querySelectorAll('.ui-event-timeline__tick-label')].map(
      (label) => label.textContent,
    );
    expect(labels).toEqual(['0', '2', '4', '6', '8', '10']);
    expect(container.querySelector('.ui-event-timeline__unit')).toHaveTextContent('ms');
  });

  it('UIC-EVENT-TIMELINE-1.5 uses the caller formatters for values and ticks', async () => {
    const user = userEvent.setup();
    const formatValue = vi.fn((value: number) => `${value * 1000} µs`);
    const { container } = renderTimeline({
      formatValue,
      formatAxisValue: (value) => `+${value}`,
      showTable: true,
    });
    expect(container.querySelector('.ui-event-timeline__tick-label')).toHaveTextContent('+0');
    expect(eventButton('Fired')).toHaveAccessibleDescription('At 2500 µs, lasting 1500 µs');
    await user.click(eventButton('Fired'));
    const details = container.querySelector<HTMLElement>('.ui-event-timeline__details');
    expect(within(details ?? document.body).getByText('2500 µs')).toBeInTheDocument();
    expect(formatValue).toHaveBeenCalledWith(2.5);
    expect(formatValue).toHaveBeenCalledWith(1.5);
  });

  it('UIC-EVENT-TIMELINE-1.5 writes microsecond values exactly with the unit by default', () => {
    render(
      <EventTimeline
        aria-label="Pulses"
        unit="s"
        events={[{ id: 'p', label: 'Pulse', at: 0.0000025, duration: 0.0000004 }]}
      />,
    );
    expect(eventButton('Pulse')).toHaveAccessibleDescription(
      'At 0.0000025\u00a0s, lasting 0.0000004\u00a0s',
    );
  });

  it('UIC-EVENT-TIMELINE-1.6 shows no data and publishes data-empty without drawn events', () => {
    const { container } = renderTimeline({ events: [{ id: 'x', label: 'Lost', at: Number.NaN }] });
    const root = screen.getByRole('group', { name: 'Run' });
    expect(root).toHaveAttribute('data-empty', 'true');
    expect(container.querySelector('.ui-event-timeline__empty')).toHaveTextContent('No data');
    expect(container.querySelector('.ui-event-timeline__plot')).toBeNull();
    expect(container.querySelectorAll('.ui-event-timeline__tick').length).toBeGreaterThan(1);
    expectHooksMatchSpec(container, 'EVENT-TIMELINE', { slots: ['empty', 'axis'] });
  });

  it('UIC-EVENT-TIMELINE-1.7 forwards caller attributes and keeps hook values', () => {
    const ref = createRef<HTMLDivElement>();
    renderTimeline({
      ref,
      id: 'run',
      className: 'host',
      'data-empty': 'caller',
      'data-testid': 'timeline',
    });
    const root = screen.getByRole('group', { name: 'Run' });
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'run');
    expect(root).toHaveClass('ui-event-timeline', 'host');
    expect(root).toHaveAttribute('data-testid', 'timeline');
    expect(root).not.toHaveAttribute('data-empty');
  });

  it('UIC-EVENT-TIMELINE-2.1 describes each event by its time', () => {
    renderTimeline();
    expect(eventButton('Armed')).toHaveAccessibleDescription('At 0\u00a0ms');
    expect(eventButton('Fired')).toHaveAccessibleDescription('At 2.5\u00a0ms, lasting 1.5\u00a0ms');
  });

  it('UIC-EVENT-TIMELINE-2.1 takes one tab stop and moves along time order with arrows, Home and End', async () => {
    const user = userEvent.setup();
    renderTimeline();
    await user.tab();
    expect(eventButton('Armed')).toHaveFocus();
    expect(eventButton('Fired')).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowRight}');
    expect(eventButton('Fired')).toHaveFocus();
    await user.keyboard('{End}');
    expect(eventButton('Settled')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(eventButton('Settled')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(eventButton('Armed')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(eventButton('Armed')).toHaveFocus();
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(eventButton('Armed')).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('UIC-EVENT-TIMELINE-2.1 swaps the arrow keys right to left', async () => {
    const user = userEvent.setup();
    renderTimeline({}, 'ar-EG');
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(eventButton('Fired')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(eventButton('Armed')).toHaveFocus();
  });

  it('UIC-EVENT-TIMELINE-2.2 shows the focused or pressed event in the details', async () => {
    const user = userEvent.setup();
    const onCurrentKeyChange = vi.fn();
    const { container } = renderTimeline({ onCurrentKeyChange });
    expect(container.querySelector('.ui-event-timeline__details')).toBeNull();
    await user.click(eventButton('Fired'));
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('fire');
    const fired = eventButton('Fired');
    expect(fired).toHaveAttribute('data-current', 'true');
    expect(fired).toHaveAttribute('aria-current', 'true');
    expect(fired).toHaveAccessibleDescription('At 2.5\u00a0ms, lasting 1.5\u00a0ms Held open');
    const details = container.querySelector<HTMLElement>('.ui-event-timeline__details');
    expect(details?.querySelector('.ui-event-timeline__details-label')).toHaveTextContent('Fired');
    const list = details?.querySelector('.ui-event-timeline__details-list');
    expect(list?.textContent).toBe('Start2.5\u00a0msDuration1.5\u00a0ms');
    await user.keyboard('{ArrowRight}');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('settle');
    expect(list?.textContent).toBe('Start7\u00a0ms');
    expect(container.querySelector('.ui-event-timeline__details-body')).toBeNull();
    expect(eventButton('Settled')).toHaveAccessibleDescription('At 7\u00a0ms');
  });

  it('UIC-EVENT-TIMELINE-2.2 follows a controlled current key and the tab stop with it', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [key, setKey] = useState<Key | null>('settle');
      return (
        <>
          <button type="button" onClick={() => setKey('arm')}>
            Show first
          </button>
          <EventTimeline
            aria-label="Run"
            events={run}
            currentKey={key}
            onCurrentKeyChange={setKey}
          />
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(eventButton('Settled')).toHaveAttribute('tabindex', '0');
    expect(container.querySelector('.ui-event-timeline__details-label')).toHaveTextContent(
      'Settled',
    );
    await user.click(screen.getByRole('button', { name: 'Show first' }));
    expect(container.querySelector('.ui-event-timeline__details-label')).toHaveTextContent('Armed');
    expect(eventButton('Armed')).toHaveAttribute('tabindex', '0');
  });

  it('UIC-EVENT-TIMELINE-2.2 keeps the details of an event outside the range and drops those of a removed one', () => {
    const { container, rerender } = renderTimeline({
      defaultCurrentKey: 'settle',
      range: { start: 0, end: 5 },
    });
    expect(screen.queryByRole('button', { name: 'Settled' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-event-timeline__details-label')).toHaveTextContent(
      'Settled',
    );
    expect(eventButton('Armed')).toHaveAttribute('tabindex', '0');
    rerender(
      <UiProvider locale="en-US">
        <EventTimeline label="Run" events={run.slice(0, 2)} defaultCurrentKey="settle" />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-event-timeline__details')).toBeNull();
  });

  it('UIC-EVENT-TIMELINE-3.1 lists every readable event with the same values in a companion table', () => {
    renderTimeline({
      showTable: true,
      events: [
        ...run,
        { id: 'late', label: 'Late', at: 12 },
        { id: 'x', label: 'X', at: Infinity },
      ],
    });
    const table = screen.getByRole('table', { name: 'Run' });
    expect(table).toHaveClass('ui-event-timeline__table');
    const rows = within(table).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'EventStartDuration',
      'Armed0\u00a0ms',
      'Fired2.5\u00a0ms1.5\u00a0ms',
      'Settled7\u00a0ms',
      'Late12\u00a0ms',
    ]);
    expect(within(rows[2] ?? table).getByRole('rowheader')).toHaveTextContent('Fired');
  });

  it('UIC-EVENT-TIMELINE-3.1 names the table by aria-label, hides it by default and leaves it out without events', () => {
    const { rerender } = render(<EventTimeline aria-label="Pulses" events={run} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    rerender(<EventTimeline aria-label="Pulses" events={run} showTable />);
    expect(screen.getByRole('table', { name: 'Pulses' })).toBeInTheDocument();
    rerender(<EventTimeline aria-label="Pulses" events={[]} showTable />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
