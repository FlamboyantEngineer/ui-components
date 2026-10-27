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

const actions: ChatStepsProps['actions'] = [
  { kind: 'edit', count: 2 },
  { kind: 'read', count: 3 },
  { kind: 'command', count: 1 },
];

describe('ChatSteps', () => {
  it('UIC-CHAT-ACTIVITY-2.1 UIC-CHAT-ACTIVITY-2.2 UIC-CHAT-ACTIVITY-2.5 runs open, labelled "Working…"', () => {
    const { container } = render(<Steps isRunning className="extra" data-part="steps" />);
    const root = rootOf(container);
    expect(root).toHaveClass('ui-chat-steps', 'extra');
    expect(root).toHaveAttribute('data-part', 'steps');
    expect(root).toHaveAttribute('data-running', 'true');
    expect(root).toHaveAttribute('data-expanded', 'true');
    const trigger = screen.getByRole('button', { name: 'Working…' });
    expect(trigger).toHaveClass('ui-chat-steps__trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.querySelector('.ui-chat-steps__spinner')).toHaveAttribute('aria-hidden', 'true');
    const panel = screen.getByRole('group', { name: 'Working…' });
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
    rerender(<Steps title="Checking opening hours" actions={actions} />);
    expect(
      screen.getByRole('button', { name: 'Edited files, read files, and ran a command' }),
    ).toBe(trigger);
  });

  it("UIC-CHAT-ACTIVITY-2.3 collapses when the run ends, summing up what it did after its first kind's glyph", () => {
    const { container, rerender } = render(<Steps isRunning actions={actions} />);
    expect(container.querySelector('.ui-chat-steps__glyph')).toHaveAttribute('data-glyph', 'edit');
    rerender(<Steps actions={actions} durationMs={12_300} />);
    const root = rootOf(container);
    expect(root).not.toHaveAttribute('data-running');
    expect(root).not.toHaveAttribute('data-expanded');
    const trigger = screen.getByRole('button', {
      name: 'Edited files, read files, and ran a command',
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.ui-chat-steps__spinner')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: [
        'ui-chat-steps__trigger',
        'ui-chat-steps__indicator',
        'ui-chat-steps__glyph',
        'ui-chat-steps__label',
        'ui-chat-steps__panel',
      ],
    });
    rerender(
      <Steps
        actions={[
          { kind: 'search', count: 1 },
          { kind: 'fetch', count: 2 },
          { kind: 'other', count: 1 },
        ]}
      />,
    );
    expect(trigger).toHaveAccessibleName('Ran a search, fetched pages, and used a tool');
    expect(trigger.querySelector('.ui-chat-steps__glyph')).toHaveAttribute('data-glyph', 'search');
  });

  it('UIC-CHAT-ACTIVITY-2.3 labels a run without actions with how long it took, without a glyph', () => {
    const { container, rerender } = render(<Steps durationMs={12_300} />);
    expect(screen.getByRole('button', { name: 'Worked for 12 s' })).toBeInTheDocument();
    expect(container.querySelector('.ui-chat-steps__glyph')).toBeNull();
    rerender(<Steps />);
    expect(screen.getByRole('button', { name: 'Worked for a moment' })).toBeInTheDocument();
  });

  it('UIC-CHAT-ACTIVITY-2.4 keeps steps the reader collapsed while running collapsed', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(<Steps isRunning onExpandedChange={onExpandedChange} />);
    await user.tab();
    await user.keyboard('{Enter}');
    const trigger = screen.getByRole('button', { name: 'Working…' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    rerender(<Steps actions={actions} onExpandedChange={onExpandedChange} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-ACTIVITY-2.4 keeps steps the reader opened after the run open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Steps isRunning />);
    rerender(<Steps durationMs={3000} />);
    const trigger = screen.getByRole('button', { name: 'Worked for 3 s' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(<Steps durationMs={3000} actions={actions} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CHAT-ACTIVITY-2.4 starts as defaultExpanded says and follows a controlled state', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(<Steps defaultExpanded />);
    expect(screen.getByRole('button', { name: /Worked/ })).toHaveAttribute('aria-expanded', 'true');
    unmount();
    render(<Steps isRunning isExpanded={false} onExpandedChange={onExpandedChange} />);
    const trigger = screen.getByRole('button', { name: 'Working…' });
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
    const trigger = screen.getByRole('button', { name: 'Worked for a moment' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(document.body);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
