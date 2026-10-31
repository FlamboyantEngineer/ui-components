import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installComposerRow } from '../../../test/composer-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { useMessageComposerControls } from './composer-controls.js';
import { MessageComposerEmojiButton } from './composer-tools.js';
import { MessageComposer } from './message-composer.js';
import { RichMessageComposer } from './rich/rich-message-composer.js';

installEditorDom();

/** A host's own control that records each of its renders in `onRender`. */
function CountingControl({ onRender }: { onRender: () => void }) {
  const { isCompact } = useMessageComposerControls();
  onRender();
  return <button aria-label="Timer">{isCompact ? '⏱' : '⏱ Timer'}</button>;
}

/** Counts reads of the composer row's content width, which measuring it takes. */
function countRowReads(container: HTMLElement) {
  const row = container.querySelector('.ui-message-composer__footer');
  if (!row) throw new Error('no composer row');
  let reads = 0;
  Object.defineProperty(row, 'scrollWidth', {
    configurable: true,
    get: () => {
      reads += 1;
      return 0;
    },
  });
  return () => reads;
}

describe('MessageComposer render cost', () => {
  it('UIC-MESSAGE-COMPOSER-6.6 renders the controls again only when what they show changes', async () => {
    installComposerRow();
    const user = userEvent.setup();
    const onRender = vi.fn();
    render(
      <MessageComposer
        onSubmit={() => undefined}
        onAttach={() => undefined}
        startControls={
          <>
            <CountingControl onRender={onRender} />
            <MessageComposerEmojiButton />
          </>
        }
      />,
    );
    await user.click(screen.getByRole('textbox', { name: 'Message' }));
    // The first character gives the composer something to send.
    await user.keyboard('H');
    onRender.mockClear();
    await user.keyboard('ello there');
    expect(onRender).not.toHaveBeenCalled();
  });

  it('UIC-MESSAGE-COMPOSER-6.6 calls the latest composer actions from controls that did not render again', async () => {
    installComposerRow();
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageComposer onSubmit={onSubmit} />);
    await user.click(screen.getByRole('textbox', { name: 'Message' }));
    await user.keyboard('Hello there');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('Hello there');
  });

  it('UIC-MESSAGE-COMPOSER-6.6 measures the row as it resizes, not as the reader types', async () => {
    const row = installComposerRow();
    const user = userEvent.setup();
    const { container } = render(<MessageComposer onSubmit={() => undefined} />);
    const reads = countRowReads(container);
    await user.click(screen.getByRole('textbox', { name: 'Message' }));
    await user.keyboard('Hello there');
    expect(reads()).toBe(0);
    row.resize(container, 300, 200);
    expect(container.querySelector('.ui-message-composer')).not.toHaveAttribute('data-compact');
  });

  it('UIC-MESSAGE-COMPOSER-6.6 sets the rich input row limits from its rows, not on every keystroke', async () => {
    installComposerRow();
    const user = userEvent.setup();
    const { container, rerender } = render(
      <RichMessageComposer onSubmit={() => undefined} minRows={2} />,
    );
    const input = container.querySelector<HTMLElement>('.ui-message-composer__input');
    if (!input) throw new Error('no input');
    expect(input.style.maxHeight).not.toBe('');
    const writes: string[] = [];
    Object.defineProperty(input.style, 'maxHeight', {
      configurable: true,
      get: () => writes.at(-1) ?? '',
      set: (value: string) => writes.push(value),
    });
    await user.click(screen.getByRole('textbox', { name: 'Message' }));
    await user.keyboard('Hello there');
    expect(writes).toEqual([]);
    rerender(<RichMessageComposer onSubmit={() => undefined} minRows={2} maxRows={4} />);
    expect(writes).toHaveLength(1);
  });
});
