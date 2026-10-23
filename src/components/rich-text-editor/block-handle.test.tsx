import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
  editorView,
  getContent,
  installEditorDom,
  renderEditor,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import { BlockHandle } from './block-handle.js';
import { RichTextEditor, type RichTextDocument } from './rich-text-editor.js';

installEditorDom();

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const blocks: RichTextDocument = {
  type: 'doc',
  content: [paragraph('One'), paragraph('Two'), paragraph('Three')],
};

function texts(document: RichTextDocument | undefined) {
  return document?.content?.map((block) => block.content?.[0]?.text ?? block.type);
}

function renderHandle(props: { isReadOnly?: boolean } = {}) {
  return renderEditor({
    ...props,
    defaultValue: blocks,
    children: (
      <>
        <ViewProbe />
        <BlockHandle className="caller" data-testid="handle" />
      </>
    ),
  });
}

function handle() {
  return document.querySelector('.ui-block-handle');
}

describe('BlockHandle', () => {
  it('UIC-RICH-TEXT-EDITOR-9.1 UIC-RICH-TEXT-EDITOR-11.2 sits beside the block holding the selection while the document has focus', () => {
    const { container } = renderHandle();
    expect(handle()).toBeNull();
    selectRange(7);
    const root = handle();
    expect(root).toHaveClass('caller');
    expect(root).toHaveAttribute('data-testid', 'handle');
    expect(root).toHaveStyle({ position: 'absolute', top: '0px' });
    expect(container.querySelector('.ui-rich-text-editor__surface')).toContainElement(
      root as HTMLElement,
    );
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR', {
      slots: ['ui-block-handle__grip', 'ui-block-handle__menu'],
      callerAttributes: ['data-testid'],
    });
    act(() => getContent().blur());
    expect(handle()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-9.1 renders nothing in a read-only editor', () => {
    renderHandle({ isReadOnly: true });
    selectRange(2);
    expect(handle()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-9.2 drags its block with the grip', () => {
    renderHandle();
    selectRange(7);
    const grip = document.querySelector('.ui-block-handle__grip') as HTMLElement;
    expect(grip).toHaveAttribute('aria-hidden', 'true');
    expect(grip).toHaveAttribute('draggable', 'true');
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: 'all' };
    fireEvent.dragStart(grip, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'Two');
    expect(dataTransfer.effectAllowed).toBe('move');
    expect(editorView.current?.dragging?.move).toBe(true);
    expect(editorView.current?.dragging?.slice.content.firstChild?.textContent).toBe('Two');
    expect(handle()).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragEnd(grip);
    expect(handle()).not.toHaveAttribute('data-dragging');
  });

  it('UIC-RICH-TEXT-EDITOR-9.3 moves, turns, duplicates and deletes its block from the menu', async () => {
    const { user, value } = renderHandle();
    selectRange(7);
    const open = async () => {
      await user.click(screen.getByRole('button', { name: 'Block actions' }));
    };
    await open();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Turn into',
      'Move up',
      'Move down',
      'Duplicate',
      'Delete',
    ]);
    await user.click(screen.getByRole('menuitem', { name: 'Move down' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two']);
    await open();
    await user.click(screen.getByRole('menuitem', { name: 'Turn into' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Heading 2' }));
    expect(value()?.content?.[2]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
    await open();
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two', 'Two']);
    await open();
    expect(screen.getByRole('menuitem', { name: 'Move down' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two']);
  });

  it('UIC-RICH-TEXT-EDITOR-9.3 UIC-RICH-TEXT-EDITOR-5.5 turns and deletes every block from the menu after a select-all', async () => {
    const { user, value } = renderHandle();
    selectRange(7);
    await user.keyboard('{Control>}a{/Control}');
    const open = async () => {
      await user.click(screen.getByRole('button', { name: 'Block actions' }));
      return screen.findByRole('menu');
    };
    await open();
    for (const name of ['Move up', 'Move down'])
      expect(screen.getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('menuitem', { name: 'Turn into' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Heading 2' }));
    expect(value()?.content?.map((block) => block.attrs?.level)).toEqual([2, 2, 2]);
    expect(texts(value())).toEqual(['One', 'Two', 'Three']);
    await open();
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(value()?.content).toEqual([{ type: 'paragraph' }]);
  });

  it('UIC-RICH-TEXT-EDITOR-3.1 UIC-RICH-TEXT-EDITOR-5.5 moves the selected blocks with Alt+Shift+Up and Down, and none after a select-all', async () => {
    const { user, value, changes } = renderHandle();
    selectRange(2, 7);
    await user.keyboard('{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}');
    expect(texts(value())).toEqual(['Three', 'One', 'Two']);
    await user.keyboard('{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}');
    expect(texts(value())).toEqual(['One', 'Two', 'Three']);
    await user.keyboard('{Control>}a{/Control}');
    const count = changes.length;
    await user.keyboard('{Alt>}{Shift>}{ArrowDown}{ArrowUp}{/Shift}{/Alt}');
    expect(changes).toHaveLength(count);
    await user.keyboard('{Control>}{Alt>}1{/Alt}{/Control}');
    expect(value()?.content?.map((block) => block.type)).toEqual(['heading', 'heading', 'heading']);
  });

  it('UIC-RICH-TEXT-EDITOR-4.1 UIC-RICH-TEXT-EDITOR-9.3 dismisses an open block menu when the editor locks', async () => {
    const user = userEvent.setup();
    const editor = (isReadOnly: boolean) => (
      <RichTextEditor label="Notes" defaultValue={blocks} isReadOnly={isReadOnly}>
        <ViewProbe />
        <BlockHandle />
      </RichTextEditor>
    );
    const { rerender } = render(editor(false));
    selectRange(2);
    await user.click(screen.getByRole('button', { name: 'Block actions' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    rerender(editor(true));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(editor(false));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
