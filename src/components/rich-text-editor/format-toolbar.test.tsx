import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { FormEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
  getContent,
  installEditorDom,
  renderEditor,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import { Form } from '../form/form.js';
import { FormatToolbar } from './format-toolbar.js';
import { RichTextEditor, createRichTextSchema, type RichTextDocument } from './rich-text-editor.js';

installEditorDom();

const note: RichTextDocument = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pick pears' }] }],
};

function toolbar() {
  return screen.getByRole('toolbar', { name: 'Text formatting' });
}

describe('FormatToolbar', () => {
  it('UIC-RICH-TEXT-EDITOR-6.1 UIC-RICH-TEXT-EDITOR-11.2 lists the history, block, mark, link and list commands', () => {
    const { container } = renderEditor({
      defaultValue: note,
      toolbar: (
        <FormatToolbar className="caller" data-testid="tools">
          <button type="button">Extra</button>
        </FormatToolbar>
      ),
    });
    const row = toolbar();
    expect(row.parentElement).toHaveClass('ui-format-toolbar', 'ui-toolbar-row', 'caller');
    expect(row.parentElement).toHaveAttribute('data-testid', 'tools');
    const names = within(row)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual([
      'Undo',
      'Redo',
      'Block type',
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Code',
      'Link',
      'Bulleted list',
      'Numbered list',
      'Task list',
      'Quote',
      'Extra',
    ]);
    expect(within(row).getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(within(row).getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+B',
    );
    expect(within(row).getAllByRole('separator')).toHaveLength(3);
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR', { callerAttributes: ['data-testid'] });
  });

  it('UIC-RICH-TEXT-EDITOR-6.1 reflects the selection and runs commands, keeping focus in the document', async () => {
    const { user, value } = renderEditor({
      defaultValue: note,
      toolbar: <FormatToolbar />,
      children: <ViewProbe />,
    });
    selectRange(6, 11);
    const bold = within(toolbar()).getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    await user.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(value()?.content?.[0]?.content?.[1]).toEqual({
      type: 'text',
      text: 'pears',
      marks: [{ type: 'bold' }],
    });
    expect(getContent()).toHaveFocus();
    await user.click(within(toolbar()).getByRole('button', { name: 'Bulleted list' }));
    expect(value()?.content?.[0]?.type).toBe('bulletList');
    expect(within(toolbar()).getByRole('button', { name: 'Bulleted list' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(toolbar()).getByRole('button', { name: 'Undo' }));
    expect(value()?.content?.[0]?.type).toBe('paragraph');
  });

  it('UIC-RICH-TEXT-EDITOR-6.1 leaves out what the schema lacks and takes a name', () => {
    const schema = createRichTextSchema({
      nodes: { taskList: null, taskItem: null, blockquote: null },
      marks: { underline: null, link: null },
    });
    renderEditor({ schema, toolbar: <FormatToolbar aria-label="Note tools" /> });
    const row = screen.getByRole('toolbar', { name: 'Note tools' });
    expect(within(row).queryByRole('button', { name: 'Underline' })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Link' })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Task list' })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Quote' })).not.toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('UIC-RICH-TEXT-EDITOR-6.1 disables its commands in a read-only editor', () => {
    renderEditor({ defaultValue: note, isReadOnly: true, toolbar: <FormatToolbar /> });
    expect(within(toolbar()).getByRole('button', { name: 'Bold' })).toBeDisabled();
    expect(within(toolbar()).getByRole('button', { name: 'Link' })).toBeDisabled();
  });

  it('UIC-RICH-TEXT-EDITOR-6.2 shows and changes the block type', async () => {
    const { user, value, container } = renderEditor({
      defaultValue: note,
      toolbar: <FormatToolbar />,
      children: <ViewProbe />,
    });
    selectRange(2);
    const select = container.querySelector('.ui-format-toolbar__block-type');
    expect(select).toHaveClass('ui-select-field');
    const trigger = within(toolbar()).getByRole('button', { name: /Block type/ });
    expect(trigger).toHaveTextContent('Text');
    await user.click(trigger);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Text',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Code block',
    ]);
    await user.click(screen.getByRole('option', { name: 'Heading 3' }));
    expect(value()?.content?.[0]).toMatchObject({ type: 'heading', attrs: { level: 3 } });
    expect(trigger).toHaveTextContent('Heading 3');
  });

  it('UIC-RICH-TEXT-EDITOR-6.3 links the selection from the link editor and removes the link', async () => {
    const { user, value, container } = renderEditor({
      defaultValue: note,
      toolbar: <FormatToolbar />,
      children: <ViewProbe />,
    });
    selectRange(6, 11);
    const link = within(toolbar()).getByRole('button', { name: 'Link' });
    await user.click(link);
    const editorPanel = document.querySelector('.ui-format-toolbar__link-editor');
    expect(editorPanel).toHaveClass('ui-popover');
    const address = screen.getByRole('textbox', { name: 'Link address' });
    expect(address).toHaveFocus();
    const apply = screen.getByRole('button', { name: 'Apply' });
    expect(apply).toBeDisabled();
    await user.type(address, 'javascript:alert(1)');
    expect(apply).toBeDisabled();
    await user.clear(address);
    await user.type(address, 'https://example.com/pears{Enter}');
    expect(value()?.content?.[0]?.content?.[1]?.marks).toEqual([
      { type: 'link', attrs: { href: 'https://example.com/pears', title: null } },
    ]);
    expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
    expect(link).toHaveAttribute('aria-pressed', 'true');
    await user.click(link);
    expect(screen.getByRole('textbox', { name: 'Link address' })).toHaveValue(
      'https://example.com/pears',
    );
    await user.click(screen.getByRole('button', { name: 'Remove link' }));
    expect(value()?.content?.[0]?.content).toEqual([{ type: 'text', text: 'Pick pears' }]);
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR');
  });

  it.each([
    ['an ordinary form', 'plain'],
    ['the library Form', 'library'],
  ] as const)(
    'UIC-RICH-TEXT-EDITOR-6.3 applies, removes and cancels a link without submitting %s around the editor',
    async (_name, kind) => {
      const user = userEvent.setup();
      const submitted: unknown[] = [];
      const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitted.push(new FormData(event.currentTarget).get('notes'));
      });
      const editor = (
        <>
          <RichTextEditor
            label="Notes"
            name="notes"
            defaultValue={note}
            toolbar={<FormatToolbar />}
          >
            <ViewProbe />
          </RichTextEditor>
          <button type="submit">Save</button>
        </>
      );
      const wrap = (children: ReactNode) =>
        kind === 'plain' ? (
          <form aria-label="Page" onSubmit={onSubmit}>
            {children}
          </form>
        ) : (
          <Form aria-label="Page" onSubmit={onSubmit}>
            {children}
          </Form>
        );
      render(wrap(editor));
      selectRange(6, 11);
      const link = within(toolbar()).getByRole('button', { name: 'Link' });
      await user.click(link);
      await user.type(
        screen.getByRole('textbox', { name: 'Link address' }),
        'https://example.com/a{Enter}',
      );
      await user.click(link);
      await user.clear(screen.getByRole('textbox', { name: 'Link address' }));
      await user.type(
        screen.getByRole('textbox', { name: 'Link address' }),
        'https://example.com/b',
      );
      await user.click(screen.getByRole('button', { name: 'Apply' }));
      await user.click(link);
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(String(submitted[0])).toContain('https://example.com/b');
      selectRange(6, 11);
      await user.click(link);
      await user.click(screen.getByRole('button', { name: 'Remove link' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['isReadOnly', 'isDisabled'] as const)(
    'UIC-RICH-TEXT-EDITOR-4.1 UIC-RICH-TEXT-EDITOR-6.3 closes the link editor on %s and does not reopen it when unlocked',
    async (lock) => {
      const user = userEvent.setup();
      const { rerender } = render(
        <RichTextEditor label="Notes" defaultValue={note} toolbar={<FormatToolbar />} />,
      );
      await user.click(within(toolbar()).getByRole('button', { name: 'Link' }));
      expect(screen.getByRole('textbox', { name: 'Link address' })).toBeInTheDocument();
      rerender(
        <RichTextEditor
          label="Notes"
          defaultValue={note}
          toolbar={<FormatToolbar />}
          {...{ [lock]: true }}
        />,
      );
      expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
      rerender(<RichTextEditor label="Notes" defaultValue={note} toolbar={<FormatToolbar />} />);
      expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
    },
  );
});
