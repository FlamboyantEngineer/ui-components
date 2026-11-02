import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ViewProbe,
  getContent,
  installEditorDom,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import { BlockHandle } from './block-handle.js';
import { RichTextEditor, type RichTextDocument } from './rich-text-editor.js';

installEditorDom();

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const documentOf = (...texts: string[]): RichTextDocument => ({
  type: 'doc',
  content: texts.map(paragraph),
});

/** A controlled editor the test replaces the value of, as a host would. */
function renderControlled(value: RichTextDocument) {
  const onChange = vi.fn();
  const editor = (current: RichTextDocument) => (
    <RichTextEditor label="Notes" value={current} onChange={onChange}>
      <ViewProbe />
      <BlockHandle />
    </RichTextEditor>
  );
  const view = render(editor(value));
  return { onChange, replace: (next: RichTextDocument) => view.rerender(editor(next)) };
}

function startDrag() {
  const grip = document.querySelector('.ui-block-handle__grip') as HTMLElement;
  const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), dropEffect: 'none' };
  fireEvent.dragStart(grip, { dataTransfer });
  return { grip, dataTransfer };
}

const indicator = () => document.querySelector('.ui-block-handle__drop-indicator');

describe('BlockHandle drag and a replaced document', () => {
  it('UIC-RICH-TEXT-EDITOR-9.2 ends a drag whose block the host replaced out of range', () => {
    const { onChange, replace } = renderControlled(documentOf('One', 'Two', 'Three'));
    selectRange(12);
    const { grip, dataTransfer } = startDrag();
    replace(documentOf('Only'));
    // No error, no gap, and the drop neither moves a block nor drops the dragged text.
    expect(() => fireEvent.dragOver(getContent(), { dataTransfer, clientY: 10 })).not.toThrow();
    expect(indicator()).toBeNull();
    const drop = fireEvent.drop(getContent(), { dataTransfer, clientY: 10 });
    expect(drop).toBe(false);
    fireEvent.dragEnd(grip);
    expect(onChange).not.toHaveBeenCalled();
    expect(getContent()).toHaveTextContent('Only');
  });

  it('UIC-RICH-TEXT-EDITOR-9.2 never moves another block at the dragged block’s old position', () => {
    const { onChange, replace } = renderControlled(documentOf('One', 'Two', 'Three'));
    selectRange(7);
    const { grip, dataTransfer } = startDrag();
    // Position 5 still starts a block, now a different one.
    replace(documentOf('Gamma', 'Alpha', 'Blue'));
    fireEvent.dragOver(getContent(), { dataTransfer, clientY: 10 });
    expect(indicator()).toBeNull();
    fireEvent.drop(getContent(), { dataTransfer, clientY: 10 });
    fireEvent.dragEnd(grip);
    expect(onChange).not.toHaveBeenCalled();
    expect([...getContent().querySelectorAll('p')].map((node) => node.textContent)).toEqual([
      'Gamma',
      'Alpha',
      'Blue',
    ]);
    // A new drag in the new document moves its block.
    selectRange(9);
    const next = startDrag();
    fireEvent.dragOver(getContent(), { dataTransfer: next.dataTransfer, clientY: 10 });
    fireEvent.drop(getContent(), { dataTransfer: next.dataTransfer, clientY: 10 });
    fireEvent.dragEnd(next.grip);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
