import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { ChatPlanStep, ChatPlanStepStatus } from './chat-activity.js';
import { ChatPlan } from './chat-plan.js';

afterEach(() => vi.useRealTimers());

const allStatuses: ChatPlanStep[] = [
  { id: 'hotel', label: 'Book the hotel', status: 'done' },
  { id: 'trains', label: 'Compare trains', status: 'in-progress' },
  { id: 'bags', label: 'Pack the bags', status: 'pending' },
  { id: 'museum', label: 'Reserve the museum', status: 'failed' },
  { id: 'cafe', label: 'Find a café', status: 'skipped' },
];

/** The plan's steps with the given statuses, in order. */
function withStatuses(...statuses: ChatPlanStepStatus[]): ChatPlanStep[] {
  return statuses.map((status, index) => ({ ...requireDefined(allStatuses[index]), status }));
}

describe('ChatPlan', () => {
  it('UIC-CHAT-ACTIVITY-3.1 UIC-CHAT-ACTIVITY-3.3 UIC-CHAT-ACTIVITY-3.5 lists the steps under the title and progress', () => {
    const { container } = render(
      <ChatPlan
        title="Weekend in Porto"
        steps={allStatuses}
        className="extra"
        id="plan"
        data-part="plan"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-chat-plan', 'extra');
    expect(root).toHaveAttribute('id', 'plan');
    expect(root).toHaveAttribute('data-part', 'plan');
    expect(root.querySelector('.ui-chat-plan__title')).toHaveTextContent('Weekend in Porto');
    expect(root.querySelector('.ui-chat-plan__progress')).toHaveTextContent('1 of 5 done');
    const list = screen.getByRole('list', { name: 'Weekend in Porto' });
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-chat-plan__list');
    expect(list).toHaveAccessibleDescription('1 of 5 done');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.ui-chat-plan__label')?.textContent)).toEqual(
      allStatuses.map((step) => step.label),
    );
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: [
        'ui-chat-plan__header',
        'ui-chat-plan__title',
        'ui-chat-plan__progress',
        'ui-chat-plan__list',
        'ui-chat-plan__step',
        'ui-chat-plan__glyph',
        'ui-chat-plan__spinner',
        'ui-chat-plan__label',
      ],
      callerAttributes: ['data-part'],
    });
  });

  it('UIC-CHAT-ACTIVITY-3.1 names an untitled plan by the provider string', () => {
    const { container } = render(<ChatPlan steps={withStatuses('done', 'done')} />);
    expect(container.querySelector('.ui-chat-plan__title')).toBeNull();
    expect(screen.getByRole('list', { name: 'Plan' })).toHaveAccessibleDescription('2 of 2 done');
  });

  it('UIC-CHAT-ACTIVITY-3.2 shows each status with a glyph and status words', () => {
    render(<ChatPlan steps={allStatuses} />);
    const items = screen.getAllByRole('listitem');
    const glyphs = items.map(
      (item) => item.querySelector('.ui-chat-plan__glyph')?.getAttribute('data-glyph') ?? null,
    );
    expect(glyphs).toEqual(['success', null, 'pending', 'error', 'skipped']);
    expect(items.map((item) => item.getAttribute('data-status'))).toEqual([
      'done',
      'in-progress',
      'pending',
      'failed',
      'skipped',
    ]);
    expect(items.map((item) => item.textContent)).toEqual([
      'Book the hotel Done',
      'Compare trains In progress',
      'Pack the bags Pending',
      'Reserve the museum Failed',
      'Find a café Skipped',
    ]);
    const current = requireDefined(items[1]);
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current.querySelector('.ui-chat-plan__spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(requireDefined(items[0]).querySelector('.ui-chat-plan__glyph')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('UIC-CHAT-ACTIVITY-3.4 announces status changes politely, at most once every two seconds', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <ChatPlan steps={withStatuses('in-progress', 'pending', 'pending')} />,
    );
    const status = screen.getByRole('status');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(status).toHaveTextContent('');
    rerender(<ChatPlan steps={withStatuses('done', 'in-progress', 'pending')} />);
    expect(status).toHaveTextContent('Book the hotel: done, Compare trains: in progress');
    rerender(<ChatPlan steps={withStatuses('done', 'done', 'pending')} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<ChatPlan steps={withStatuses('done', 'done', 'in-progress')} />);
    expect(status).toHaveTextContent('Book the hotel: done, Compare trains: in progress');
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(status).toHaveTextContent('Book the hotel: done, Compare trains: in progress');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent('Compare trains: done, Pack the bags: in progress');
  });

  it('UIC-CHAT-ACTIVITY-3.4 announces nothing for steps added as pending, and reads a repeated change again', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ChatPlan steps={withStatuses('in-progress')} />);
    const status = screen.getByRole('status');
    rerender(<ChatPlan steps={withStatuses('in-progress', 'pending')} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(status).toHaveTextContent('');
    rerender(<ChatPlan steps={withStatuses('failed', 'pending')} />);
    expect(status).toHaveTextContent('Book the hotel: failed');
    const first = status.firstElementChild;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<ChatPlan steps={withStatuses('in-progress', 'pending')} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<ChatPlan steps={withStatuses('failed', 'pending')} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(status).toHaveTextContent('Book the hotel: failed');
    expect(status.firstElementChild).not.toBe(first);
  });
});
