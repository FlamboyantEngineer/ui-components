import type { NodeViewComponentProps } from '@handlewithcare/react-prosemirror';
import { inputRules, wrappingInputRule } from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';
import { useState } from 'react';
import {
  createRichTextSchema,
  type RichTextDocument,
  RichTextEditor,
  type RichTextExtension,
  serializeRichTextHtml,
} from '../../src/components/rich-text-editor/index.js';

/** Renders a tip as a labelled aside around its editable content. */
function TipView({ children, nodeProps, ref, ...props }: NodeViewComponentProps) {
  const { contentDOMRef } = nodeProps;
  return (
    <aside {...props} ref={ref} aria-label="Tip" data-lab-tip="">
      <div ref={contentDOMRef}>{children}</div>
    </aside>
  );
}

/**
 * One feature as an extension: a `tip` block placed after paragraphs, its view, an input rule
 * that wraps a paragraph started with `!! ` and a plugin that marks the editor as extended.
 */
const tipExtension: RichTextExtension = {
  name: 'tip',
  requires: ['base'],
  nodes: [
    {
      name: 'tip',
      order: 15,
      spec: {
        group: 'block',
        content: 'paragraph+',
        defining: true,
        parseDOM: [{ tag: 'aside[data-tip]' }],
        toDOM: () => ['aside', { 'data-tip': 'true' }, 0],
      },
    },
  ],
  nodeViews: { tip: TipView },
  plugins: [
    {
      name: 'tip-input',
      priority: 400,
      build: (_context, schema) => {
        const tip = schema.nodes['tip'];
        return tip ? [inputRules({ rules: [wrappingInputRule(/^!!\s$/, tip)] })] : [];
      },
    },
    {
      name: 'tip-marker',
      priority: 900,
      build: () => [new Plugin({ props: { attributes: { 'data-lab-extended': 'tip' } } })],
    },
  ],
};

const tipSchema = createRichTextSchema({ extensions: [tipExtension] });

const tipDocument: RichTextDocument = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Pick pears that give a little.' }] },
    {
      type: 'tip',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ripen them in a bag.' }] }],
    },
  ],
};

/** A schema assembled from the built-in extensions and a caller's tip extension. */
export function ExtensionEditor() {
  const [value, setValue] = useState(tipDocument);
  return (
    <>
      <RichTextEditor
        label="Pear notes"
        data-lab-editor="extension"
        schema={tipSchema}
        value={value}
        onChange={setValue}
      />
      <p>
        HTML:{' '}
        <output data-lab-output="extension-html">
          {serializeRichTextHtml(value, { schema: tipSchema })}
        </output>
      </p>
    </>
  );
}
