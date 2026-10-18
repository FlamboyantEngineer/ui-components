import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
  getContent,
  installEditorDom,
  renderEditor,
  sampleDocument,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import {
  RichTextEditor,
  createRichTextSchema,
  useRichTextController,
  type RichTextController,
  type RichTextDocument,
} from './rich-text-editor.js';

installEditorDom();

const note: RichTextDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pick pears' }] }],
};

/** Exposes the editor's controller to the test. */
function controllerProbe() {
  const seen: { current: RichTextController | null } = { current: null };
  function Probe() {
    seen.current = useRichTextController();
    return null;
  }
  return { seen, Probe };
}

function blockTypes(document: RichTextDocument | undefined) {
  return document?.content?.map((block) => block.type);
}

describe('RichTextEditor', () => {
  it('UIC-RICH-TEXT-EDITOR-1.1 UIC-RICH-TEXT-EDITOR-11.2 is a field whose control is a labelled multi-line document', () => {
    const { container } = render(
      <RichTextEditor
        label="Notes"
        description="Shared with the team."
        defaultValue={sampleDocument}
        id="notes"
        className="caller"
        data-testid="probe"
        toolbar={<span>Tools</span>}
      >
        <span>Chrome</span>
      </RichTextEditor>,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveClass('ui-field', 'ui-rich-text-editor', 'caller');
    expect(root).toHaveAttribute('id', 'notes');
    expect(root).toHaveAttribute('data-testid', 'probe');
    const content = getContent();
    expect(content).toHaveAttribute('aria-multiline', 'true');
    expect(content).toHaveAttribute('id', 'notes-control');
    expect(content).toHaveAccessibleDescription('Shared with the team.');
    expect(content).toHaveClass('ui-rich-text-editor__content');
    expect(content.querySelector('h1')).toHaveTextContent('Harvest notes');
    expect(content.querySelector('strong')).toHaveTextContent('ripe');
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR', {
      slots: ['frame', 'toolbar', 'surface', 'content'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-RICH-TEXT-EDITOR-1.2 keeps the engine inside the component and ships no styles', () => {
    const dir = join(process.cwd(), 'src');
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
      (file) => /\.tsx?$/.test(file) && !file.includes('.test.'),
    );
    const importers = files.filter((file) =>
      /from '(prosemirror-|@handlewithcare)/.test(readFileSync(join(dir, file), 'utf8')),
    );
    expect(importers.length).toBeGreaterThan(0);
    expect(importers.every((file) => file.startsWith(join('components', 'rich-text-editor')))).toBe(
      true,
    );
    expect(getContentOf(renderEditor().container)).toHaveClass('ProseMirror');
  });

  it('UIC-RICH-TEXT-EDITOR-1.3 reports each edit as JSON and starts from an empty paragraph', async () => {
    const { user, value } = renderEditor();
    expect(getContent().querySelectorAll('p')).toHaveLength(1);
    await user.click(getContent());
    await user.keyboard('Plums');
    expect(value()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plums' }] }],
    });
  });

  it('UIC-RICH-TEXT-EDITOR-1.3 throws on a document the schema cannot read', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const bad = { type: 'doc', content: [{ type: 'gallery' }] } as RichTextDocument;
    expect(() => render(<RichTextEditor label="Notes" defaultValue={bad} />)).toThrow(/gallery/);
  });

  it('UIC-RICH-TEXT-EDITOR-1.4 shows the placeholder while the document is empty', async () => {
    const { user, container } = renderEditor({ placeholder: 'Write…' });
    const content = getContent();
    expect(content).toHaveAttribute('aria-placeholder', 'Write…');
    const block = content.querySelector('p');
    expect(block).toHaveClass('ui-rich-text-editor__placeholder');
    expect(block).toHaveAttribute('data-placeholder', 'Write…');
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR', { slots: ['placeholder'] });
    await user.click(content);
    await user.keyboard('x');
    expect(content.querySelector('.ui-rich-text-editor__placeholder')).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-1.5 renders the toolbar above the surface and chrome inside it', () => {
    const { container } = renderEditor({
      toolbar: <button type="button">Tool</button>,
      children: <span data-chrome="">Chrome</span>,
    });
    const toolbar = container.querySelector('.ui-rich-text-editor__toolbar');
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Tool' }));
    const surface = container.querySelector('.ui-rich-text-editor__surface');
    expect(surface).toHaveStyle({ position: 'relative' });
    expect(surface?.lastElementChild).toHaveAttribute('data-chrome');
    const { Probe } = controllerProbe();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(/inside a RichTextEditor/);
  });

  it('UIC-RICH-TEXT-EDITOR-2.3 draws task items with a checkbox that ticks them', async () => {
    const tasks: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
          ],
        },
      ],
    };
    const { user, value, container } = renderEditor({ defaultValue: tasks });
    const item = container.querySelector('.ui-rich-text-editor__task-item');
    const box = screen.getByRole('checkbox', { name: 'Done' });
    expect(box).not.toBeChecked();
    await user.click(box);
    expect(value()?.content?.[0]?.content?.[0]?.attrs).toEqual({ checked: true });
    expect(item).toHaveAttribute('data-checked', 'true');
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR', {
      slots: ['task-item', 'task-checkbox', 'task-content'],
    });
  });

  it('UIC-RICH-TEXT-EDITOR-2.3 keeps task checkboxes read-only in a read-only editor', () => {
    const tasks: RichTextDocument = {
      type: 'doc',
      content: [
        { type: 'taskList', content: [{ type: 'taskItem', content: [{ type: 'paragraph' }] }] },
      ],
    };
    render(<RichTextEditor label="Notes" defaultValue={tasks} isReadOnly />);
    expect(screen.getByRole('checkbox', { name: 'Done' })).toHaveAttribute('aria-readonly', 'true');
  });

  it('UIC-RICH-TEXT-EDITOR-3.1 runs mark and block shortcuts', async () => {
    const { user, value } = renderEditor();
    await user.click(getContent());
    await user.keyboard('{Control>}b{/Control}bold {Control>}b{/Control}');
    await user.keyboard('{Control>}i{/Control}it{Control>}i{/Control}');
    expect(value()?.content?.[0]?.content).toEqual([
      { type: 'text', text: 'bold ', marks: [{ type: 'bold' }] },
      { type: 'text', text: 'it', marks: [{ type: 'italic' }] },
    ]);
    await user.keyboard('{Control>}{Alt>}2{/Alt}{/Control}');
    expect(value()?.content?.[0]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
    await user.keyboard('{Control>}{Alt>}0{/Alt}{/Control}');
    expect(blockTypes(value())).toEqual(['paragraph']);
  });

  it('UIC-RICH-TEXT-EDITOR-3.2 turns Markdown shortcuts into blocks and marks', async () => {
    const { user, value } = renderEditor();
    await user.click(getContent());
    await user.keyboard('# Title{Enter}');
    await user.keyboard('> quoted');
    expect(blockTypes(value())).toEqual(['heading', 'blockquote']);
    await user.keyboard('{Enter}{Enter}1. one{Enter}{Enter}[[x] done');
    expect(blockTypes(value())).toEqual(['heading', 'blockquote', 'orderedList', 'taskList']);
    expect(value()?.content?.[3]?.content?.[0]?.attrs).toEqual({ checked: true });
    await user.keyboard('{Enter}{Enter}a **b** ~~c~~ `d`');
    expect(value()?.content?.[4]?.content).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'c', marks: [{ type: 'strike' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'd', marks: [{ type: 'code' }] },
    ]);
  });

  it('UIC-RICH-TEXT-EDITOR-3.2 undoes a shortcut with Backspace and leaves code alone', async () => {
    const { user, value } = renderEditor();
    await user.click(getContent());
    await user.keyboard('- ');
    expect(blockTypes(value())).toEqual(['bulletList']);
    await user.keyboard('{Backspace}');
    expect(value()?.content?.[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: '- ' }],
    });
    await user.keyboard('{Control>}a{/Control}{Backspace}``` **x**');
    expect(value()?.content?.[0]).toEqual({
      type: 'codeBlock',
      content: [{ type: 'text', text: '**x**' }],
    });
  });

  it('UIC-RICH-TEXT-EDITOR-3.3 splits, nests and lifts list items and inserts hard breaks', async () => {
    const { user, value } = renderEditor();
    await user.click(getContent());
    await user.keyboard('- one{Enter}two{Tab}');
    const list = value()?.content?.[0];
    expect(list?.content).toHaveLength(1);
    expect(list?.content?.[0]?.content?.[1]?.type).toBe('bulletList');
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(value()?.content?.[0]?.content).toHaveLength(2);
    await user.keyboard('{Enter}{Enter}line{Shift>}{Enter}{/Shift}break');
    expect(value()?.content?.[1]?.content).toEqual([
      { type: 'text', text: 'line' },
      { type: 'hardBreak' },
      { type: 'text', text: 'break' },
    ]);
  });

  it('UIC-RICH-TEXT-EDITOR-3.4 undoes and redoes edits', async () => {
    const { user, value } = renderEditor({ defaultValue: note, children: <ViewProbe /> });
    selectRange(11);
    await user.keyboard(' now');
    expect(value()?.content?.[0]?.content?.[0]?.text).toBe('Pick pears now');
    await user.keyboard('{Control>}z{/Control}');
    expect(value()?.content?.[0]?.content?.[0]?.text).toBe('Pick pears');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(value()?.content?.[0]?.content?.[0]?.text).toBe('Pick pears now');
  });

  it('UIC-RICH-TEXT-EDITOR-3.4 leaves the chord to the field undo when its history is empty', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState(note);
      return (
        <>
          <RichTextEditor label="Notes" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(sampleDocument)}>
            Load
          </button>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(getContent().querySelector('h1')).toHaveTextContent('Harvest notes');
    await user.click(getContent());
    await user.keyboard('{Control>}z{/Control}');
    expect(getContent()).toHaveTextContent(/^Pick pears$/);
  });

  it('UIC-RICH-TEXT-EDITOR-4.1 refuses edits while read-only and leaves a disabled editor out of the tab order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender, container } = render(
      <RichTextEditor label="Notes" defaultValue={note} isReadOnly onChange={onChange} />,
    );
    const content = getContent();
    expect(content).toHaveAttribute('contenteditable', 'false');
    expect(content).toHaveAttribute('aria-readonly', 'true');
    expect(content).toHaveAttribute('tabindex', '0');
    expect(content).toHaveAttribute('data-readonly', 'true');
    await user.click(content);
    await user.keyboard('x');
    expect(onChange).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR');
    rerender(<RichTextEditor label="Notes" defaultValue={note} isDisabled />);
    expect(getContent()).toHaveAttribute('aria-disabled', 'true');
    expect(getContent()).not.toHaveAttribute('tabindex');
    expect(getContent()).toHaveAttribute('data-disabled', 'true');
  });

  it('UIC-RICH-TEXT-EDITOR-4.1 marks an invalid field and a required empty one', () => {
    const { rerender } = render(
      <RichTextEditor
        label="Notes"
        defaultValue={note}
        validate={() => ({ severity: 'error', message: 'Too short.' })}
      />,
    );
    expect(getContent()).toHaveAttribute('aria-invalid', 'true');
    expect(getContent()).toHaveAccessibleErrorMessage('Too short.');
    rerender(<RichTextEditor key="required" label="Notes" isRequired />);
    expect(getContent()).toHaveAttribute('aria-required', 'true');
    expect(getContent().closest('.ui-field')).toHaveAttribute('data-validation', 'invalid');
  });

  it('UIC-RICH-TEXT-EDITOR-4.2 replaces the document when the value changes from outside, off the history', async () => {
    const user = userEvent.setup();
    const { seen, Probe } = controllerProbe();
    function Controlled() {
      const [value, setValue] = useState(note);
      return (
        <>
          <RichTextEditor label="Notes" value={value} onChange={setValue}>
            <Probe />
          </RichTextEditor>
          <button type="button" onClick={() => setValue(sampleDocument)}>
            Load
          </button>
        </>
      );
    }
    render(<Controlled />);
    const paragraph = getContent().querySelector('p');
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(getContent().querySelector('h1')).toHaveTextContent('Harvest notes');
    expect(seen.current?.can({ type: 'undo' })).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Load' }));
    expect(getContent().querySelector('h1')).toHaveTextContent('Harvest notes');
    expect(paragraph?.isConnected).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-4.2 commits on blur and restores the committed document', async () => {
    const onCommit = vi.fn();
    const { user, container } = renderEditor({
      defaultValue: note,
      onCommit,
      children: <ViewProbe />,
    });
    selectRange(11);
    await user.keyboard('!');
    act(() => getContent().blur());
    fireEvent.blur(getContent());
    expect(onCommit).toHaveBeenCalledWith(
      expect.objectContaining({ content: [expect.objectContaining({ type: 'paragraph' })] }),
    );
    expect(onCommit.mock.calls.at(-1)?.[0].content[0].content[0].text).toBe('Pick pears!');
    expect(container.querySelector('.ui-field')).not.toHaveAttribute('data-dirty');
  });

  it('UIC-RICH-TEXT-EDITOR-4.2 offers restore while the document differs from the committed one', async () => {
    const { user } = renderEditor({
      defaultValue: note,
      committedValue: note,
      children: <ViewProbe />,
    });
    selectRange(11);
    await user.keyboard('!');
    await user.click(screen.getByRole('button', { name: /Restore/ }));
    expect(getContent()).toHaveTextContent(/^Pick pears$/);
  });

  it('UIC-RICH-TEXT-EDITOR-5.2 UIC-RICH-TEXT-EDITOR-5.3 gives chrome a controller that reflects the selection and runs commands', async () => {
    const { seen, Probe } = controllerProbe();
    const { value } = renderEditor({
      defaultValue: note,
      children: (
        <>
          <ViewProbe />
          <Probe />
        </>
      ),
    });
    const bold = { type: 'toggle-mark', mark: 'bold' } as const;
    expect(seen.current?.isEditable).toBe(true);
    expect(seen.current?.isSelectionEmpty).toBe(true);
    selectRange(1, 5);
    expect(seen.current?.isSelectionEmpty).toBe(false);
    expect(seen.current?.supports(bold)).toBe(true);
    expect(seen.current?.supports({ type: 'toggle-mark', mark: 'shiny' })).toBe(false);
    expect(seen.current?.can(bold)).toBe(true);
    expect(seen.current?.isActive(bold)).toBe(false);
    act(() => void seen.current?.run(bold));
    expect(value()?.content?.[0]?.content?.[0]).toEqual({
      type: 'text',
      text: 'Pick',
      marks: [{ type: 'bold' }],
    });
    expect(seen.current?.isActive(bold)).toBe(true);
    act(() => void seen.current?.run({ type: 'set-link', href: '/pick' }));
    expect(seen.current?.link).toBe('/pick');
    act(() => seen.current?.focus());
    expect(getContent()).toHaveFocus();
  });

  it('UIC-RICH-TEXT-EDITOR-5.2 refuses commands in a read-only editor', () => {
    const { seen, Probe } = controllerProbe();
    render(
      <RichTextEditor label="Notes" defaultValue={note} isReadOnly>
        <Probe />
      </RichTextEditor>,
    );
    const bold = { type: 'toggle-mark', mark: 'bold' } as const;
    expect(seen.current?.isEditable).toBe(false);
    expect(seen.current?.can(bold)).toBe(false);
    expect(seen.current?.run(bold)).toBe(false);
  });

  it('UIC-RICH-TEXT-EDITOR-2.2 edits documents of a caller schema', async () => {
    const schema = createRichTextSchema({
      marks: { highlight: { parseDOM: [{ tag: 'mark' }], toDOM: () => ['mark', 0] } },
    });
    const highlighted: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Bright', marks: [{ type: 'highlight' }] }],
        },
      ],
    };
    const { user, value } = renderEditor({ schema, defaultValue: highlighted });
    expect(getContent().querySelector('mark')).toHaveTextContent('Bright');
    await user.click(getContent());
    await user.keyboard('{Control>}a{/Control}x');
    expect(value()?.content?.[0]?.content?.[0]?.text).toBe('x');
  });

  it('UIC-RICH-TEXT-EDITOR-11.1 names the document by its label in every layout', () => {
    render(<RichTextEditor label="Summary" labelLayout="control-only" defaultValue={note} />);
    expect(screen.getByRole('textbox', { name: 'Summary' })).toHaveAttribute(
      'aria-label',
      'Summary',
    );
  });
});

function getContentOf(container: HTMLElement) {
  return container.querySelector('.ui-rich-text-editor__content');
}
