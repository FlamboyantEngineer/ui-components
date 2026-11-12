import { useEditorEventCallback, useStopEvent } from '@handlewithcare/react-prosemirror';
import { act } from '@testing-library/react';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { createContext, useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { RichTextNodeViewProps } from './rich-text-engine-view.js';
import { mountRichTextView } from './rich-text-view-mount.js';

installEditorDom();

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
    note: { group: 'block', content: 'text*', toDOM: () => ['aside', 0] },
    text: {},
  },
});

const Tone = createContext('plain');

// A node view that uses the editor hooks a host's views use, and a provider's value.
function NoteView({ children, nodeProps, ref }: RichTextNodeViewProps) {
  const tone = useContext(Tone);
  const { getPos, contentDOMRef } = nodeProps;
  const select = useEditorEventCallback((view) => view.state.doc.resolve(getPos()));
  useStopEvent(() => false);
  return (
    <section ref={ref} className="note" data-tone={tone} onPointerDown={() => select()}>
      <div ref={contentDOMRef}>{children}</div>
    </section>
  );
}

function createState(...texts: string[]) {
  const blocks = texts.map((text, index) =>
    schema.node(index % 2 ? 'note' : 'paragraph', null, [schema.text(text)]),
  );
  return EditorState.create({ doc: schema.node('doc', null, blocks) });
}

describe('mountRichTextView', () => {
  it('UIC-RICH-TEXT-EDITOR-14.7 draws a state with React node views before it returns', () => {
    const element = document.body.appendChild(document.createElement('div'));
    const mounted = mountRichTextView(element, {
      state: createState('Apples', 'Pears'),
      nodeViews: { note: NoteView },
      wrap: (view) => <Tone value="warm">{view}</Tone>,
    });
    const note = element.querySelector('section.note');
    expect(note).toHaveTextContent('Pears');
    expect(note).toHaveAttribute('data-tone', 'warm');
    expect(mounted.view.nodeDOM(8)).toBe(note);
    expect(mounted.view.editable).toBe(false);
    expect(element).toHaveTextContent('ApplesPears');
    mounted.destroy();
    element.remove();
  });

  it('UIC-RICH-TEXT-EDITOR-14.7 shows another state at once, commits its own transactions and unmounts', () => {
    const element = document.createElement('div');
    const mounted = mountRichTextView(element, {
      state: createState('Apples'),
      nodeViews: { note: NoteView },
    });
    const { view } = mounted;
    mounted.update(createState('Plums', 'Figs'));
    expect(view.state.doc.childCount).toBe(2);
    expect(element).toHaveTextContent('PlumsFigs');
    expect(element.querySelector('section.note')).toHaveTextContent('Figs');
    act(() => view.dispatch(view.state.tr.insertText('Ripe ', 1)));
    expect(element).toHaveTextContent('Ripe PlumsFigs');
    mounted.destroy();
    expect(element).toBeEmptyDOMElement();
  });
});
