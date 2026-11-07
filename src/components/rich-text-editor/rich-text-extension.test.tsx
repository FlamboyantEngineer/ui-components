import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NodeViewComponentProps } from '@handlewithcare/react-prosemirror';
import { screen } from '@testing-library/react';
import { Plugin } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { installEditorDom, renderEditor } from '../../../test/rich-text-fixtures.js';
import { getRichTextKit } from './engine-schema.js';
import { createRichTextKit, type RichTextExtension } from './rich-text-extension.js';
import { createRichTextSchema } from './rich-text-schema.js';

installEditorDom();

const top: RichTextExtension = {
  name: 'top',
  nodes: [
    { name: 'doc', spec: { content: 'block+' }, order: 0 },
    { name: 'text', spec: { group: 'inline' }, order: 100 },
  ],
};

function paragraphs(order: number): RichTextExtension {
  return {
    name: 'paragraphs',
    nodes: [
      {
        name: 'paragraph',
        spec: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
        order,
      },
    ],
  };
}

function plugin(name: string, priority: number, when?: (context: string) => boolean) {
  return { name, priority, when, build: () => [new Plugin({})] };
}

describe('createRichTextKit', () => {
  it('UIC-RICH-TEXT-EDITOR-13.1 UIC-RICH-TEXT-EDITOR-13.2 orders types by order and plugins by priority', () => {
    const marks: RichTextExtension<string> = {
      name: 'marks',
      marks: [
        { name: 'strong', spec: {}, order: 20 },
        { name: 'em', spec: {}, order: 10 },
      ],
      plugins: [plugin('late', 900), plugin('early', 100), plugin('tied', 100)],
    };
    const kit = createRichTextKit<string>([marks, paragraphs(50), top]);
    expect(Object.keys(kit.schema.nodes)).toEqual(['doc', 'paragraph', 'text']);
    expect(kit.schema.topNodeType.name).toBe('doc');
    expect(Object.keys(kit.schema.marks)).toEqual(['em', 'strong']);
    expect(kit.pluginOrder).toEqual(['early', 'tied', 'late']);
    expect(kit.buildPlugins('any')).toHaveLength(3);
  });

  it('UIC-RICH-TEXT-EDITOR-13.2 builds plugins for each context and leaves out gated ones', () => {
    const contexts: string[] = [];
    const gated: RichTextExtension<string> = {
      name: 'gated',
      plugins: [
        { name: 'always', priority: 1, build: (context) => (contexts.push(context), []) },
        plugin('editable-only', 2, (context) => context === 'editable'),
      ],
    };
    const kit = createRichTextKit<string>([top, paragraphs(50), gated]);
    expect(kit.buildPlugins('read-only')).toHaveLength(0);
    expect(kit.buildPlugins('editable')).toHaveLength(1);
    expect(contexts).toEqual(['read-only', 'editable']);
  });

  it('UIC-RICH-TEXT-EDITOR-13.2 merges the views of every extension', () => {
    const View = () => null;
    const kit = createRichTextKit([
      top,
      { ...paragraphs(50), nodeViews: { paragraph: View } },
      { name: 'links', markViews: { link: View } },
    ]);
    expect(kit.nodeViews).toEqual({ paragraph: View });
    expect(kit.markViews).toEqual({ link: View });
  });

  it('UIC-RICH-TEXT-EDITOR-13.2 refines every placed type with each extension in turn', () => {
    const ids: RichTextExtension = {
      name: 'ids',
      refineNode: (name, spec) =>
        name === 'text' ? spec : { ...spec, attrs: { ...spec.attrs, id: { default: null } } },
      refineMark: (_name, spec) => ({ ...spec, inclusive: false }),
    };
    const levels: RichTextExtension = {
      name: 'levels',
      refineNode: (name, spec) =>
        name === 'paragraph' ? { ...spec, attrs: { ...spec.attrs, level: { default: 1 } } } : spec,
    };
    const marks: RichTextExtension = {
      name: 'marks',
      marks: [{ name: 'em', spec: {}, order: 0 }],
    };
    const kit = createRichTextKit([top, ids, paragraphs(50), levels, marks]);
    expect(Object.keys(kit.schema.nodes.paragraph?.spec.attrs ?? {})).toEqual(['id', 'level']);
    expect(Object.keys(kit.schema.nodes.doc?.spec.attrs ?? {})).toEqual(['id']);
    expect(kit.schema.nodes.text?.spec.attrs).toBeUndefined();
    expect(kit.schema.marks.em?.spec.inclusive).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-13.3 throws on duplicate names and missing requirements', () => {
    expect(() => createRichTextKit([top, top])).toThrow('The extension "top" is registered twice.');
    expect(() => createRichTextKit([top, { name: 'needs', requires: ['tables'] }])).toThrow(
      'The extension "needs" requires "tables".',
    );
    expect(() =>
      createRichTextKit([top, paragraphs(50), { ...paragraphs(60), name: 'again' }]),
    ).toThrow('The node type "paragraph" is contributed by both "paragraphs" and "again".');
    expect(() =>
      createRichTextKit([
        top,
        paragraphs(50),
        { name: 'one', plugins: [plugin('same', 1)] },
        { name: 'two', plugins: [plugin('same', 2)] },
      ]),
    ).toThrow('The plugin contribution "same" is contributed by both "one" and "two".');
    expect(() =>
      createRichTextKit([
        top,
        { ...paragraphs(50), nodeViews: { paragraph: 1 } },
        { name: 'other', nodeViews: { paragraph: 2 } },
      ]),
    ).toThrow('The node view "paragraph" is contributed by both "paragraphs" and "other".');
  });

  it('UIC-RICH-TEXT-EDITOR-13.6 assembles in a module that reads no DOM', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/rich-text-editor/rich-text-extension.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/'use client'|\bdocument\.|\bwindow\./);
  });
});

