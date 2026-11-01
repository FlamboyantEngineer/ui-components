import { StarGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form } from '../../src/components/form/form.js';
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

/**
 * The short note with a task list and a link, so the read-only and disabled states show their
 * checkboxes and links.
 */
export const taskNote: RichTextDocument = {
  type: 'doc',
  content: [
    ...(shortNote.content ?? []),
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            paragraph(
              text('Wash', [
                { type: 'link', attrs: { href: 'https://example.com/wash', title: null } },
              ]),
            ),
          ],
        },
        { type: 'taskItem', attrs: { checked: false }, content: [paragraph(text('Peel'))] },
      ],
    },
  ],
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
        description="Type / for blocks, select text for the floating toolbar, drag a block by its grip (a line marks where it lands) or press Alt+Shift+Up or Down to move it."
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

/**
 * An editor whose host moves and narrows from buttons that leave focus in the document, so the
 * floating toolbar has to follow its selection without an edit.
 */
export function ShiftingEditor() {
  const [isLowered, setLowered] = useState(false);
  const [isNarrow, setNarrow] = useState(false);
  return (
    <>
      <Button size="sm" preventFocusOnPress onPress={() => setLowered(!isLowered)}>
        {isLowered ? 'Raise' : 'Lower'}
      </Button>{' '}
      <Button size="sm" preventFocusOnPress onPress={() => setNarrow(!isNarrow)}>
        {isNarrow ? 'Widen' : 'Narrow'}
      </Button>
      <div style={{ paddingTop: isLowered ? 150 : 0, maxWidth: isNarrow ? 300 : 600 }}>
        <RichTextEditor
          label="Moving note"
          data-lab-editor="shifting"
          defaultValue={{
            type: 'doc',
            content: [
              paragraph(
                text(
                  'Select the last word, then lower or narrow the editor: the toolbar follows it.',
                ),
              ),
            ],
          }}
        >
          <SelectionToolbar aria-label="Moving note formatting" />
        </RichTextEditor>
      </div>
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

/** Three short steps to move around. */
const recipeSteps: RichTextDocument = {
  type: 'doc',
  content: [
    paragraph(text('Wash the plums.')),
    paragraph(text('Halve them and take out the stones.')),
    paragraph(text('Bake for 20 minutes.')),
  ],
};

const handleChoices = [
  { name: 'grip-menu', label: 'Grip and menu', grip: true, menu: true },
  { name: 'grip', label: 'Grip only', grip: true, menu: false },
  { name: 'menu', label: 'Menu only', grip: false, menu: true },
] as const;

/** The block handle's controls side by side, and an editor that leaves the handle out. */
export function BlockHandleChoices() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {handleChoices.map(({ name, label, grip, menu }) => (
        <RichTextEditor
          key={name}
          label={label}
          defaultValue={recipeSteps}
          data-lab-editor={`handle-${name}`}
        >
          <BlockHandle grip={grip} menu={menu} />
        </RichTextEditor>
      ))}
      <RichTextEditor
        label="No block handle"
        description="Alt+Shift+Up and Down still move a block."
        defaultValue={recipeSteps}
        data-lab-editor="handle-none"
      />
    </div>
  );
}

const noteSchema = createRichTextSchema({
  nodes: {
    doc: { content: 'block+', attrs: { edition: { default: 1 } } },
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
  attrs: { edition: 1 },
  content: [
    paragraph(text('Bring a '), text('basket', [{ type: 'highlight' }]), text(' to the market.')),
    { type: 'callout', content: [paragraph(text('The stalls open at nine.'))] },
  ],
};

/**
 * A schema with a callout block, a highlight mark and an `edition` on the document, and without
 * code blocks. Next edition replaces the document with the next edition number, which later edits
 * keep.
 */
export function CustomSchemaEditor() {
  const [value, setValue] = useState(calloutDocument);
  const edition = Number(value.attrs?.edition ?? 1);
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
      <Button size="sm" onPress={() => setValue({ ...value, attrs: { edition: edition + 1 } })}>
        Next edition
      </Button>
      <p>
        Edition: <output data-lab-output="custom-edition">{edition}</output>
      </p>
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

/**
 * A named editor in a form: Submit shows the JSON the form sends and counts the submits, Reset
 * puts the note back. Applying a link from the toolbar submits nothing.
 */
export function FormEditor() {
  const [submitted, setSubmitted] = useState('none');
  const [submits, setSubmits] = useState(0);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('notes')));
        setSubmits((count) => count + 1);
      }}
    >
      <RichTextEditor
        label="Notes"
        name="notes"
        defaultValue={shortNote}
        data-lab-editor="form"
        toolbar={<FormatToolbar />}
      />
      <button type="submit">Submit</button> <button type="reset">Reset</button>
      <p>
        Submitted: <output data-lab-output="form">{submitted}</output>
      </p>
      <p>
        Submits: <output data-lab-output="form-submits">{submits}</output>
      </p>
    </form>
  );
}

/**
 * A required editor in a form that validates at once: blank lines, empty lists and quotes leave it
 * empty and the submit blocked; any text, or a divider, fills it.
 */
export function RequiredEditor() {
  const [submits, setSubmits] = useState(0);
  return (
    <Form
      aria-label="Required note"
      validationMode="immediate"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
    >
      <RichTextEditor
        label="Summary"
        isRequired
        data-lab-editor="required"
        toolbar={<FormatToolbar />}
      />
      <button type="submit">Send</button>
      <p>
        Sent: <output data-lab-output="required-submits">{submits}</output>
      </p>
    </Form>
  );
}

const longLine =
  'Rows of plums, figs and quinces ripen in turn along the orchard wall, one week apart. ';
/** A thousand paragraphs of about 200 characters each. */
const longDocument: RichTextDocument = {
  type: 'doc',
  content: Array.from({ length: 1000 }, (_, index) =>
    paragraph(text(`${index + 1}. ${longLine.repeat(3).slice(0, 195)}`)),
  ),
};

/** How many top-level blocks of `next` are the very objects of `previous`. */
function countKeptBlocks(previous: RichTextDocument, next: RichTextDocument): number {
  const before = new Set(previous.content);
  return (next.content ?? []).filter((block) => before.has(block)).length;
}

/** A long document whose changes report how many blocks they kept from the previous value. */
export function LongDocumentEditor() {
  const [value, setValue] = useState(longDocument);
  const [kept, setKept] = useState<string>('none yet');
  return (
    <>
      <RichTextEditor
        label="Orchard log"
        data-lab-editor="long"
        value={value}
        onChange={(next) => {
          setKept(`${countKeptBlocks(value, next)} of ${next.content?.length ?? 0}`);
          setValue(next);
        }}
      />
      <p>
        Blocks kept by the last change: <output data-lab-output="kept">{kept}</output>
      </p>
    </>
  );
}
