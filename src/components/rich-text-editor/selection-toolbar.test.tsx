import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  getContent,
  installEditorDom,
  renderEditor,
  selectRange,
  ViewProbe,
} from '../../../test/rich-text-fixtures.js';
import { type RichTextDocument, RichTextEditor } from './rich-text-editor.js';
import { SelectionToolbar } from './selection-toolbar.js';

installEditorDom();

const note: RichTextDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pick pears' }] }],
};

function floating() {
  return screen.queryByRole('toolbar', { name: 'Selection formatting' });
}

describe('SelectionToolbar', () => {
  it('UIC-RICH-TEXT-EDITOR-7.1 UIC-RICH-TEXT-EDITOR-11.2 floats the marks and the link over selected text', async () => {
    const { user, value } = renderEditor({
      defaultValue: note,
      children: (
        <>
          <ViewProbe />
          <SelectionToolbar className="caller" data-testid="floating">
            <button type="button">Extra</button>
          </SelectionToolbar>
        </>
      ),
    });
    selectRange(3);
    expect(floating()).toBeNull();
    selectRange(6, 11);
    const row = floating();
    expect(row?.parentElement).toHaveClass('ui-selection-toolbar__row', 'ui-toolbar-row');
    const popover = document.querySelector('.ui-selection-toolbar');
    expect(popover).toHaveClass('caller');
    expect(popover).toHaveAttribute('data-testid', 'floating');
    const names = within(row as HTMLElement)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual([
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Code',
      'Link',
      'Extra',
    ]);
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Italic' }));
    expect(value()?.content?.[0]?.content?.[1]).toEqual({
      type: 'text',
      text: 'pears',
      marks: [{ type: 'italic' }],
    });
    expect(getContent()).toHaveFocus();
    expectHooksMatchSpec(document.body, 'RICH-TEXT-EDITOR', { callerAttributes: ['data-testid'] });
    act(() => getContent().blur());
    expect(floating()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-7.1 shows nothing in a read-only editor and takes a name', () => {
    renderEditor({
      defaultValue: note,
      isReadOnly: true,
      children: (
        <>
          <ViewProbe />
          <SelectionToolbar aria-label="Quick marks" />
        </>
      ),
    });
    selectRange(1, 5);
    expect(screen.queryByRole('toolbar', { name: 'Quick marks' })).not.toBeInTheDocument();
  });

  it('UIC-RICH-TEXT-EDITOR-7.1 follows the layout only while the toolbar may show', () => {
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = renderEditor({
      defaultValue: note,
      isReadOnly: true,
      children: (
        <>
          <ViewProbe />
          <SelectionToolbar aria-label="Quick marks" />
        </>
      ),
    });
    // A caret is never followed: a range the toolbar cannot show for costs no more frames.
    selectRange(2);
    const caretFrames = frame.mock.calls.length;
    selectRange(1, 5);
    const readOnlyFrames = frame.mock.calls.length - caretFrames;
    frame.mockClear();
    unmount();
    renderEditor({
      defaultValue: note,
      children: (
        <>
          <ViewProbe />
          <SelectionToolbar aria-label="Marks" />
        </>
      ),
    });
    selectRange(1, 5);
    expect(screen.getByRole('toolbar', { name: 'Marks' })).toBeInTheDocument();
    expect(frame).toHaveBeenCalled();
    expect(readOnlyFrames).toBe(0);
    act(() => getContent().blur());
    expect(cancel).toHaveBeenCalled();
    frame.mockRestore();
    cancel.mockRestore();
  });

  it('UIC-RICH-TEXT-EDITOR-7.2 takes focus on Alt+F10 and gives it back on Escape', async () => {
    const { user } = renderEditor({
      defaultValue: note,
      children: (
        <>
          <ViewProbe />
          <SelectionToolbar aria-label="Quick marks" />
        </>
      ),
    });
    selectRange(1, 5);
    const row = screen.getByRole('toolbar', { name: 'Quick marks' });
    await user.keyboard('{Alt>}{F10}{/Alt}');
    expect(within(row).getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(getContent()).toHaveFocus();
    expect(screen.queryByRole('toolbar', { name: 'Quick marks' })).not.toBeInTheDocument();
    selectRange(1, 4);
    expect(screen.getByRole('toolbar', { name: 'Quick marks' })).toBeInTheDocument();
  });

  it('UIC-RICH-TEXT-EDITOR-6.3 UIC-RICH-TEXT-EDITOR-7.1 links from the floating toolbar without submitting a form around the editor', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form aria-label="Page" onSubmit={onSubmit}>
        <RichTextEditor label="Notes" defaultValue={note}>
          <ViewProbe />
          <SelectionToolbar />
        </RichTextEditor>
      </form>,
    );
    selectRange(6, 11);
    await user.click(within(floating() as HTMLElement).getByRole('button', { name: 'Link' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Link address' }),
      'https://example.com/pears{Enter}',
    );
    expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
