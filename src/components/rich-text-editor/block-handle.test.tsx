import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
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

function renderHandle({
  grip,
  menu,
  ...props
}: { isReadOnly?: boolean; grip?: boolean; menu?: boolean } = {}) {
  return renderEditor({
    ...props,
    defaultValue: blocks,
    children: (
      <>
        <ViewProbe />
        <BlockHandle className="caller" data-testid="handle" grip={grip} menu={menu} />
      </>
    ),
  });
}

function surface() {
  return document.querySelector('.ui-rich-text-editor__surface');
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

  it('UIC-RICH-TEXT-EDITOR-9.1 picks the block level with the pointer in the gutter, across gaps and scrolling', async () => {
    // Each paragraph 20px tall with a 10px gap, from the viewport's top.
    const rect = (top: number, height: number) => new DOMRect(0, top, 100, height);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const index = ['One', 'Two', 'Three'].indexOf(this.textContent);
      const scroll = surface()?.scrollTop ?? 0;
      return this.tagName === 'P' && index >= 0 ? rect(index * 30 - scroll, 20) : rect(0, 0);
    });
    const { user } = renderHandle();
    const gutter = surface() as HTMLElement;
    const topAt = async (clientY: number) => {
      await user.pointer({ target: gutter, coords: { clientX: 4, clientY } });
      return handle()?.getAttribute('style');
    };
    expect(await topAt(35)).toContain('top: 30px');
    expect(await topAt(5)).toContain('top: 0px');
    // In the gap after Two, nearer Three.
    expect(await topAt(57)).toContain('top: 60px');
    expect(await topAt(200)).toContain('top: 60px');
    // Over the handle itself the target stays.
    await user.pointer({ target: handle() as HTMLElement, coords: { clientX: 4, clientY: 5 } });
    expect(handle()?.getAttribute('style')).toContain('top: 60px');
    // The surface scrolls 30px under a still pointer at 35: Three is now beside it.
    await topAt(35);
    gutter.scrollTop = 30;
    fireEvent.scroll(gutter);
    expect(handle()?.getAttribute('style')).toContain('top: 60px');
    gutter.scrollTop = 0;
    fireEvent.scroll(gutter);
    expect(handle()?.getAttribute('style')).toContain('top: 30px');
    await user.unhover(gutter);
    expect(handle()).toBeNull();
    vi.restoreAllMocks();
  });

  it('UIC-RICH-TEXT-EDITOR-9.1 renders nothing in a read-only editor', () => {
    renderHandle({ isReadOnly: true });
    selectRange(2);
    expect(handle()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-9.2 drags its block with the grip', () => {
    const { value } = renderHandle();
    selectRange(7);
    const grip = document.querySelector('.ui-block-handle__grip') as HTMLElement;
    const surface = document.querySelector('.ui-rich-text-editor__surface') as HTMLElement;
    expect(grip).toHaveAttribute('aria-hidden', 'true');
    expect(grip).toHaveAttribute('draggable', 'true');
    const dataTransfer = {
      setData: vi.fn(),
      setDragImage: vi.fn(),
      effectAllowed: 'all',
      dropEffect: 'none',
    };
    fireEvent.dragStart(grip, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'Two');
    expect(dataTransfer.effectAllowed).toBe('move');
    expect(handle()).toHaveAttribute('data-dragging', 'true');
    // Unlaid blocks all sit at the top, so a pointer below them points after the last block.
    fireEvent.dragOver(getContent(), { dataTransfer, clientY: 10 });
    expect(dataTransfer.dropEffect).toBe('move');
    expect(document.querySelector('.ui-block-handle__drop-indicator')).toHaveStyle({
      position: 'absolute',
    });
    fireEvent.drop(getContent(), { dataTransfer, clientY: 10 });
    expect(texts(value())).toEqual(['One', 'Three', 'Two']);
    expect(document.querySelector('.ui-block-handle__drop-indicator')).toBeNull();
    fireEvent.dragEnd(grip);
    expect(handle()).not.toHaveAttribute('data-dragging');
    expect(surface).toContainElement(handle() as HTMLElement);
  });

  it('UIC-RICH-TEXT-EDITOR-9.2 changes nothing for a cancelled drag or a drop in place', () => {
    const { value } = renderHandle();
    selectRange(14);
    const grip = document.querySelector('.ui-block-handle__grip') as HTMLElement;
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), dropEffect: 'none' };
    fireEvent.dragStart(grip, { dataTransfer });
    fireEvent.dragOver(getContent(), { dataTransfer, clientY: 10 });
    expect(document.querySelector('.ui-block-handle__drop-indicator')).toBeNull();
    fireEvent.drop(getContent(), { dataTransfer, clientY: 10 });
    fireEvent.dragEnd(grip);
    expect(texts(value())).toBeUndefined();
    selectRange(2);
    fireEvent.dragStart(grip, { dataTransfer });
    fireEvent.dragEnd(grip);
    fireEvent.drop(getContent(), { dataTransfer, clientY: 10 });
    expect(texts(value())).toBeUndefined();
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

  it('UIC-RICH-TEXT-EDITOR-9.4 sizes the gutter for the configured controls and releases it', () => {
    const editor = (controls?: { grip: boolean; menu: boolean }) => (
      <RichTextEditor label="Body" defaultValue={blocks}>
        {controls ? <BlockHandle {...controls} /> : null}
      </RichTextEditor>
    );
    const { rerender } = render(editor({ grip: true, menu: true }));
    expect(surface()).toHaveAttribute('data-gutter', 'both');
    rerender(editor({ grip: true, menu: false }));
    expect(surface()).toHaveAttribute('data-gutter', 'grip');
    rerender(editor({ grip: false, menu: true }));
    expect(surface()).toHaveAttribute('data-gutter', 'menu');
    rerender(editor({ grip: false, menu: false }));
    expect(surface()).not.toHaveAttribute('data-gutter');
    rerender(editor({ grip: true, menu: true }));
    expect(surface()).toHaveAttribute('data-gutter', 'both');
    rerender(editor());
    expect(surface()).not.toHaveAttribute('data-gutter');
  });

  it('UIC-RICH-TEXT-EDITOR-9.4 shows the chosen controls and keeps a gutter only for a handle', () => {
    const { unmount } = renderHandle({ menu: false });
    expect(surface()).toHaveAttribute('data-gutter', 'grip');
    selectRange(7);
    expect(document.querySelector('.ui-block-handle__grip')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Block actions' })).not.toBeInTheDocument();
    unmount();
    renderHandle({ grip: false });
    selectRange(7);
    expect(document.querySelector('.ui-block-handle__grip')).toBeNull();
    expect(screen.getByRole('button', { name: 'Block actions' })).toBeInTheDocument();
  });

  it('UIC-RICH-TEXT-EDITOR-9.4 keeps no gutter and no handle without controls or without a handle', async () => {
    const { unmount } = renderHandle({ grip: false, menu: false });
    selectRange(7);
    expect(handle()).toBeNull();
    expect(surface()).not.toHaveAttribute('data-gutter');
    unmount();
    const { value, user } = renderEditor({ defaultValue: blocks, children: <ViewProbe /> });
    expect(surface()).not.toHaveAttribute('data-gutter');
    selectRange(7);
    await user.keyboard('{Alt>}{Shift>}{ArrowUp}{/Shift}{/Alt}');
    expect(texts(value())).toEqual(['Two', 'One', 'Three']);
  });
});
