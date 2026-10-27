import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
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
  kind: 'search',
  status: 'running',
  args: { query: 'lentil soup' },
  ...overrides,
});
const answer = (text: string): ChatPart => ({ type: 'text', text, status: 'streaming' });

const stepsTrigger = (container: HTMLElement) =>
  requireDefined(
    within(container.querySelector('.ui-chat-steps') as HTMLElement).getAllByRole('button')[0],
  );

const trains = call({ id: 'c1', label: 'Search trains', status: 'succeeded', durationMs: 800 });
const hotels = (status: ChatToolCallPart['status'], id = 'c2') =>
  call({
    id,
    name: 'search_hotels',
    label: 'Search hotels',
    status,
    error: status === 'failed' ? 'The hotel service timed out.' : undefined,
  });
const forecast = (status: ChatToolCallPart['status']) =>
  call({ id: 'c3', name: 'get_forecast', label: 'Check the forecast', status });
const done = (text: string): ChatPart => ({ type: 'text', text });
const hotelsTrigger = () => screen.getByRole('button', { name: /^Search hotels/ });

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
    const trigger = screen.getByRole('button', { name: 'Working…' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('group', { name: 'Working…' });
    expect(panel.querySelector('.ui-chat-reasoning')).not.toBeNull();
    expect(panel.querySelector('.ui-chat-tool-call')).not.toBeNull();
    rerender(
      <ChatParts
        parts={[reasoning(), call({ status: 'succeeded', durationMs: 1800 }), answer('Soup')]}
        isStreaming
      />,
    );
    expect(stepsTrigger(container)).toHaveAccessibleName('Ran a search');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-5.2 runs a group while a step in it works, and ends it with the stream', () => {
    const parts = [call(), answer('Soup')];
    const { container, rerender } = render(<ChatParts parts={parts} isStreaming />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Working…');
    rerender(<ChatParts parts={parts} />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Ran a search');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-5.2 labels a running group by its streaming reasoning’s title, closed without expandsActivity', () => {
    const parts = [
      call({ status: 'succeeded' }),
      reasoning({ status: 'streaming', title: 'Weighing fares' }),
    ];
    const { container, rerender } = render(
      <ChatParts parts={parts} isStreaming expandsActivity={false} />,
    );
    expect(stepsTrigger(container)).toHaveAccessibleName('Weighing fares');
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
    rerender(<ChatParts parts={parts} isStreaming />);
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    rerender(<ChatParts parts={[...parts.slice(0, 1), reasoning()]} isStreaming />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Working…');
  });

  it('UIC-CHAT-PARTS-5.1 moves a single step into a group once a part follows it', () => {
    const { container, rerender } = render(<ChatParts parts={[call()]} isStreaming />);
    expect(container.querySelector('.ui-chat-steps')).toBeNull();
    expect(screen.getByRole('button', { name: /^Search recipes/ })).toBeInTheDocument();
    rerender(<ChatParts parts={[call({ status: 'succeeded' }), answer('Soup')]} isStreaming />);
    expect(stepsTrigger(container)).toHaveAccessibleName('Ran a search');
    expect(container.querySelector('.ui-chat-steps__glyph')).toHaveAttribute(
      'data-glyph',
      'search',
    );
  });

  it('UIC-CHAT-PARTS-5.1 shows text written between tool calls as text, between their groups', () => {
    const { container } = render(
      <ChatParts
        parts={[
          call({ id: 'c1', kind: 'edit', status: 'succeeded' }),
          call({ id: 'c2', kind: 'read', status: 'succeeded' }),
          done('The fix is in; now checking it.'),
          call({ id: 'c3', kind: 'command', status: 'succeeded' }),
          done('All checks pass.'),
        ]}
      />,
    );
    const root = container.querySelector('.ui-chat-parts') as HTMLElement;
    expect([...root.children].map((child) => child.classList[0])).toEqual([
      'ui-chat-steps',
      'ui-markdown',
      'ui-chat-steps',
      'ui-markdown',
    ]);
    expect(screen.getByRole('button', { name: 'Edited a file, read a file' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ran a command' })).toBeVisible();
  });

  it('UIC-CHAT-PARTS-5.3 opens a group whose tool call waits for approval', () => {
    const { container } = render(
      <ChatParts
        parts={[reasoning(), call({ status: 'approval-requested' })]}
        onApprove={vi.fn()}
      />,
    );
    expect(stepsTrigger(container)).toHaveAccessibleName('Ran a search');
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

  it('UIC-CHAT-PARTS-5.3 reopens a kept closed group whose call already waits as it mounts', () => {
    const onExpandedPartsChange = vi.fn();
    const { container } = render(
      <ChatParts
        parts={[reasoning(), call({ status: 'approval-requested' })]}
        onApprove={vi.fn()}
        expandedParts={{ 'steps:r1': false }}
        onExpandedPartsChange={onExpandedPartsChange}
      />,
    );
    expect(onExpandedPartsChange).toHaveBeenCalledExactlyOnceWith({ 'steps:r1': true });
    expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-PARTS-6.1 keeps the reader’s choice as a part moves into a group', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatParts parts={[reasoning()]} isStreaming />);
    await user.click(screen.getByRole('button', { name: 'Thought for 1 s' }));
    rerender(<ChatParts parts={[reasoning(), call()]} isStreaming />);
    const panel = screen.getByRole('group', { name: 'Working…' });
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

  describe('failures in a group', () => {
    const hotelsError = () => screen.getByText('The hotel service timed out.');

    it('UIC-CHAT-PARTS-5.4 collapses a group around a failure once the answer follows, with the error closed', () => {
      const { container, rerender } = render(
        <ChatParts parts={[reasoning(), trains, hotels('running')]} isStreaming />,
      );
      rerender(
        <ChatParts
          parts={[reasoning(), trains, hotels('failed'), forecast('running')]}
          isStreaming
        />,
      );
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
      expect(hotelsTrigger()).toHaveAttribute('aria-expanded', 'false');
      expect(hotelsTrigger()).toHaveAccessibleName(/Failed/);
      expect(hotelsError()).not.toBeVisible();
      const steps = [reasoning(), trains, hotels('failed'), forecast('succeeded')];
      rerender(<ChatParts parts={[...steps, answer('Pack a jacket')]} isStreaming />);
      expect(stepsTrigger(container)).toHaveAccessibleName('Ran searches');
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
      rerender(<ChatParts parts={[...steps, done('Pack a jacket.')]} />);
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
    });

    it('UIC-CHAT-PARTS-5.4 keeps the group and card the reader closed when a failure arrives as the run ends', async () => {
      const user = userEvent.setup();
      const onExpandedPartsChange = vi.fn();
      const { container, rerender } = render(
        <ChatParts
          parts={[reasoning(), trains, hotels('running')]}
          isStreaming
          onExpandedPartsChange={onExpandedPartsChange}
        />,
      );
      await user.click(stepsTrigger(container));
      expect(onExpandedPartsChange).toHaveBeenCalledExactlyOnceWith({ 'steps:r1': false });
      rerender(
        <ChatParts
          parts={[reasoning(), trains, hotels('failed'), done('Pack a jacket.')]}
          onExpandedPartsChange={onExpandedPartsChange}
        />,
      );
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedPartsChange).toHaveBeenCalledTimes(1);
    });

    it('UIC-CHAT-PARTS-5.4 shows the error when the reader opens the failed row and hides it again on close', async () => {
      const user = userEvent.setup();
      const parts = [reasoning(), trains, hotels('failed'), done('Pack a jacket.')];
      const { container, rerender } = render(<ChatParts parts={parts} />);
      await user.click(stepsTrigger(container));
      expect(hotelsError()).not.toBeVisible();
      await user.click(hotelsTrigger());
      expect(hotelsError()).toBeVisible();
      rerender(<ChatParts parts={[...parts]} />);
      expect(hotelsError()).toBeVisible();
      hotelsTrigger().focus();
      await user.keyboard('{Enter}');
      expect(hotelsTrigger()).toHaveAttribute('aria-expanded', 'false');
      expect(hotelsTrigger()).toHaveFocus();
      expect(hotelsError()).not.toBeVisible();
      const card = requireDefined(container.querySelector<HTMLElement>('#c2'));
      expect(within(card).getByText('Arguments')).not.toBeVisible();
    });

    it('UIC-CHAT-PARTS-5.4 keeps a group of successful, denied and cancelled calls compact', () => {
      const onExpandedPartsChange = vi.fn();
      const view = (status: ChatToolCallPart['status'], isStreaming = true) => (
        <ChatParts
          parts={[reasoning(), trains, hotels('denied'), forecast(status), done('Pack a jacket.')]}
          isStreaming={isStreaming}
          onExpandedPartsChange={onExpandedPartsChange}
        />
      );
      const { container, rerender } = render(view('running'));
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'true');
      rerender(view('cancelled', false));
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedPartsChange).not.toHaveBeenCalled();
    });

    it('UIC-CHAT-PARTS-5.3 UIC-CHAT-PARTS-5.4 reveals an approval but not a failure that arrive together', async () => {
      const user = userEvent.setup();
      const onExpandedPartsChange = vi.fn();
      const view = (first: ChatToolCallPart['status'], second: ChatToolCallPart['status']) => (
        <ChatParts
          parts={[
            reasoning(),
            call({ status: first }),
            done('Then the hotels.'),
            reasoning({ id: 'r2' }),
            hotels(second),
          ]}
          isStreaming
          onApprove={vi.fn()}
          onExpandedPartsChange={onExpandedPartsChange}
        />
      );
      const { container, rerender } = render(view('running', 'running'));
      const [first, second] = [...container.querySelectorAll<HTMLElement>('.ui-chat-steps')].map(
        (group) => requireDefined(within(group).getAllByRole('button')[0]),
      );
      await user.click(requireDefined(first));
      await user.click(requireDefined(second));
      rerender(view('approval-requested', 'failed'));
      expect(first).toHaveAttribute('aria-expanded', 'true');
      expect(second).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedPartsChange).toHaveBeenLastCalledWith({
        'steps:r1': true,
        'steps:r2': false,
      });
    });

    it('UIC-CHAT-PARTS-5.4 UIC-CHAT-PARTS-6.1 loads a failure in history collapsed, then follows the kept record', () => {
      const onExpandedPartsChange = vi.fn();
      const history = [reasoning(), trains, hotels('failed'), done('Pack a jacket.')];
      const view = (expandedParts: Record<string, boolean>) => (
        <ChatParts
          parts={history}
          expandedParts={expandedParts}
          onExpandedPartsChange={onExpandedPartsChange}
        />
      );
      const { container, unmount } = render(view({}));
      expect(stepsTrigger(container)).toHaveAttribute('aria-expanded', 'false');
      unmount();
      const { container: remounted } = render(view({ 'steps:r1': true, c2: true }));
      expect(stepsTrigger(remounted)).toHaveAttribute('aria-expanded', 'true');
      expect(hotelsTrigger()).toHaveAttribute('aria-expanded', 'true');
      expect(hotelsError()).toBeVisible();
      expect(onExpandedPartsChange).not.toHaveBeenCalled();
    });
  });
});
