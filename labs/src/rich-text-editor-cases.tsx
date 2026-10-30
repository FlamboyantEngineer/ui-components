import { StarGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  BlockHandle,
  FormatToolbar,
  InsertMenu,
  InsertMenuButton,
  RichTextEditor,
  SelectionToolbar,
  createRichTextSchema,
  serializeRichTextHtml,
  serializeRichTextText,
  useRichTextController,
  type InsertMenuItem,
  type RichTextDocument,
} from '../../src/components/rich-text-editor/index.js';

const text = (value: string, marks?: RichTextDocument['marks']) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const paragraph = (...content: ReturnType<typeof text>[]) => ({ type: 'paragraph', content });

const recipe: RichTextDocument = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [text('Orchard crumble')] },
    paragraph(
      text('A quick dessert for '),
      text('ripe', [{ type: 'bold' }]),
      text(' apples and pears. See the '),
      text('market notes', [{ type: 'link', attrs: { href: 'https://example.com/market' } }]),
      text(' for varieties.'),
    ),
    { type: 'heading', attrs: { level: 2 }, content: [text('Ingredients')] },
    {
      type: 'bulletList',
      content: ['Four apples', 'Two pears', 'Oats and butter'].map((item) => ({
        type: 'listItem',
        content: [paragraph(text(item))],
      })),
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [paragraph(text('Peel the fruit'))],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [paragraph(text('Bake for 30 minutes'))],
        },
      ],
    },
    { type: 'blockquote', content: [paragraph(text('Serve warm.', [{ type: 'italic' }]))] },
  ],
};

export const shortNote: RichTextDocument = {
  type: 'doc',
  content: [paragraph(text('Pick the '), text('pears', [{ type: 'bold' }]), text(' on Friday.'))],
};

const templates: InsertMenuItem[] = [
  {
    id: 'signature',
    label: 'Signature line',
    description: 'Inserts a sign-off',
    keywords: ['sign', 'thanks'],
    command: { type: 'insert-text', text: 'With thanks, the orchard team' },
  },
];

/** The output panels: the document as JSON, HTML and plain text. */
function Outputs({ value }: { value: RichTextDocument }) {
  return (
    <details open>
      <summary>Value</summary>
      <p>
        Text: <output data-lab-output="text">{serializeRichTextText(value)}</output>
      </p>
      <p>
        HTML: <output data-lab-output="html">{serializeRichTextHtml(value)}</output>
      </p>
      <pre data-lab-output="json">{JSON.stringify(value)}</pre>
    </details>
  );
}

/** Every piece of chrome around one editor, with its value shown below. */
export function FullEditor() {
  const [value, setValue] = useState(recipe);
  return (
    <>
      <RichTextEditor
        label="Recipe"
        description="Type / for blocks, select text for the floating toolbar, Alt+Shift+Up or Down to move a block."
        data-lab-editor="full"
        value={value}
        onChange={setValue}
        placeholder="Write the recipe…"
        toolbar={
          <FormatToolbar>
            <InsertMenuButton items={templates} />
          </FormatToolbar>
        }
      >
        <SelectionToolbar />
        <InsertMenu items={templates} />
        <BlockHandle />
      </RichTextEditor>
      <Outputs value={value} />
    </>
  );
}

/** Locks all chrome while retaining the document's slash query and selection. */
export function LockedChromeEditor() {
  const [isReadOnly, setReadOnly] = useState(false);
  const [value, setValue] = useState<RichTextDocument>({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '/head' }] }],
  });
  return (
    <>
      <Button onPress={() => setReadOnly(!isReadOnly)}>
        {isReadOnly ? 'Enable editing' : 'Make read-only'}
      </Button>
      <RichTextEditor
        label="Lockable note"
        value={value}
        onChange={setValue}
        isReadOnly={isReadOnly}
        toolbar={
          <FormatToolbar>
            <InsertMenuButton />
          </FormatToolbar>
        }
        data-lab-editor="lockable"
      >
        <InsertMenu />
        <SelectionToolbar />
        <BlockHandle />
      </RichTextEditor>
    </>
  );
}

const noteSchema = createRichTextSchema({
  nodes: {
    codeBlock: null,
    callout: {
      group: 'block',
      content: 'paragraph+',
      defining: true,
      parseDOM: [{ tag: 'aside' }],
      toDOM: () => ['aside', { 'data-callout': 'true' }, 0],
    },
  },
  marks: {
    highlight: {
      parseDOM: [{ tag: 'mark' }],
      toDOM: () => ['mark', 0],
    },
  },
});

const calloutItem: InsertMenuItem = {
  id: 'callout',
  label: 'Callout',
  description: 'A boxed note',
  keywords: ['note', 'aside'],
  command: { type: 'toggle-wrap', node: 'callout' },
};

/** A caller's own toolbar button, driven by the editor's controller. */
function HighlightButton() {
  const controller = useRichTextController();
  const command = { type: 'toggle-mark', mark: 'highlight' } as const;
  return (
    <Button
      icon={StarGlyph}
      label="Highlight"
      size="sm"
      isSelected={controller.isActive(command)}
      isDisabled={!controller.can(command)}
      preventFocusOnPress
      onPress={() => controller.run(command)}
    />
  );
}

const calloutDocument: RichTextDocument = {
  type: 'doc',
  content: [
    paragraph(text('Bring a '), text('basket', [{ type: 'highlight' }]), text(' to the market.')),
    { type: 'callout', content: [paragraph(text('The stalls open at nine.'))] },
  ],
};

/** A schema with a callout block and a highlight mark, and without code blocks. */
export function CustomSchemaEditor() {
  const [value, setValue] = useState(calloutDocument);
  return (
    <>
      <RichTextEditor
        label="Market note"
        data-lab-editor="custom"
        schema={noteSchema}
        value={value}
        onChange={setValue}
        toolbar={
          <FormatToolbar>
            <HighlightButton />
            <InsertMenuButton items={[calloutItem]} />
          </FormatToolbar>
        }
      >
        <InsertMenu items={[calloutItem]} />
      </RichTextEditor>
      <p>
        HTML:{' '}
        <output data-lab-output="custom-html">
          {serializeRichTextHtml(value, { schema: noteSchema })}
        </output>
      </p>
    </>
  );
}

/** A value the page owns: it can be replaced from outside, and the editor reports each edit. */
export function ControlledEditor() {
  const [value, setValue] = useState(shortNote);
  const [changes, setChanges] = useState(0);
  const [committed, setCommitted] = useState(shortNote);
  return (
    <>
      <RichTextEditor
        label="Reminder"
        labelLayout="label-colon-control"
        data-lab-editor="controlled"
        value={value}
        committedValue={committed}
        onCommit={setCommitted}
        onChange={(next) => {
          setValue(next);
          setChanges((count) => count + 1);
        }}
        toolbar={<FormatToolbar />}
      />
      <Button size="sm" onPress={() => setValue(recipe)}>
        Load the recipe
      </Button>
      <p>
        Changes: <output data-lab-output="changes">{changes}</output>
      </p>
    </>
  );
}
