// Shared fixtures for the rich-text editor's unit tests: the browser APIs jsdom lacks, a sample
// document and a helper that renders an editor and reads its value.

import { useEditorEffect } from '@handlewithcare/react-prosemirror';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useState } from 'react';
import { beforeAll } from 'vitest';
import {
  type RichTextDocument,
  RichTextEditor,
  type RichTextEditorProps,
} from '../src/components/rich-text-editor/rich-text-editor.js';

function emptyRect(): DOMRect {
  return new DOMRect(0, 0, 0, 0);
}

/**
 * Fills in the layout and input APIs the editor engine calls and jsdom does not implement: input
 * events' target ranges, hit testing and range geometry (every rect is empty).
 */
export function installEditorDom(): void {
  beforeAll(() => {
    const input = InputEvent.prototype as InputEvent & { getTargetRanges?: () => StaticRange[] };
    input.getTargetRanges ??= () => [];
    document.elementFromPoint ??= () => document.body;
    Document.prototype.elementFromPoint ??= () => document.body;
    Range.prototype.getClientRects ??= () =>
      Object.assign([emptyRect()], { item: () => emptyRect() }) as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect ??= emptyRect;
  });
}

export const sampleDocument: RichTextDocument = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Harvest notes' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Apples are ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'ripe' },
        { type: 'text', text: ' in the orchard.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pears' }] }],
        },
      ],
    },
  ],
};

/** The document's content element (the text box). */
export function getContent(name = 'Notes'): HTMLElement {
  return screen.getByRole('textbox', { name });
}

/** Renders an editor labelled `Notes` whose value the returned `value()` reads after each change. */
export function renderEditor(props: Partial<RichTextEditorProps> = {}) {
  const changes: RichTextDocument[] = [];
  function Harness() {
    const [value, setValue] = useState<RichTextDocument | undefined>(props.value);
    const controlled = props.value === undefined ? {} : { value };
    return (
      <RichTextEditor
        label="Notes"
        {...props}
        {...controlled}
        onChange={(next) => {
          changes.push(next);
          setValue(next);
          props.onChange?.(next);
        }}
      />
    );
  }
  const user = userEvent.setup();
  const view = render(<Harness />);
  return { ...view, user, changes, value: () => changes.at(-1) };
}

/** The editor's view, as `ViewProbe` (rendered among the editor's children) last saw it. */
export const editorView: { current: EditorView | null } = { current: null };

/** Records the editor's view in `editorView`, so a test can set the selection. */
export function ViewProbe() {
  useEditorEffect((view) => {
    editorView.current = view;
  });
  return null;
}

/** Selects the document range from `from` to `to` (a caret without `to`) and focuses it. */
export function selectRange(from: number, to = from): void {
  const view = editorView.current;
  if (!view) throw new Error('Render a ViewProbe inside the editor first.');
  act(() => {
    view.focus();
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
  });
}
