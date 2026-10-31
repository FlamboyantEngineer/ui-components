import { createRef } from 'react';
import { LinkGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ReactionBar } from '../reaction-bar/reaction-bar.js';
import { CommentThreadReply } from './comment-thread-reply.js';
import { CommentThread } from './comment-thread.js';

const ana = { name: 'Ana Lima', colorKey: 'ana' };
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when overlays change.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('CommentThreadReply', () => {
  it('UIC-COMMENT-THREAD-2.1 draws the author, a live time, the edited marker and the body', () => {
    const time = '2026-04-20T10:25:00';
    const { container } = render(
      <CommentThreadReply
        author={ana}
        time={time}
        getNow={() => new Date(2026, 3, 20, 10, 30)}
        isEdited
        text="Plain text"
      >
        <strong>Rich body</strong>
      </CommentThreadReply>,
    );
    const article = screen.getByRole('article', { name: 'Ana Lima' });
    expect(article).toHaveClass('ui-comment-thread-reply');
    expect(article).toHaveAttribute('data-edited', 'true');
    const author = article.querySelector('.ui-comment-thread-reply__author');
    expect(author).toHaveClass('ui-user-identity');
    expect(author).toHaveAttribute('data-size', 'sm');
    const attribution = article.querySelector('.ui-comment-thread-reply__time');
    expect(attribution).toHaveClass('ui-attribution');
    expect(attribution?.querySelector('time.ui-relative-time')).toHaveAttribute('datetime', time);
    expect(attribution).toHaveTextContent('5 minutes ago');
    expect(article.querySelector('.ui-comment-thread-reply__edited')).toHaveTextContent('Edited');
    expect(article.querySelector('.ui-comment-thread-reply__body')).toHaveTextContent('Rich body');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: [
        'ui-comment-thread-reply__header',
        'ui-comment-thread-reply__author',
        'ui-comment-thread-reply__time',
        'ui-comment-thread-reply__edited',
        'ui-comment-thread-reply__body',
      ],
    });
  });

  it('UIC-COMMENT-THREAD-2.1 reads the time against fallbackAfterDays', () => {
    render(
      <CommentThreadReply
        author={ana}
        time="2026-04-10T09:00:00"
        getNow={() => new Date(2026, 3, 20, 10, 30)}
        fallbackAfterDays={1}
        timeZone="UTC"
        text="Older"
      />,
    );
    const time = screen.getByRole('article').querySelector('.ui-comment-thread-reply__time');
    expect(time).toHaveTextContent('Apr 10, 2026');
  });

  it('UIC-COMMENT-THREAD-2.1 shows the text without children, and an unknown time', () => {
    render(<CommentThreadReply author={ana} time={null} text="Pears are ripe" />);
    const article = screen.getByRole('article', { name: 'Ana Lima' });
    expect(article).not.toHaveAttribute('data-edited');
    expect(article.querySelector('.ui-comment-thread-reply__body')).toHaveTextContent(
      'Pears are ripe',
    );
    expect(article.querySelector('.ui-comment-thread-reply__time')).toHaveTextContent(
      'Unknown time',
    );
    expect(article.querySelector('.ui-comment-thread-reply__edited')).toBeNull();
  });

  it('UIC-COMMENT-THREAD-2.2 runs caller actions from the comment menu', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <CommentThreadReply
        author={ana}
        time={minutesAgo(1)}
        text="Hi"
        actions={[{ id: 'copy-link', label: 'Copy link', icon: LinkGlyph }]}
        onAction={onAction}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Comment actions' });
    expect(trigger).toHaveClass('ui-dropdown-menu', 'ui-comment-thread-reply__actions');
    await userEvent.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Copy link']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Copy link' }));
    expect(onAction).toHaveBeenCalledWith('copy-link');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: ['ui-comment-thread-reply__actions'],
    });
    render(<CommentThreadReply author={ana} time={minutesAgo(1)} text="No menu" />);
    expect(screen.getAllByRole('button', { name: 'Comment actions' })).toHaveLength(1);
  });

  it('UIC-COMMENT-THREAD-2.3 edits the text in place and saves it', async () => {
    const onEdit = vi.fn();
    const onAction = vi.fn();
    const { container } = render(
      <CommentThreadReply
        author={ana}
        time={minutesAgo(1)}
        text="Bananas are ripe"
        onEdit={onEdit}
        onAction={onAction}
        reactions={<span>reactions</span>}
      >
        <em>Bananas are ripe</em>
      </CommentThreadReply>,
    );
    const article = screen.getByRole('article');
    await userEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(onAction).not.toHaveBeenCalled();
    expect(article).toHaveAttribute('data-editing', 'true');
    const box = await screen.findByRole('textbox', { name: 'Edit comment' });
    await waitFor(() => expect(box).toHaveFocus());
    expect(box).toHaveValue('Bananas are ripe');
    expect(article.querySelector('.ui-comment-thread-reply__body')).toBeNull();
    expect(article.querySelector('.ui-comment-thread-reply__reactions')).toBeNull();
    expect(box.closest('.ui-comment-composer')?.parentElement).toHaveClass(
      'ui-comment-thread-reply__editor',
    );
    expectHooksMatchSpec(container, 'COMMENT-THREAD', {
      slots: ['ui-comment-thread-reply__editor'],
    });
    await userEvent.clear(box);
    await userEvent.type(box, 'Bananas are gone');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onEdit).toHaveBeenCalledWith('Bananas are gone');
    expect(article).not.toHaveAttribute('data-editing');
    expect(screen.getByRole('button', { name: 'Comment actions' })).toHaveFocus();
    expect(article.querySelector('.ui-comment-thread-reply__reactions')).toHaveTextContent(
      'reactions',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    await userEvent.type(await screen.findByRole('textbox', { name: 'Edit comment' }), '!');
    await userEvent.keyboard('{Escape}');
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(article.querySelector('.ui-comment-thread-reply__body')).toHaveTextContent(
      'Bananas are ripe',
    );
  });

  it('UIC-COMMENT-THREAD-2.3 renders the caller editor', async () => {
    const onEdit = vi.fn();
    render(
      <CommentThreadReply
        author={ana}
        time={minutesAgo(1)}
        text="Draft"
        onEdit={onEdit}
        renderEditor={({ defaultValue, onSubmit, onCancel }) => (
          <div>
            <button type="button" onClick={() => onSubmit(`${defaultValue} v2`)}>
              Publish
            </button>
            <button type="button" onClick={onCancel}>
              Drop
            </button>
          </div>
        )}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    expect(onEdit).toHaveBeenCalledWith('Draft v2');
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  it('UIC-COMMENT-THREAD-2.4 deletes after confirmation', async () => {
    const onDelete = vi.fn();
    render(
      <CommentThreadReply
        author={ana}
        time={minutesAgo(1)}
        text="Old"
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Edit', 'Delete']);
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'data-tone',
      'danger',
    );
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    let dialog = await screen.findByRole('alertdialog', { name: 'Delete comment' });
    expect(dialog).toHaveTextContent('The comment will be removed from the thread.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Comment actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    dialog = await screen.findByRole('alertdialog', { name: 'Delete comment' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMMENT-THREAD-2.5 offers no actions in a read-only thread', () => {
    render(
      <CommentThread isReadOnly>
        <CommentThreadReply
          author={ana}
          time={minutesAgo(1)}
          text="Locked"
          onEdit={() => {}}
          onDelete={() => {}}
          reactions={<ReactionBar reactions={[{ emoji: '👍', count: 1 }]} />}
        />
      </CommentThread>,
    );
    expect(screen.queryByRole('button', { name: 'Comment actions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '👍 1' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-COMMENT-THREAD-2.6 forwards ref to its root', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <CommentThreadReply author={ana} time={minutesAgo(1)} text="Hi" ref={ref} />,
    );
    expect(ref.current).toBe(container.querySelector('.ui-comment-thread-reply'));
  });

  it('UIC-COMMENT-THREAD-2.6 forwards caller attributes', () => {
    const { container } = render(
      <CommentThreadReply
        author={ana}
        time={minutesAgo(1)}
        text="Hi"
        className="extra"
        id="reply-1"
        data-test="reply"
      />,
    );
    const article = screen.getByRole('article');
    expect(article).toHaveClass('ui-comment-thread-reply', 'extra');
    expect(article).toHaveAttribute('id', 'reply-1');
    expect(article).toHaveAttribute('data-test', 'reply');
    expectHooksMatchSpec(container, 'COMMENT-THREAD', { callerAttributes: ['data-test'] });
  });
});
