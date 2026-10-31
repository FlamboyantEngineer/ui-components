import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { CommentThreadReply } from './comment-thread-reply.js';
import { CommentThread } from './comment-thread.js';

const people = [
  { name: 'Ana Lima', colorKey: 'ana' },
  { name: 'Ben Ode', colorKey: 'ben' },
];
const now = new Date().toISOString();

function replies(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <CommentThreadReply
      key={index}
      author={people[index % 2] ?? requireDefined(people[0])}
      time={now}
      text={`Comment ${index + 1}`}
    />
  ));
}

function bodies(): string[] {
  return screen
    .getAllByRole('article')
    .map((article) => article.querySelector('.ui-comment-thread-reply__body')?.textContent ?? '');
}

describe('CommentThread', () => {
  it('UIC-COMMENT-THREAD-1.1 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CommentThread ref={ref} />);
    expect(ref.current).toBe(container.querySelector('.ui-comment-thread'));
  });

  it('UIC-COMMENT-THREAD-1.1 lists the comments under the quoted anchor', () => {
    const { container } = render(
      <CommentThread quote="the ripest fruit" onReply={() => {}}>
        {replies(3)}
      </CommentThread>,
    );
    const thread = screen.getByRole('group', { name: 'Comment thread' });
    expect(thread).toHaveClass('ui-comment-thread');
    expect(thread.querySelector('blockquote.ui-comment-thread__quote')).toHaveTextContent(
      'the ripest fruit',
    );
    const list = within(thread).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-comment-thread__comments');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(bodies()).toEqual(['Comment 1', 'Comment 2', 'Comment 3']);
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: ['header', 'quote', 'comments', 'item', 'composer'],
    });
  });

  it('UIC-COMMENT-THREAD-1.2 replies through the default composer', async () => {
    const onReply = vi.fn();
    const { container, rerender } = render(
      <CommentThread onReply={onReply}>{replies(1)}</CommentThread>,
    );
    const composer = container.querySelector('.ui-comment-thread__composer');
    expect(composer?.firstElementChild).toHaveClass('ui-comment-composer');
    await userEvent.type(screen.getByRole('textbox', { name: 'Reply' }), 'Agreed');
    await userEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onReply).toHaveBeenCalledWith('Agreed');
    // An empty thread is a new one: its composer starts the discussion.
    rerender(<CommentThread quote="Bananas" onReply={onReply} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Comment' })).toBeInTheDocument();
    rerender(<CommentThread>{replies(1)}</CommentThread>);
    expect(container.querySelector('.ui-comment-thread__composer')).toBeNull();
    expect(container.querySelector('.ui-comment-thread__header')).toBeNull();
  });

  it('UIC-COMMENT-THREAD-1.3 draws the caller composer in place of the default', () => {
    render(
      <CommentThread onReply={() => {}} composer={<textarea aria-label="Rich reply" />}>
        {replies(1)}
      </CommentThread>,
    );
    expect(screen.getByRole('textbox', { name: 'Rich reply' }).parentElement).toHaveClass(
      'ui-comment-thread__composer',
    );
    expect(screen.queryByRole('textbox', { name: 'Reply' })).not.toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-1.4 resolves and reopens the thread', async () => {
    const onResolvedChange = vi.fn();
    const { container } = render(
      <CommentThread onResolvedChange={onResolvedChange} onReply={() => {}}>
        {replies(2)}
      </CommentThread>,
    );
    const thread = container.querySelector('.ui-comment-thread') as HTMLElement;
    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(onResolvedChange).toHaveBeenLastCalledWith(true);
    expect(thread).toHaveAttribute('data-resolved', 'true');
    expect(thread.querySelector('.ui-comment-thread__status')).toHaveTextContent('Resolved');
    expect(thread.querySelector('.ui-comment-thread__composer')).toBeNull();
    expect(bodies()).toHaveLength(2);
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { slots: ['status', 'resolve'] });
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(onResolvedChange).toHaveBeenLastCalledWith(false);
    expect(thread).not.toHaveAttribute('data-resolved');
    expect(screen.getByRole('textbox', { name: 'Reply' })).toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-1.4 follows a controlled resolved state', async () => {
    function Controlled() {
      const [isResolved, setIsResolved] = useState(true);
      return (
        <CommentThread isResolved={isResolved} onResolvedChange={setIsResolved}>
          {replies(1)}
        </CommentThread>
      );
    }
    render(<Controlled />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(screen.queryByText('Resolved')).not.toBeInTheDocument();
    render(<CommentThread defaultResolved>{replies(1)}</CommentThread>);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Resolve|Reopen/ })).toHaveLength(1);
  });

  it('UIC-COMMENT-THREAD-1.5 hides the middle replies of a long thread until revealed', async () => {
    const { container } = render(<CommentThread visibleReplies={2}>{replies(6)}</CommentThread>);
    expect(bodies()).toEqual(['Comment 1', 'Comment 5', 'Comment 6']);
    const more = screen.getByRole('button', { name: 'Show 3 more replies' });
    expect(more.parentElement).toHaveClass('ui-comment-thread__more');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { slots: ['more', 'show-more'] });
    await userEvent.click(more);
    expect(bodies()).toEqual([
      'Comment 1',
      'Comment 2',
      'Comment 3',
      'Comment 4',
      'Comment 5',
      'Comment 6',
    ]);
    expect(screen.queryByRole('button', { name: /more repl/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[1]).toHaveFocus();
  });

  it('UIC-COMMENT-THREAD-1.5 shows short threads whole', () => {
    render(<CommentThread visibleReplies={2}>{replies(3)}</CommentThread>);
    expect(bodies()).toHaveLength(3);
    render(<CommentThread visibleReplies={0}>{replies(2)}</CommentThread>);
    expect(screen.getByRole('button', { name: 'Show 1 more reply' })).toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-1.6 is read-only without composer and resolve', () => {
    const { container } = render(
      <CommentThread isReadOnly onReply={() => {}} onResolvedChange={() => {}} isSelected>
        {replies(1)}
      </CommentThread>,
    );
    const thread = container.querySelector('.ui-comment-thread');
    expect(thread).toHaveAttribute('data-readonly', 'true');
    expect(thread).toHaveAttribute('data-selected', 'true');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-1.7 reports an error under the comments', () => {
    const { container } = render(
      <CommentThread error="The reply could not be posted." onReply={() => {}}>
        {replies(1)}
      </CommentThread>,
    );
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('The reply could not be posted.');
    expect(error.closest('.ui-comment-thread__error')).toHaveClass('ui-inline-error');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { slots: ['error'] });
  });

  it('UIC-COMMENT-THREAD-1.8 takes its name from the caller and the provider', () => {
    const { container, rerender } = render(
      <UiProvider messages={{ commentThread: 'Fil de discussion' }}>
        <CommentThread>{replies(1)}</CommentThread>
      </UiProvider>,
    );
    expect(screen.getByRole('group', { name: 'Fil de discussion' })).toBeInTheDocument();
    rerender(
      <CommentThread aria-label="Thread on Report.pdf" className="extra" id="t1" data-test="t">
        {replies(1)}
      </CommentThread>,
    );
    const thread = screen.getByRole('group', { name: 'Thread on Report.pdf' });
    expect(thread).toHaveClass('ui-comment-thread', 'extra');
    expect(thread).toHaveAttribute('id', 't1');
    expect(thread).toHaveAttribute('data-test', 't');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { callerAttributes: ['data-test'] });
  });
});
