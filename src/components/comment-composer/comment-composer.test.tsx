import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { CommentComposer, type CommentComposerProps } from './comment-composer.js';

describe('CommentComposer', () => {
  it('UIC-COMMENT-COMPOSER-1.1 draws a labelled multi-line text box and a submit button', () => {
    const { container } = render(<CommentComposer onSubmit={() => {}} />);
    const root = container.querySelector('.ui-comment-composer');
    const box = screen.getByRole('textbox', { name: 'Add a comment' });
    expect(box.tagName).toBe('TEXTAREA');
    expect(box).toHaveAttribute('placeholder', 'Add a comment');
    expect(box.closest('.ui-comment-composer__field')).toHaveClass('ui-text-field');
    const submit = screen.getByRole('button', { name: 'Comment' });
    expect(submit).toHaveClass('ui-comment-composer__submit');
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    expect(root?.querySelector('.ui-comment-composer__cancel')).toBeNull();
    expectHooksMatchSpec(container, 'COMMENT-COMPOSER', { slots: ['field', 'actions', 'submit'] });
  });

  it('UIC-COMMENT-COMPOSER-1.2 submits the trimmed text by button or chord, then clears', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CommentComposer onSubmit={onSubmit} label="Reply" submitLabel="Send" />);
    const box = screen.getByRole('textbox', { name: 'Reply' });
    await user.type(box, '   ');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await user.type(box, 'Ripe bananas{Enter}today  ');
    expect(box).toHaveValue('   Ripe bananas\ntoday  ');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenLastCalledWith('Ripe bananas\ntoday');
    expect(box).toHaveValue('');
    await user.type(box, 'Pears');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenLastCalledWith('Pears');
    await user.type(box, 'Plums');
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onSubmit).toHaveBeenLastCalledWith('Plums');
    expect(onSubmit).toHaveBeenCalledTimes(3);
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledTimes(3);
  });

  it('UIC-COMMENT-COMPOSER-1.3 stays pending while a submit settles and keeps the draft on failure', async () => {
    const user = userEvent.setup();
    let settle: { resolve: () => void; reject: () => void } = {
      resolve: () => {},
      reject: () => {},
    };
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          settle = { resolve, reject: () => reject(new Error('offline')) };
        }),
    );
    const { container } = render(<CommentComposer onSubmit={onSubmit} />);
    const box = screen.getByRole('textbox');
    await user.type(box, 'Figs');
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    const root = container.querySelector('.ui-comment-composer');
    expect(root).toHaveAttribute('data-pending', 'true');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => settle.reject());
    expect(root).not.toHaveAttribute('data-pending');
    expect(box).toHaveValue('Figs');
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    await act(async () => settle.resolve());
    expect(box).toHaveValue('');
  });

  it('UIC-COMMENT-COMPOSER-1.4 cancels by button or Escape, clearing the draft', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const outer = vi.fn();
    const { rerender } = render(
      <div onKeyDown={(event) => event.key === 'Escape' && outer()}>
        <CommentComposer onSubmit={() => {}} />
      </div>,
    );
    const box = screen.getByRole('textbox');
    await user.type(box, 'Kiwi');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(box).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    await user.type(box, 'Lime{Escape}');
    expect(box).toHaveValue('');
    expect(outer).not.toHaveBeenCalled();
    // With nothing to cancel, Escape goes on to the surface around the composer.
    await user.keyboard('{Escape}');
    expect(outer).toHaveBeenCalledTimes(1);
    rerender(
      <div onKeyDown={(event) => event.key === 'Escape' && outer()}>
        <CommentComposer onSubmit={() => {}} onCancel={onCancel} defaultValue="Mango" />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMMENT-COMPOSER-1.5 takes a controlled, default or stored draft', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('Apple');
      return (
        <CommentComposer
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next.toUpperCase());
          }}
          onSubmit={() => {}}
        />
      );
    }
    const { unmount } = render(<Controlled />);
    await user.type(screen.getByRole('textbox'), 's');
    expect(onChange).toHaveBeenLastCalledWith('Apples');
    expect(screen.getByRole('textbox')).toHaveValue('APPLES');
    unmount();

    const storage = createMemoryStorage();
    const stored = (
      <UiProvider storage={storage}>
        <CommentComposer persistKey="draft:report" defaultValue="Start" onSubmit={() => {}} />
      </UiProvider>
    );
    const { unmount: unmountFirst } = render(stored);
    expect(screen.getByRole('textbox')).toHaveValue('Start');
    await user.type(screen.getByRole('textbox'), 'ed');
    unmountFirst();
    render(stored);
    expect(screen.getByRole('textbox')).toHaveValue('Started');
    expect(storage.getItem('draft:report')).toBe('"Started"');
  });

  it('UIC-COMMENT-COMPOSER-1.5 keeps an uncontrolled draft under persistKey', async () => {
    expectTypeOf<CommentComposerProps>().not.toHaveProperty('storageKey');
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const stored = (
      <UiProvider storage={storage}>
        <CommentComposer persistKey="draft:notes" defaultValue="Plum" onSubmit={() => {}} />
      </UiProvider>
    );
    const { unmount } = render(stored);
    await user.type(screen.getByRole('textbox'), 's');
    unmount();
    render(stored);
    expect(screen.getByRole('textbox')).toHaveValue('Plums');
    expect(storage.getItem('draft:notes')).toBe('"Plums"');
  });

  it('UIC-COMMENT-COMPOSER-1.4 UIC-COMMENT-COMPOSER-1.6 offers no cancel while disabled', () => {
    render(
      <CommentComposer onSubmit={() => {}} onCancel={() => {}} defaultValue="Draft" isDisabled />,
    );
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Draft');
  });

  it('UIC-COMMENT-COMPOSER-1.6 refuses typing and submitting while disabled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <CommentComposer onSubmit={onSubmit} defaultValue="Grapes" isDisabled />,
    );
    expect(container.querySelector('.ui-comment-composer')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UIC-COMMENT-COMPOSER-1.7 focuses on mount, and forwards caller attributes', () => {
    const { container } = render(
      <UiProvider strings={{ addComment: 'Kommentieren', comment: 'Senden' }}>
        <CommentComposer
          onSubmit={() => {}}
          autoFocus
          placeholder="Say something"
          className="extra"
          id="composer"
          data-test="composer"
        />
      </UiProvider>,
    );
    const box = screen.getByRole('textbox', { name: 'Kommentieren' });
    expect(box).toHaveFocus();
    expect(box).toHaveAttribute('placeholder', 'Say something');
    expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
    const root = container.querySelector('.ui-comment-composer');
    expect(root).toHaveClass('extra');
    expect(root).toHaveAttribute('id', 'composer');
    expect(root).toHaveAttribute('data-test', 'composer');
    expectHooksMatchSpec(container, 'COMMENT-COMPOSER', { callerAttributes: ['data-test'] });
  });
});
