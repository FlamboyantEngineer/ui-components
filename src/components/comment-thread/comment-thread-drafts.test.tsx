import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { CommentThread, type CommentThreadProps } from './comment-thread.js';
import { CommentThreadReply } from './comment-thread-reply.js';

const people = [
  { name: 'Ana Lima', colorKey: 'ana' },
  { name: 'Ben Ode', colorKey: 'ben' },
];

function reply(index: number) {
  return (
    <CommentThreadReply
      key={index}
      author={people[index % 2] ?? requireDefined(people[0])}
      time={null}
      text={`Comment ${index + 1}`}
    />
  );
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

type ThreadProps = Pick<
  CommentThreadProps,
  'isResolved' | 'isReadOnly' | 'onReply' | 'composer' | 'aria-label'
>;

const Thread = (props: ThreadProps) => <CommentThread {...props}>{reply(0)}</CommentThread>;
const replyBox = () => screen.queryByRole('textbox', { name: 'Reply' });

describe('CommentThread reply drafts', () => {
  it.each([
    ['resolved', { isResolved: true }],
    ['read-only', { isReadOnly: true }],
  ])('UIC-COMMENT-THREAD-1.9 keeps an unsent reply while the thread is %s', async (_, closed) => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    const { rerender } = render(<Thread onReply={onReply} />);
    await user.type(requireDefined(replyBox()), 'Unsent reply');
    rerender(<Thread onReply={onReply} {...closed} />);
    expect(replyBox()).not.toBeInTheDocument();
    rerender(<Thread onReply={onReply} />);
    expect(replyBox()).toHaveValue('Unsent reply');
    expect(onReply).not.toHaveBeenCalled();
  });

  it('UIC-COMMENT-THREAD-1.9 lets a reply sent before a resolve clear only its own draft', async () => {
    const user = userEvent.setup();
    const task = deferred();
    const onReply = vi.fn(() => task.promise);
    const { rerender } = render(<Thread onReply={onReply} />);
    await user.type(requireDefined(replyBox()), 'First{Control>}{Enter}{/Control}');
    expect(onReply).toHaveBeenCalledWith('First');
    rerender(<Thread onReply={onReply} isResolved />);
    rerender(<Thread onReply={onReply} />);
    await act(async () => task.resolve());
    expect(replyBox()).toHaveValue('');

    const second = deferred();
    onReply.mockImplementation(() => second.promise);
    await user.type(requireDefined(replyBox()), 'Second{Control>}{Enter}{/Control}');
    await user.type(requireDefined(replyBox()), ' and more');
    rerender(<Thread onReply={onReply} isReadOnly />);
    rerender(<Thread onReply={onReply} />);
    await act(async () => second.resolve());
    expect(replyBox()).toHaveValue('Second and more');
  });

  it('UIC-COMMENT-THREAD-1.9 keeps each thread its own draft, and a caller composer its state', async () => {
    const user = userEvent.setup();
    const composer = <input aria-label="Rich reply" />;
    const { rerender } = render(
      <>
        <Thread aria-label="First thread" onReply={vi.fn()} />
        <Thread aria-label="Second thread" composer={composer} />
      </>,
    );
    await user.type(requireDefined(replyBox()), 'Only here');
    await user.type(screen.getByRole('textbox', { name: 'Rich reply' }), 'Rich draft');
    rerender(
      <>
        <Thread aria-label="First thread" onReply={vi.fn()} isResolved />
        <Thread aria-label="Second thread" composer={composer} isResolved />
      </>,
    );
    rerender(
      <>
        <Thread aria-label="First thread" onReply={vi.fn()} />
        <Thread aria-label="Second thread" composer={composer} />
      </>,
    );
    expect(replyBox()).toHaveValue('Only here');
    expect(screen.getByRole('textbox', { name: 'Rich reply' })).toHaveValue('Rich draft');
  });
});

describe('CommentThread comments in fragments', () => {
  it('UIC-COMMENT-THREAD-1.5 counts replies inside fragments as replies', async () => {
    const user = userEvent.setup();
    render(
      <CommentThread visibleReplies={0}>
        <>
          {reply(0)}
          <>
            {reply(1)}
            {reply(2)}
          </>
        </>
      </CommentThread>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Show 2 more replies' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getAllByRole('listitem')[1]).toHaveFocus();
  });

  it('UIC-COMMENT-THREAD-1.2 treats an empty fragment as no comments', () => {
    render(
      <CommentThread onReply={vi.fn()}>
        <></>
      </CommentThread>,
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toBeInTheDocument();
  });
});
