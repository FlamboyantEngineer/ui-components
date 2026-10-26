import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { getToolCallTrigger } from '../../../test/chat-tool-call-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatToolCall, type ChatToolCallStatus } from './chat-tool-call.js';

const statusTexts: Record<ChatToolCallStatus, [string, string]> = {
  pending: ['Pending', 'clock'],
  running: ['Running', 'refresh'],
  'approval-requested': ['Needs approval', 'hand-raised'],
  succeeded: ['Done', 'success'],
  failed: ['Failed', 'error'],
  denied: ['Denied', 'no-symbol'],
  cancelled: ['Cancelled', 'x-circle'],
};

describe('ChatToolCall', () => {
  it('UIC-CHAT-TOOL-CALL-1.1 UIC-CHAT-TOOL-CALL-1.6 draws a card whose trigger names the call', () => {
    const { container } = render(
      <ChatToolCall
        id="call-1"
        name="search_recipes"
        label="Searched recipes"
        status="succeeded"
        args={{ query: 'lentil soup' }}
        result={{ count: 3 }}
        durationMs={1200}
        approval={{ isAutoApproved: true }}
        className="extra"
        data-testid="tool"
        data-status="ignored"
        defaultExpanded
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-chat-tool-call', 'extra');
    expect(root).toHaveAttribute('id', 'call-1');
    expect(root).toHaveAttribute('data-testid', 'tool');
    expect(root).toHaveAttribute('data-status', 'succeeded');
    const disclosure = root.querySelector('.ui-chat-tool-call__disclosure');
    expect(disclosure).toHaveClass('ui-disclosure');
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('ui-chat-tool-call__heading');
    const trigger = within(heading).getByRole('button');
    expect(trigger).toHaveAccessibleName('Searched recipes Done 1.2 seconds Auto-approved');
    expect(disclosure?.querySelector('.ui-chat-tool-call__body')).toHaveClass(
      'ui-disclosure__panel',
    );
    expectHooksMatchSpec(container, 'CHAT-TOOL-CALL', {
      slots: [
        'disclosure',
        'heading',
        'status-glyph',
        'summary',
        'label',
        'status',
        'duration',
        'badge',
        'body',
        'part',
        'part-header',
        'part-title',
        'copy',
        'json',
      ],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CHAT-TOOL-CALL-1.1 holds the label, status, duration and badge in the summary beside the glyph', () => {
    const { container } = render(
      <ChatToolCall
        id="call-long"
        name="plan_weekend"
        label="Compare the morning and afternoon trains for Saturday"
        status="succeeded"
        durationMs={2300}
        approval={{ isAutoApproved: true }}
      />,
    );
    const title = getToolCallTrigger(container).querySelector('.ui-disclosure__title');
    const [glyph, summary] = Array.from(title?.children ?? []);
    expect(glyph).toHaveClass('ui-chat-tool-call__status-glyph');
    expect(summary).toHaveClass('ui-chat-tool-call__summary');
    expect(Array.from(summary?.children ?? []).map((part) => part.classList[0])).toEqual([
      'ui-chat-tool-call__label',
      'ui-chat-tool-call__status',
      'ui-chat-tool-call__duration',
      'ui-badge',
    ]);
    expect(summary).toHaveTextContent(
      'Compare the morning and afternoon trains for Saturday Done 2.3 s2.3 seconds Auto-approved',
    );
  });

  it('UIC-CHAT-TOOL-CALL-1.2 derives the label from the name when none is given', () => {
    const { container } = render(<ChatToolCall id="call-2" name="getWeather" status="pending" />);
    expect(container.querySelector('.ui-chat-tool-call__label')).toHaveTextContent('Get weather');
    expect(getToolCallTrigger(container)).toHaveAccessibleName('Get weather Pending');
  });

  it('UIC-CHAT-TOOL-CALL-1.3 publishes each status with its text and glyph, busy while running', () => {
    for (const [status, [text, glyph]] of Object.entries(statusTexts)) {
      const { container, unmount } = render(
        <ChatToolCall id="call" name="run_tests" status={status as ChatToolCallStatus} />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute('data-status', status);
      expect(root.querySelector('.ui-chat-tool-call__status')).toHaveTextContent(text);
      expect(root.querySelector('.ui-chat-tool-call__status-glyph')).toHaveAttribute(
        'data-glyph',
        glyph,
      );
      if (status === 'running') expect(root).toHaveAttribute('aria-busy', 'true');
      else expect(root).not.toHaveAttribute('aria-busy');
      unmount();
    }
  });

  it('UIC-CHAT-TOOL-CALL-1.4 shows a short duration and reads a long one', () => {
    const { container, rerender } = render(
      <ChatToolCall id="call" name="run_tests" status="succeeded" durationMs={350} />,
    );
    const duration = () => container.querySelector('.ui-chat-tool-call__duration') as HTMLElement;
    expect(duration().querySelector('[aria-hidden="true"]')).toHaveTextContent('350 ms');
    expect(getToolCallTrigger(container)).toHaveAccessibleName('Run tests Done 350 milliseconds');
    rerender(<ChatToolCall id="call" name="run_tests" status="succeeded" durationMs={1000} />);
    expect(duration()).toHaveTextContent('1 s1 second');
    rerender(<ChatToolCall id="call" name="run_tests" status="succeeded" durationMs={125_000} />);
    expect(duration().querySelector('[aria-hidden="true"]')).toHaveTextContent('2 min 5 s');
    expect(getToolCallTrigger(container)).toHaveAccessibleName(
      'Run tests Done 2 minutes 5 seconds',
    );
    rerender(<ChatToolCall id="call" name="run_tests" status="succeeded" durationMs={60_000} />);
    expect(getToolCallTrigger(container)).toHaveAccessibleName('Run tests Done 1 minute');
    expect(duration().querySelector('[aria-hidden="true"]')).toHaveTextContent('1 min');
    rerender(<ChatToolCall id="call" name="run_tests" status="succeeded" />);
    expect(duration()).toBeNull();
  });

  it('UIC-CHAT-TOOL-CALL-1.5 marks an auto-approved call with a badge', () => {
    const { container, rerender } = render(
      <ChatToolCall id="call" name="run_tests" status="running" approval={{}} />,
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-auto-approved');
    expect(container.querySelector('.ui-chat-tool-call__badge')).toBeNull();
    rerender(
      <ChatToolCall
        id="call"
        name="run_tests"
        status="running"
        approval={{ isAutoApproved: true }}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-auto-approved', 'true');
    const badge = container.querySelector('.ui-chat-tool-call__badge');
    expect(badge).toHaveClass('ui-badge');
    expect(badge).toHaveTextContent('Auto-approved');
  });

  it('UIC-CHAT-TOOL-CALL-2.1 UIC-CHAT-TOOL-CALL-2.2 shows the arguments and result as copyable JSON', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChatToolCall
        id="call"
        name="search_recipes"
        status="succeeded"
        args={{ query: 'soup' }}
        result='[{"title":"Lentil soup"}]'
        defaultExpanded
      />,
    );
    const parts = container.querySelectorAll('.ui-chat-tool-call__part');
    expect([...parts].map((part) => part.getAttribute('data-part'))).toEqual([
      'arguments',
      'result',
    ]);
    const argumentsView = screen.getByRole('group', { name: 'Arguments' });
    expect(argumentsView).toHaveAttribute('tabindex', '0');
    expect(argumentsView.closest('.ui-chat-tool-call__json')).toHaveClass('ui-scroll-region');
    expect(argumentsView.querySelector('pre')?.textContent).toBe('{\n  "query": "soup"\n}');
    const resultView = screen.getByRole('group', { name: 'Result' });
    expect(resultView.querySelector('pre')?.textContent).toBe(
      '[\n  {\n    "title": "Lentil soup"\n  }\n]',
    );
    await user.click(screen.getByRole('button', { name: 'Copy result' }));
    expect(await navigator.clipboard.readText()).toBe('[\n  {\n    "title": "Lentil soup"\n  }\n]');
    await user.click(screen.getByRole('button', { name: 'Copy arguments' }));
    expect(await navigator.clipboard.readText()).toBe('{\n  "query": "soup"\n}');
  });

  it('UIC-CHAT-TOOL-CALL-2.1 shows only the parts that are defined', () => {
    render(
      <ChatToolCall id="call" name="get_weather" status="running" args={{}} defaultExpanded />,
    );
    expect(screen.getByRole('group', { name: 'Arguments' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Result' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TOOL-CALL-2.3 replaces the body with children', () => {
    render(
      <ChatToolCall id="call" name="get_weather" status="succeeded" args={{}} defaultExpanded>
        <p>Sunny, 24 degrees</p>
      </ChatToolCall>,
    );
    expect(screen.getByText('Sunny, 24 degrees')).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Arguments' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TOOL-CALL-2.4 notes a body with nothing to show', () => {
    const { container } = render(
      <ChatToolCall id="call" name="get_weather" status="pending" defaultExpanded />,
    );
    expect(container.querySelector('.ui-chat-tool-call__empty')).toHaveTextContent('No details');
  });

  it('UIC-CHAT-TOOL-CALL-2.5 shows the error of a failed call as an alert outside the body', () => {
    const { container, rerender } = render(
      <ChatToolCall id="call" name="get_weather" status="failed" error="The service timed out." />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ui-chat-tool-call__error');
    expect(alert).toHaveTextContent('The service timed out.');
    expect(alert.querySelector('[data-glyph="error"]')).toHaveAttribute('aria-hidden', 'true');
    expect(alert.closest('.ui-chat-tool-call__disclosure')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-TOOL-CALL', { slots: ['error'] });
    rerender(<ChatToolCall id="call" name="get_weather" status="succeeded" error="Stale" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TOOL-CALL-3.1 follows the status until the reader toggles it', async () => {
    const user = userEvent.setup();
    const props = { id: 'call', name: 'delete_file' } as const;
    const { container, rerender } = render(<ChatToolCall {...props} status="pending" />);
    const trigger = getToolCallTrigger(container);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    rerender(<ChatToolCall {...props} status="approval-requested" />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(<ChatToolCall {...props} status="running" />);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    rerender(<ChatToolCall {...props} status="failed" />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    rerender(<ChatToolCall {...props} status="approval-requested" />);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-TOOL-CALL-3.1 starts from defaultExpanded and holds it across statuses', () => {
    const props = { id: 'call', name: 'delete_file' } as const;
    const { container, rerender } = render(
      <ChatToolCall {...props} status="pending" defaultExpanded />,
    );
    expect(getToolCallTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    rerender(<ChatToolCall {...props} status="succeeded" defaultExpanded />);
    expect(getToolCallTrigger(container)).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CHAT-TOOL-CALL-3.1 reports requested states while controlled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <ChatToolCall
        id="call"
        name="delete_file"
        status="failed"
        isExpanded={false}
        onExpandedChange={onExpandedChange}
      />,
    );
    const trigger = getToolCallTrigger(container);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-TOOL-CALL-3.1 hands controlled state back to the caller', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [isExpanded, setIsExpanded] = useState(false);
      return (
        <ChatToolCall
          id="call"
          name="delete_file"
          status="succeeded"
          result="Removed"
          isExpanded={isExpanded}
          onExpandedChange={setIsExpanded}
        />
      );
    }
    const { container } = render(<Controlled />);
    await user.click(getToolCallTrigger(container));
    expect(getToolCallTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Result' })).toBeVisible();
  });
});
