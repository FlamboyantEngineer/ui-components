import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CommentThread } from './comment-thread.js';
import { CommentThreadReply } from './comment-thread-reply.js';

const author = { name: 'Ana Lima', colorKey: 'ana' };
const time = new Date().toISOString();

function thread(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <CommentThreadReply
      key={index}
      id={`comment-${index + 1}`}
      author={author}
      time={time}
      text={`Comment ${index + 1}`}
    />
  ));
}

describe('CommentThread activity', () => {
  it('UIC-COMMENT-THREAD-1.12 shows activity rows after the replies and announces them', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const { container, rerender } = render(
      <CommentThread
        activity={[
          { key: 'post', kind: 'pending', label: 'Posting your reply…', onCancel },
          { key: 'ben', kind: 'typing', label: 'Ben is typing…' },
          { key: 'failed', kind: 'error', label: 'Your reply was not posted.', onRetry },
        ]}
      >
        {thread(2)}
      </CommentThread>,
    );
    const list = requireList(container);
    expect(list.previousElementSibling).toHaveClass('ui-comment-thread__comments');
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-kind'))).toEqual([
      'pending',
      'typing',
      'error',
    ]);
    expect(rows[0]?.querySelector('.ui-spinner')).not.toBeNull();
    expect(rows[2]?.querySelector('.ui-spinner')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Posting your reply… Ben is typing… Your reply was not posted.',
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: [
        'activity',
        'activity-item',
        'activity-label',
        'activity-cancel',
        'activity-retry',
        'activity-status',
      ],
    });
    rerender(<CommentThread activity={[]}>{thread(2)}</CommentThread>);
    expect(container.querySelector('.ui-comment-thread__activity')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('UIC-COMMENT-THREAD-1.13 leaves focus where it is when it reveals a highlighted reply', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <CommentThread visibleReplies={1}>{thread(4)}</CommentThread>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <CommentThread visibleReplies={1} highlightedId="comment-2">
          {thread(4)}
        </CommentThread>
      </>,
    );
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('UIC-COMMENT-THREAD-1.13 scrolls to a highlighted comment that loads after its id', () => {
    const scrolled: Element[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this);
    };
    try {
      const { container, rerender } = render(
        <CommentThread highlightedId="comment-3">{thread(2)}</CommentThread>,
      );
      expect(scrolled).toHaveLength(0);
      rerender(<CommentThread highlightedId="comment-3">{thread(3)}</CommentThread>);
      expect(scrolled).toEqual([container.querySelector('[data-highlighted]')]);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('UIC-COMMENT-THREAD-1.13 highlights the comment with the given id and reveals it', () => {
    const scrolled: Element[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this);
    };
    try {
      const { container, rerender } = render(
        <CommentThread visibleReplies={1} highlightedId="comment-2">
          {thread(4)}
        </CommentThread>,
      );
      const highlighted = container.querySelectorAll('[data-highlighted]');
      expect(highlighted).toHaveLength(1);
      expect(highlighted[0]).toHaveClass('ui-comment-thread__item');
      expect(highlighted[0]).toHaveTextContent('Comment 2');
      expect(screen.getAllByRole('article')).toHaveLength(4);
      expect(scrolled).toEqual([highlighted[0]]);
      rerender(
        <CommentThread visibleReplies={1} highlightedId="comment-1">
          {thread(4)}
        </CommentThread>,
      );
      expect(container.querySelector('[data-highlighted]')).toHaveTextContent('Comment 1');
      expect(scrolled).toHaveLength(2);
      rerender(<CommentThread visibleReplies={1}>{thread(4)}</CommentThread>);
      expect(container.querySelector('[data-highlighted]')).toBeNull();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});

function requireList(container: HTMLElement): HTMLElement {
  const list = container.querySelector<HTMLElement>('.ui-comment-thread__activity');
  if (!list) throw new Error('No activity list.');
  return list;
}
