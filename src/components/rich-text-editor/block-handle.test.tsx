import { act, fireEvent, screen } from '@testing-library/react';
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
import type { RichTextDocument } from './rich-text-editor.js';

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
      await screen.findByRole('menu');
    };
    await open();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Turn into',
      'Move up',
      'Move down',
      'Duplicate',
      'Delete',
    ]);
    await user.click(await screen.findByRole('menuitem', { name: 'Move down' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two']);
    await open();
    await user.click(await screen.findByRole('menuitem', { name: 'Turn into' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Heading 2' }));
    expect(value()?.content?.[2]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
    await open();
    await user.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two', 'Two']);
    await open();
    expect(screen.getByRole('menuitem', { name: 'Move down' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(texts(value())).toEqual(['One', 'Three', 'Two']);
  });
});
