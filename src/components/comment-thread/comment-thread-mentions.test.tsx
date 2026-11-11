import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { createCommentMentions } from '../comment-composer/rich/create-comment-mentions.js';
import { CommentThread } from './comment-thread.js';
import { CommentThreadReply } from './comment-thread-reply.js';

installEditorDom();

const author = { name: 'Maria Santos' };
const mentions = createCommentMentions({
  search: (query) =>
    Promise.resolve(
      [
        { id: 'ana', name: 'Ana Lopez' },
        { id: 'jon', name: 'Jon Berg' },
      ].filter((person) => person.name.toLowerCase().startsWith(query.toLowerCase())),
    ),
});

describe('CommentThread mentions', () => {
  it('UIC-COMMENT-THREAD-3.1 lets the default composer mention people and sends the token', async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    render(
      <CommentThread mentions={mentions} onReply={onReply}>
        <CommentThreadReply author={author} time={null} text="Ready @[Jon Berg](jon)?" />
      </CommentThread>,
    );
    const body = document.querySelector('.ui-comment-thread-reply__body');
    expect(body?.querySelector('.ui-comment-text__mention')).toHaveTextContent('Jon Berg');
    const box = screen.getByRole('textbox', { name: 'Reply' });
    await user.click(box);
    await user.keyboard('Yes @an');
    await screen.findByRole('option', { name: 'Ana Lopez' });
    await user.keyboard('{Enter}{Control>}{Enter}{/Control}');
    expect(onReply).toHaveBeenCalledWith('Yes @[Ana Lopez](ana)');
  });

  it('UIC-COMMENT-THREAD-3.1 edits a comment with its mentions kept as chips', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <CommentThread mentions={mentions}>
        <CommentThreadReply
          author={author}
          time={null}
          text="Thanks @[Ana Lopez](ana)"
          onEdit={onEdit}
        />
      </CommentThread>,
    );
    await user.click(screen.getByRole('button', { name: 'Comment actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const box = await screen.findByRole('textbox', { name: 'Edit comment' });
    expect(box.querySelector('.ui-message-composer__pill')).toHaveTextContent('Ana Lopez');
    await waitFor(() => expect(box).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith('Thanks @[Ana Lopez](ana)');
  });

  it('UIC-COMMENT-THREAD-3.1 takes a comment its own mentions, and keeps plain text without any', () => {
    render(
      <CommentThread>
        <CommentThreadReply author={author} time={null} text="Hi @[Ana Lopez](ana)" />
        <CommentThreadReply
          author={author}
          time={null}
          text="Hi @[Jon Berg](jon)"
          mentions={mentions}
        />
      </CommentThread>,
    );
    const [plain, mentioned] = document.querySelectorAll('.ui-comment-thread-reply__body');
    expect(plain).toHaveTextContent('Hi @[Ana Lopez](ana)');
    expect(mentioned?.querySelector('.ui-comment-text__mention')).toHaveTextContent('Jon Berg');
  });
});
