import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatReasoning } from './chat-reasoning.js';

const thinking = 'Comparing the **cheapest** trains to Porto.';

const rootOf = (container: HTMLElement) => container.querySelector('.ui-chat-reasoning');

describe('ChatReasoning', () => {
  it('UIC-CHAT-ACTIVITY-1.1 UIC-CHAT-ACTIVITY-1.2 UIC-CHAT-ACTIVITY-1.6 streams open and busy, labelled Thinking', () => {
    const { container } = render(
      <ChatReasoning text={thinking} status="streaming" className="extra" data-part="reasoning" />,
    );
    const root = rootOf(container);
    expect(root).toHaveClass('ui-chat-reasoning', 'extra');
    expect(root).toHaveAttribute('data-part', 'reasoning');
    expect(root).toHaveAttribute('data-status', 'streaming');
    expect(root).toHaveAttribute('data-format', 'markdown');
    expect(root).toHaveAttribute('data-expanded', 'true');
    const trigger = screen.getByRole('button', { name: 'Thinking…' });
    expect(trigger).toHaveClass('ui-chat-reasoning__trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.querySelector('.ui-chat-reasoning__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );
    expect(trigger.querySelector('.ui-chat-reasoning__spinner')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const panel = screen.getByRole('group', { name: 'Thinking…' });
    expect(panel).toHaveClass('ui-chat-reasoning__panel');
    expect(panel).toHaveAttribute('aria-busy', 'true');
    expect(within(panel).getByText('cheapest').tagName).toBe('STRONG');
    expect(panel.querySelector('.ui-chat-reasoning__text')).toHaveClass('ui-markdown');
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: [
        'ui-chat-reasoning__trigger',
        'ui-chat-reasoning__indicator',
        'ui-chat-reasoning__label',
        'ui-chat-reasoning__spinner',
        'ui-chat-reasoning__panel',
        'ui-chat-reasoning__text',
      ],
      callerAttributes: ['data-part'],
    });
  });

  it('UIC-CHAT-ACTIVITY-1.3 collapses once complete, labelled with how long it took', () => {
    const { container, rerender } = render(<ChatReasoning text={thinking} status="streaming" />);
    rerender(<ChatReasoning text={thinking} status="complete" durationMs={4400} />);
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-status', 'complete');
    expect(root).not.toHaveAttribute('data-expanded');
    const trigger = screen.getByRole('button', { name: 'Thought for 4 s' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('.ui-chat-reasoning__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    expect(container.querySelector('.ui-chat-reasoning__spinner')).toBeNull();
    expect(container.querySelector('.ui-chat-reasoning__panel')).not.toHaveAttribute('aria-busy');
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY');
  });

  it('UIC-CHAT-ACTIVITY-1.3 reads minutes, and a moment without a duration', () => {
    const { rerender } = render(
      <ChatReasoning text={thinking} status="complete" durationMs={65_000} />,
    );
    expect(screen.getByRole('button', { name: 'Thought for 1 min 5 s' })).toBeInTheDocument();
    rerender(<ChatReasoning text={thinking} status="complete" durationMs={120_000} />);
    expect(screen.getByRole('button', { name: 'Thought for 2 min' })).toBeInTheDocument();
    rerender(<ChatReasoning text={thinking} status="complete" durationMs={300} />);
    expect(screen.getByRole('button', { name: 'Thought for a moment' })).toBeInTheDocument();
    rerender(<ChatReasoning text={thinking} status="complete" />);
    expect(screen.getByRole('button', { name: 'Thought for a moment' })).toBeInTheDocument();
  });

  it('UIC-CHAT-ACTIVITY-1.4 renders plain text as written', () => {
    const { container } = render(
      <ChatReasoning text={thinking} status="streaming" format="plain" />,
    );
    expect(rootOf(container)).toHaveAttribute('data-format', 'plain');
    const text = container.querySelector('.ui-chat-reasoning__text');
    expect(text?.tagName).toBe('DIV');
    expect(text).not.toHaveClass('ui-markdown');
    expect(text).toHaveTextContent('Comparing the **cheapest** trains to Porto.');
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY');
  });

  it('UIC-CHAT-ACTIVITY-1.5 keeps reasoning the reader collapsed while streaming collapsed', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <ChatReasoning text={thinking} status="streaming" onExpandedChange={onExpandedChange} />,
    );
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Thinking…' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    rerender(
      <ChatReasoning
        text={thinking}
        status="complete"
        durationMs={2000}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
  });

  it('UIC-CHAT-ACTIVITY-1.5 keeps reasoning the reader opened open once complete', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatReasoning text={thinking} status="streaming" />);
    const trigger = screen.getByRole('button', { name: 'Thinking…' });
    await user.click(trigger);
    await user.click(trigger);
    rerender(<ChatReasoning text={thinking} status="complete" durationMs={2000} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CHAT-ACTIVITY-1.5 starts as defaultExpanded says, whatever the status', () => {
    const { rerender } = render(
      <ChatReasoning text={thinking} status="streaming" defaultExpanded={false} />,
    );
    expect(screen.getByRole('button', { name: 'Thinking…' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    rerender(<ChatReasoning text={thinking} status="complete" defaultExpanded={false} />);
    expect(screen.getByRole('button', { name: 'Thought for a moment' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('UIC-CHAT-ACTIVITY-1.5 follows a controlled state and reports the requested one', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <ChatReasoning
        text={thinking}
        status="complete"
        isExpanded
        onExpandedChange={onExpandedChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Thought for a moment' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Released, it keeps the state the reader asked for.
    rerender(<ChatReasoning text={thinking} status="complete" isExpanded={undefined} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-ACTIVITY-1.5 stays open while focus is inside, and collapses once it leaves', async () => {
    const user = userEvent.setup();
    const linked = 'See the [timetable](https://example.com/timetable).';
    const after = <button type="button">Next</button>;
    const { rerender } = render(
      <>
        <ChatReasoning text={linked} status="streaming" />
        {after}
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('link', { name: /timetable/ })).toHaveFocus();
    rerender(
      <>
        <ChatReasoning text={linked} status="complete" />
        {after}
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Thought for a moment' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
