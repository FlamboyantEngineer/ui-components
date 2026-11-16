import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { LinkGlyph } from '../../core/glyphs.js';
import { CommentThread } from './comment-thread.js';
import { CommentThreadReply } from './comment-thread-reply.js';

const ana = { name: 'Ana Lima', colorKey: 'ana' };
const copyLink = [{ id: 'copy-link', label: 'Copy link', icon: LinkGlyph }];

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when overlays change.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

async function menuLabels(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'More actions' }));
  const menu = await screen.findByRole('menu');
  return within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);
}

describe('CommentThread header', () => {
  it('UIC-COMMENT-THREAD-1.14 draws the caller controls and a close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <CommentThread
        headerActions={<button type="button">Accept</button>}
        onClose={onClose}
        menu={copyLink}
        author={ana}
        time={null}
      />,
    );
    const header = container.querySelector('.ui-comment-thread__header');
    expect(within(header as HTMLElement).getByRole('button', { name: 'Accept' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: ['header', 'author', 'header-actions', 'menu', 'close'],
    });
  });

  it('UIC-COMMENT-THREAD-1.15 offers its menu while resolved and read-only', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <CommentThread isReadOnly defaultResolved menu={copyLink} onAction={onAction}>
        <CommentThreadReply author={ana} time={null} text="Opening" onEdit={() => {}} />
      </CommentThread>,
    );
    expect(await menuLabels(user)).toEqual(['Copy link']);
    await user.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    expect(onAction).toHaveBeenCalledWith('copy-link');
  });

  it('UIC-COMMENT-THREAD-1.15 moves the opening comment menu into the header with firstInMenu', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onCommentAction = vi.fn();
    render(
      <CommentThread firstInMenu menu={copyLink} onAction={() => {}}>
        <CommentThreadReply
          author={ana}
          time={null}
          text="Opening"
          actions={[{ id: 'pin', label: 'Pin' }]}
          onAction={onCommentAction}
          onEdit={() => {}}
          onDelete={onDelete}
        />
        <CommentThreadReply author={ana} time={null} text="Reply" onEdit={() => {}} />
      </CommentThread>,
    );
    expect(screen.getAllByRole('button', { name: 'Comment actions' })).toHaveLength(1);
    expect(await menuLabels(user)).toEqual(['Edit', 'Delete', 'Pin', 'Copy link']);
    await user.click(screen.getByRole('menuitem', { name: 'Pin' }));
    expect(onCommentAction).toHaveBeenCalledWith('pin');
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(await screen.findByRole('textbox', { name: 'Edit comment' })).toHaveValue('Opening');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMMENT-THREAD-1.16 shows Reopen in the menu while resolved, with resolveInMenu', async () => {
    const user = userEvent.setup();
    const onResolvedChange = vi.fn();
    render(
      <CommentThread
        resolveInMenu
        defaultResolved
        onResolvedChange={onResolvedChange}
        menu={copyLink}
        onAction={() => {}}
      >
        <CommentThreadReply author={ana} time={null} text="Opening" />
      </CommentThread>,
    );
    expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument();
    expect(await menuLabels(user)).toEqual(['Reopen', 'Copy link']);
    await user.click(screen.getByRole('menuitem', { name: 'Reopen' }));
    expect(onResolvedChange).toHaveBeenCalledWith(false);
    expect(await screen.findByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-1.17 shows the author of a thread with no comments yet', () => {
    const { container, rerender } = render(<CommentThread author={ana} time={null} />);
    expect(container.querySelector('.ui-comment-thread__author')).toHaveTextContent('Ana Lima');
    expect(container.querySelector('.ui-comment-thread__author')).not.toHaveTextContent(
      'Unknown time',
    );
    rerender(
      <CommentThread author={ana} time={null}>
        <CommentThreadReply author={ana} time={null} text="First" />
      </CommentThread>,
    );
    expect(container.querySelector('.ui-comment-thread__author')).toBeNull();
  });

  it('UIC-COMMENT-THREAD-1.18 hides the composer, kept mounted, until the thread is selected', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <CommentThread composerOnSelect isSelected onReply={() => {}} />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Add a comment' }), 'Kept');
    rerender(<CommentThread composerOnSelect isSelected={false} onReply={() => {}} />);
    const slot = container.querySelector('.ui-comment-thread__composer');
    expect(slot).toHaveAttribute('hidden');
    rerender(<CommentThread composerOnSelect isSelected onReply={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveValue('Kept');
  });
});