describe('createRichTextSchema extensions', () => {
  it("UIC-RICH-TEXT-EDITOR-13.4 assembles the built-in base and editing extensions with the caller's", () => {
    const callout: RichTextExtension = {
      name: 'callout',
      requires: ['base'],
      nodes: [
        {
          name: 'callout',
          spec: { group: 'block', content: 'inline*', toDOM: () => ['aside', 0] },
          order: 15,
        },
      ],
    };
    const schema = createRichTextSchema({ extensions: [callout] });
    const kit = getRichTextKit(schema);
    expect(kit.extensions.map(({ name }) => name)).toEqual(['base', 'editing', 'callout']);
    expect(schema.nodes.slice(0, 3)).toEqual(['doc', 'paragraph', 'callout']);
    expect(kit.pluginOrder).toEqual(['editing']);
    expect(kit.schema.nodes.callout).toBeDefined();
  });
});

describe('RichTextEditor with extensions', () => {
  it('UIC-RICH-TEXT-EDITOR-13.5 renders extension views and runs extension plugins', async () => {
    function CalloutView({ children, nodeProps, ref, ...props }: NodeViewComponentProps) {
      const { contentDOMRef } = nodeProps;
      return (
        <aside {...props} ref={ref} aria-label="Callout">
          <div ref={contentDOMRef}>{children}</div>
        </aside>
      );
    }
    const marker = new Plugin({ props: { attributes: { 'data-extended': 'true' } } });
    const schema = createRichTextSchema({
      extensions: [
        {
          name: 'callout',
          nodes: [
            {
              name: 'callout',
              spec: { group: 'block', content: 'inline*', toDOM: () => ['aside', 0] },
              order: 15,
            },
          ],
          nodeViews: { callout: CalloutView },
          plugins: [{ name: 'marker', priority: 900, build: () => [marker] }],
        },
      ],
    });
    renderEditor({
      schema,
      defaultValue: {
        type: 'doc',
        content: [{ type: 'callout', content: [{ type: 'text', text: 'Mind the step' }] }],
      },
    });
    const callout = await screen.findByLabelText('Callout');
    expect(callout).toHaveTextContent('Mind the step');
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute('data-extended', 'true');
  });
});
