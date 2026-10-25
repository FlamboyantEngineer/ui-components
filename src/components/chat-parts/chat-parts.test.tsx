import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';
import { ChatParts } from './chat-parts.js';

const reasoning = (overrides: Partial<ChatReasoningPart> = {}): ChatReasoningPart => ({
  type: 'reasoning',
  id: 'r1',
  text: 'Checking the pantry first.',
  status: 'complete',
  durationMs: 1200,
  ...overrides,
});
const call = (overrides: Partial<ChatToolCallPart> = {}): ChatToolCallPart => ({
  type: 'tool-call',
  id: 'c1',
  name: 'search_recipes',
  label: 'Search recipes',
  status: 'running',
  args: { query: 'lentil soup' },
  ...overrides,
});
const answer = (text: string): ChatPart => ({ type: 'text', text, status: 'streaming' });

const stepsTrigger = (container: HTMLElement) =>
  within(container.querySelector('.ui-chat-steps') as HTMLElement).getAllByRole('button')[0]!;

describe('ChatParts', () => {
  it('UIC-CHAT-PARTS-1.1 UIC-CHAT-PARTS-1.3 renders the parts in order in its root', () => {
    const { container } = render(
      <ChatParts
        className="extra"
        id="parts-1"
        data-part="answer"
        parts={[
          { type: 'text', text: 'Here is the plan.' },
          { type: 'plan', id: 'p', steps: [{ id: 's', label: 'Soak', status: 'pending' }] },
          { type: 'code', code: 'soak(lentils)' },
        ]}
      />,
    );
    const root = container.querySelector('.ui-chat-parts') as HTMLElement;
    expect(root).toHaveClass('extra');
    expect(root).toHaveAttribute('id', 'parts-1');
    expect(root).toHaveAttribute('data-part', 'answer');
    expect([...root.children].map((child) => child.classList[0])).toEqual([
      'ui-markdown',
      'ui-chat-plan',
      'ui-code-block',
    ]);
    expectHooksMatchSpec(container, 'CHAT-PARTS', { callerAttributes: ['data-part'] });
  });

  it('UIC-CHAT-PARTS-1.1 keeps each part element while the message streams', () => {
    const code: ChatPart = { type: 'code', code: 'soak(lentils)' };
    const { container, rerender } = render(<ChatParts parts={[answer('Soak'), code]} />);
    const text = container.querySelector('.ui-chat-parts__text');
    const block = container.querySelector('.ui-code-block');
    rerender(<ChatParts parts={[answer('Soak the lentils'), code, answer('Then')]} />);
    expect(container.querySelector('.ui-chat-parts__text')).toBe(text);
    expect(container.querySelector('.ui-code-block')).toBe(block);
    expect(text).toHaveTextContent('Soak the lentils');
  });

  it('UIC-CHAT-PARTS-5.1 UIC-CHAT-PARTS-5.2 runs a group at the end and collapses it once the answer follows', () => {
    const { container, rerender } = render(<ChatParts parts={[reasoning(), call()]} isStreaming />);
    const trigger = screen.getByRole('button', { name: 'Working… · 2 steps' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('group', { name: 'Working… · 2 steps' });
    expect(panel.querySelector('.ui-chat-reasoning')).not.toBeNull();
    expect(panel.querySelector('.ui-chat-tool-call')).not.toBeNull();
    rerender(
      <ChatParts
        parts={[reasoning(), call({ status: 'succeeded', durationMs: 1800 }), answer('Soup')]}
        isStreaming
      />,
    );
    expect(stepsTrigger(container)).toHaveAccessibleName('Worked for 3 s · 2 steps');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-5.2 runs a group while a step in it works, and ends it with the stream', () => {
    const parts = [reasoning({ status: 'streaming', durationMs: undefined }), answer('Soup')];
    const { container, rerender } = render(<ChatParts parts={parts} isStreaming />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Working… · 1 step');
    rerender(<ChatParts parts={parts} />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Worked for a moment · 1 step');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-5.1 moves a single step into a group once a part follows it', () => {
    const { container, rerender } = render(
      <ChatParts parts={[reasoning({ status: 'streaming' })]} isStreaming />,
    );
    expect(container.querySelector('.ui-chat-steps')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thinking…' })).toBeInTheDocument();
    rerender(<ChatParts parts={[reasoning(), answer('Soup')]} isStreaming />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Worked for 1 s · 1 step');
  });

  it('UIC-CHAT-PARTS-5.3 opens a group whose tool call waits for approval', () => {
    const { container } = render(
      <ChatParts
        parts={[reasoning(), call({ status: 'approval-requested' })]}
        onApprove={vi.fn()}
      />,
    );
    expect(stepsTrigger(container)).toHaveAccessibleName('Worked for 1 s · 2 steps');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /^Approve/ })).toBeVisible();
  });

  it('UIC-CHAT-PARTS-5.3 reopens a closed group once a call in it waits, then keeps it closed when asked', async () => {
    const user = userEvent.setup();
    const onExpandedPartsChange = vi.fn();
    const view = (status: ChatToolCallPart['status']) => (
      <ChatParts
        parts={[reasoning(), call({ status })]}
        isStreaming
        onExpandedPartsChange={onExpandedPartsChange}
      />
    );
    const { container, rerender } = render(view('running'));
    await user.click(stepsTrigger(container));
    expect(onExpandedPartsChange).toHaveBeenLastCalledWith({ 'steps:r1': false });
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
    rerender(view('approval-requested'));
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedPartsChange).toHaveBeenLastCalledWith({ 'steps:r1': true });
    await user.click(stepsTrigger(container));
    rerender(view('approval-requested'));
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-5.3 keeps a reopened group open once the reader decides', async () => {
    const user = userEvent.setup();
    const view = (status: ChatToolCallPart['status'], isStreaming = true) => (
      <ChatParts
        parts={[
          reasoning(),
          call({ status, approval: status === 'succeeded' ? { decision: 'approved' } : {} }),
        ]}
        isStreaming={isStreaming}
        onApprove={vi.fn()}
      />
    );
    const { container, rerender } = render(view('running'));
    await user.click(stepsTrigger(container));
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
    rerender(view('approval-requested', false));
    await user.click(screen.getByRole('button', { name: /^Approve/ }));
    rerender(view('succeeded', false));
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /^Approve/ })).toHaveFocus();
  });

  it('UIC-CHAT-PARTS-6.1 keeps the reader’s choice as a part moves into a group', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatParts parts={[reasoning()]} isStreaming />);
    await user.click(screen.getByRole('button', { name: 'Thought for 1 s' }));
    rerender(<ChatParts parts={[reasoning(), call()]} isStreaming />);
    const panel = screen.getByRole('group', { name: 'Working… · 2 steps' });
    expect(within(panel).getByRole('button', { name: 'Thought for 1 s' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('UIC-CHAT-PARTS-6.1 follows a controlled record, across remounts', async () => {
    const user = userEvent.setup();
    const onExpandedPartsChange = vi.fn();
    const expandedParts = { 'steps:r1': true, r1: true, c1: true };
    const parts = [reasoning(), call({ status: 'succeeded' }), answer('Soup')];
    const view = (
      <ChatParts
        parts={parts}
        expandedParts={expandedParts}
        onExpandedPartsChange={onExpandedPartsChange}
      />
    );
    const { container, unmount } = render(view);
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Thought for 1 s' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Arguments')).toBeVisible();
    await user.click(stepsTrigger(container));
    expect(onExpandedPartsChange).toHaveBeenCalledWith({ ...expandedParts, 'steps:r1': false });
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    unmount();
    const { container: remounted } = render(view);
    expect(stepsTrigger(remounted)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Arguments')).toBeVisible();
  });
});
