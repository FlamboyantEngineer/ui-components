import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatSteps, type ChatStepsProps } from './chat-steps.js';

function Steps(props: Omit<ChatStepsProps, 'children'>) {
  return (
    <ChatSteps {...props}>
      <p>Searched trains to Porto</p>
      <p>Read the timetable</p>
      {null}
      <p>Compared the fares</p>
    </ChatSteps>
  );
}

const rootOf = (container: HTMLElement) => container.querySelector('.ui-chat-steps');

describe('ChatSteps', () => {
  it('UIC-CHAT-ACTIVITY-2.1 UIC-CHAT-ACTIVITY-2.2 UIC-CHAT-ACTIVITY-2.5 runs open and counts its children', () => {
    const { container } = render(<Steps isRunning className="extra" data-part="steps" />);
    const root = rootOf(container);
    expect(root).toHaveClass('ui-chat-steps', 'extra');
    expect(root).toHaveAttribute('data-part', 'steps');
    expect(root).toHaveAttribute('data-running', 'true');
    expect(root).toHaveAttribute('data-expanded', 'true');
    const trigger = screen.getByRole('button', { name: 'Working… · 3 steps' });
    expect(trigger).toHaveClass('ui-chat-steps__trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.querySelector('.ui-chat-steps__spinner')).toHaveAttribute('aria-hidden', 'true');
    const panel = screen.getByRole('group', { name: 'Working… · 3 steps' });
    expect(panel).toHaveClass('ui-chat-steps__panel');
    expect(panel).not.toHaveAttribute('aria-busy');
    expect(within(panel).getByText('Read the timetable')).toBeVisible();
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: [
        'ui-chat-steps__trigger',
        'ui-chat-steps__indicator',
        'ui-chat-steps__label',
        'ui-chat-steps__spinner',
        'ui-chat-steps__panel',
      ],
      callerAttributes: ['data-part'],
    });
  });

  it('UIC-CHAT-ACTIVITY-2.2 labels a running group by its title, and stays closed when it does not expand automatically', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Steps isRunning title="Checking opening hours" expandsAutomatically={false} />,
    );
    const trigger = screen.getByRole('button', { name: 'Checking opening hours' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(<Steps title="Checking opening hours" durationMs={3000} />);
    expect(screen.getByRole('button', { name: 'Worked for 3 s · 3 steps' })).toBe(trigger);
  });

  it('UIC-CHAT-ACTIVITY-2.2 reads stepCount, in the singular for one step', () => {
    const { rerender } = render(<Steps isRunning stepCount={1} />);
    expect(screen.getByRole('button', { name: 'Working… · 1 step' })).toBeInTheDocument();
    rerender(<Steps isRunning stepCount={7} />);
    expect(screen.getByRole('button', { name: 'Working… · 7 steps' })).toBeInTheDocument();
  });

  it('UIC-CHAT-ACTIVITY-2.3 collapses when the run ends, labelled with how long it took', () => {
    const { container, rerender } = render(<Steps isRunning />);
    rerender(<Steps durationMs={12_300} />);
    const root = rootOf(container);
    expect(root).not.toHaveAttribute('data-running');
    expect(root).not.toHaveAttribute('data-expanded');
    const trigger = screen.getByRole('button', { name: 'Worked for 12 s · 3 steps' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.ui-chat-steps__spinner')).toBeNull();
    rerender(<Steps stepCount={1} />);
    expect(
      screen.getByRole('button', { name: 'Worked for a moment · 1 step' }),
    ).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY');
  });

  it('UIC-CHAT-ACTIVITY-2.4 keeps steps the reader collapsed while running collapsed', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(<Steps isRunning onExpandedChange={onExpandedChange} />);
    await user.tab();
    await user.keyboard('{Enter}');
    const trigger = screen.getByRole('button', { name: 'Working… · 3 steps' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    rerender(<Steps durationMs={3000} onExpandedChange={onExpandedChange} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-ACTIVITY-2.4 keeps steps the reader opened after the run open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Steps isRunning />);
    rerender(<Steps durationMs={3000} />);
    const trigger = screen.getByRole('button', { name: 'Worked for 3 s · 3 steps' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(<Steps durationMs={3000} stepCount={3} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CHAT-ACTIVITY-2.4 starts as defaultExpanded says and follows a controlled state', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(<Steps defaultExpanded />);
    expect(screen.getByRole('button', { name: /Worked/ })).toHaveAttribute('aria-expanded', 'true');
    unmount();
    render(<Steps isRunning isExpanded={false} onExpandedChange={onExpandedChange} />);
    const trigger = screen.getByRole('button', { name: 'Working… · 3 steps' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-ACTIVITY-2.4 stays open while focus is inside when the run ends', async () => {
    const user = userEvent.setup();
    const step = <button type="button">Show the fares</button>;
    const { rerender } = render(<ChatSteps isRunning>{step}</ChatSteps>);
    await user.click(screen.getByRole('button', { name: 'Show the fares' }));
    rerender(<ChatSteps>{step}</ChatSteps>);
    const trigger = screen.getByRole('button', { name: 'Worked for a moment · 1 step' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
