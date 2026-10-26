import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatStatusLine } from './chat-status-line.js';

afterEach(() => vi.useRealTimers());

describe('ChatStatusLine', () => {
  it('UIC-CHAT-ACTIVITY-4.1 UIC-CHAT-ACTIVITY-4.3 shows the text with a busy indicator while running', () => {
    const { container, rerender } = render(
      <ChatStatusLine text="Searching trains…" className="extra" id="status" data-part="status" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-chat-status-line', 'extra');
    expect(root).toHaveAttribute('id', 'status');
    expect(root).toHaveAttribute('data-part', 'status');
    expect(root.querySelector('.ui-chat-status-line__spinner')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const text = root.querySelector('.ui-chat-status-line__text');
    expect(text).toHaveTextContent('Searching trains…');
    expect(text).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: ['ui-chat-status-line__spinner', 'ui-chat-status-line__text'],
      callerAttributes: ['data-part'],
    });
    rerender(<ChatStatusLine text="Searching trains…" isRunning />);
    expect(container.querySelector('.ui-chat-status-line')).not.toBeNull();
    rerender(<ChatStatusLine text="Searching trains…" isRunning={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-ACTIVITY-4.1 reads "Thinking…" without text and shows an icon in place of the busy indicator', () => {
    const { container } = render(<ChatStatusLine icon={<svg />} />);
    expect(container.querySelector('.ui-chat-status-line__text')).toHaveTextContent('Thinking…');
    expect(screen.getByRole('status')).toHaveTextContent('Thinking…');
    const icon = container.querySelector('.ui-chat-status-line__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('.ui-chat-status-line__spinner')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', {
      slots: ['ui-chat-status-line__icon', 'ui-chat-status-line__text'],
    });
  });

  it('UIC-CHAT-ACTIVITY-4.1 UIC-CHAT-ACTIVITY-4.2 shows the indicator alone while writing, announcing nothing', () => {
    const { container, rerender } = render(<ChatStatusLine icon={<svg />} />);
    const root = container.querySelector('.ui-chat-status-line');
    expect(root).toHaveAttribute('data-activity', 'thinking');
    rerender(<ChatStatusLine icon={<svg />} activity="writing" text="Searching trains…" />);
    expect(root).toHaveAttribute('data-activity', 'writing');
    expect(container.querySelector('.ui-chat-status-line__icon')).not.toBeNull();
    expect(container.querySelector('.ui-chat-status-line__text')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Thinking…');
    expectHooksMatchSpec(container, 'CHAT-ACTIVITY', { slots: ['ui-chat-status-line__icon'] });
  });

  it('UIC-CHAT-ACTIVITY-4.2 announces the text as it appears and changes, at most once every two seconds', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ChatStatusLine text="Searching trains…" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Searching trains…');
    rerender(<ChatStatusLine text="Reading the timetable…" />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<ChatStatusLine text="Comparing fares…" />);
    expect(status).toHaveTextContent('Searching trains…');
    expect(screen.getByText('Comparing fares…')).toHaveClass('ui-chat-status-line__text');
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(status).toHaveTextContent('Searching trains…');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent('Comparing fares…');
  });

  it('UIC-CHAT-ACTIVITY-4.2 announces the line again when it returns', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ChatStatusLine text="Searching trains…" />);
    rerender(<ChatStatusLine text="Searching trains…" isRunning={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender(<ChatStatusLine text="Searching trains…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching trains…');
  });
});
