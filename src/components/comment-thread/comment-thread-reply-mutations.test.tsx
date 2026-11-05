import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CommentThread } from './comment-thread.js';
import { CommentThreadReply, type CommentThreadReplyProps } from './comment-thread-reply.js';

const ana = { name: 'Ana Lima', colorKey: 'ana' };

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when overlays change.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

type ReplyProps = Partial<Pick<CommentThreadReplyProps, 'onEdit' | 'onDelete' | 'renderEditor'>>;

/** A reply inside a thread whose permissions the test changes. */
function Reply({ isReadOnly = false, ...props }: ReplyProps & { isReadOnly?: boolean }) {
  return (
    <CommentThread isReadOnly={isReadOnly}>
      <CommentThreadReply author={ana} time={null} text="Bananas are ripe" {...props} />
    </CommentThread>
  );
}

const menuButton = () => screen.getByRole('button', { name: 'Comment actions' });
const editBox = () => screen.queryByRole('textbox', { name: 'Edit comment' });

async function startEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(menuButton());
  await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  const box = await screen.findByRole('textbox', { name: 'Edit comment' });
  await user.clear(box);
  await user.type(box, 'New text');
}

async function startDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(menuButton());
  await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  return screen.findByRole('alertdialog', { name: 'Delete comment' });
}

describe('CommentThreadReply permissions', () => {
  it('UIC-COMMENT-THREAD-2.7 ends the editor when Edit is withdrawn, and keeps it ended', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(<Reply onEdit={onEdit} onDelete={onDelete} />);
    await startEdit(user);
    rerender(<Reply onDelete={onDelete} />);
    expect(editBox()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('Bananas are ripe');
    expect(menuButton()).toHaveFocus();
    rerender(<Reply onEdit={onEdit} onDelete={onDelete} />);
    expect(editBox()).not.toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('UIC-COMMENT-THREAD-2.7 ends a caller editor when the thread turns read-only and back', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const renderEditor = () => <input aria-label="Rich edit" />;
    const { rerender } = render(<Reply onEdit={onEdit} renderEditor={renderEditor} />);
    await user.click(menuButton());
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(screen.getByRole('textbox', { name: 'Rich edit' })).toBeInTheDocument();
    rerender(<Reply onEdit={onEdit} renderEditor={renderEditor} isReadOnly />);
    expect(screen.queryByRole('textbox', { name: 'Rich edit' })).not.toBeInTheDocument();
    rerender(<Reply onEdit={onEdit} renderEditor={renderEditor} />);
    expect(screen.queryByRole('textbox', { name: 'Rich edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('article')).not.toHaveAttribute('data-editing');
  });

  it('UIC-COMMENT-THREAD-2.7 leaves focus that moved elsewhere where it is', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { rerender } = render(
      <>
        <Reply onEdit={onEdit} onDelete={vi.fn()} />
        <button type="button">Elsewhere</button>
      </>,
    );
    await startEdit(user);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    act(() => elsewhere.focus());
    rerender(
      <>
        <Reply onDelete={vi.fn()} />
        <button type="button">Elsewhere</button>
      </>,
    );
    expect(elsewhere).toHaveFocus();
  });

  it('UIC-COMMENT-THREAD-2.7 ends the confirmation when Delete is withdrawn, and keeps it ended', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const { rerender } = render(<Reply onEdit={onEdit} onDelete={onDelete} />);
    await startDelete(user);
    rerender(<Reply onEdit={onEdit} />);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    rerender(<Reply onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    rerender(<Reply onEdit={onEdit} />);
    rerender(<Reply onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe('CommentThreadReply mutations', () => {
  it('UIC-COMMENT-THREAD-2.3 keeps the editor open while a save is pending, closing once it succeeds', async () => {
    const user = userEvent.setup();
    const task = deferred();
    const onEdit = vi.fn(() => task.promise);
    render(<Reply onEdit={onEdit} />);
    await startEdit(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith('New text');
    expect(editBox()).toHaveValue('New text');
    await act(async () => task.resolve());
    expect(editBox()).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it.each([
    ['rejects', () => Promise.reject(new Error('Offline'))],
    [
      'throws',
      () => {
        throw new Error('Offline');
      },
    ],
  ])(
    'UIC-COMMENT-THREAD-2.3 keeps the edited text and shows the failure when a save %s',
    async (_, failing) => {
      const user = userEvent.setup();
      const onEdit = vi.fn<(text: string) => void | Promise<unknown>>(failing);
      const { container } = render(<Reply onEdit={onEdit} />);
      await startEdit(user);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
      expect(editBox()).toHaveValue('New text');
      expectHooksMatchSpec(container, 'COMMENT-THREAD');
      onEdit.mockImplementation(() => undefined);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(onEdit).toHaveBeenLastCalledWith('New text');
      expect(editBox()).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('UIC-COMMENT-THREAD-2.3 settles a save only for its own editor', async () => {
    const user = userEvent.setup();
    const task = deferred();
    const onEdit = vi.fn(() => task.promise);
    const { rerender } = render(<Reply onEdit={onEdit} />);
    await startEdit(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    rerender(<Reply />);
    rerender(<Reply onEdit={onEdit} />);
    await act(async () => task.reject(new Error('Offline')));
    expect(editBox()).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-2.4 keeps the confirmation pending, and open with the failure when Delete fails', async () => {
    const user = userEvent.setup();
    let task = deferred();
    const onDelete = vi.fn(() => task.promise);
    render(<Reply onDelete={onDelete} />);
    const dialog = await startDelete(user);
    const confirm = within(dialog).getByRole('button', { name: 'Delete' });
    await user.click(confirm);
    expect(confirm).toHaveAttribute('data-pending', 'true');
    await act(async () => task.reject(new Error('Offline')));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Offline');
    task = deferred();
    await user.click(confirm);
    await act(async () => task.resolve());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onDelete).toHaveBeenCalledTimes(2);
  });
});
