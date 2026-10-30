import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../modal/modal.js';
import { CommentComposer } from './comment-composer.js';

const box = () => screen.getByRole<HTMLTextAreaElement>('textbox');

/** The key presses an input method composition reports: during it, and its legacy key code. */
const composingKeys = [
  { name: 'while composing', init: { isComposing: true, keyCode: 229 } },
  { name: 'with key code 229', init: { keyCode: 229 } },
];

/** Presses a key as an input method composition reports it, which user-event cannot. */
function pressComposing(init: KeyboardEventInit & { keyCode?: number }) {
  // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode 229 on a keydown
  return fireEvent.keyDown(box(), init);
}

describe('CommentComposer keys during composition', () => {
  it.each(composingKeys)(
    'UIC-COMMENT-COMPOSER-1.2 does not submit on a composing chord ($name)',
    async ({ init }) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CommentComposer defaultValue="Composing" onSubmit={onSubmit} />);
      const notCancelled = pressComposing({ key: 'Enter', ctrlKey: true, ...init });
      pressComposing({ key: 'Enter', metaKey: true, ...init });
      expect(notCancelled).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(box()).toHaveValue('Composing');
      box().focus();
      await user.keyboard('{Control>}{Enter}{/Control}');
      expect(onSubmit).toHaveBeenCalledWith('Composing');
      expect(box()).toHaveValue('');
    },
  );

  it.each(composingKeys)(
    'UIC-COMMENT-COMPOSER-1.2 UIC-COMMENT-COMPOSER-1.4 does not cancel on a composing Escape ($name)',
    async ({ init }) => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      function Controlled() {
        const [value, setValue] = useState('Kana');
        return (
          <CommentComposer
            value={value}
            onChange={setValue}
            onSubmit={() => {}}
            onCancel={onCancel}
          />
        );
      }
      render(<Controlled />);
      pressComposing({ key: 'Escape', ...init });
      expect(onCancel).not.toHaveBeenCalled();
      expect(box()).toHaveValue('Kana');
      box().focus();
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(box()).toHaveValue('');
    },
  );

  it('UIC-COMMENT-COMPOSER-1.2 UIC-COMMENT-COMPOSER-1.4 leaves a composing Escape to an enclosing dialog, which keeps open', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal isOpen onOpenChange={onOpenChange} title="Reply">
        <CommentComposer defaultValue="Draft" onSubmit={() => {}} />
      </Modal>,
    );
    pressComposing({ key: 'Escape', isComposing: true, keyCode: 229 });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(box()).toHaveValue('Draft');
    expect(screen.getByRole('dialog', { name: 'Reply' })).toBeInTheDocument();
    box().focus();
    await user.keyboard('{Escape}');
    expect(box()).toHaveValue('');
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
