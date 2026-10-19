import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
  getContent,
  installEditorDom,
  renderEditor,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import { FormatToolbar } from './format-toolbar.js';
import { createRichTextSchema, type RichTextDocument } from './rich-text-editor.js';

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
    expect(row).toHaveClass('ui-format-toolbar', 'ui-toolbar-row', 'caller');
    expect(row).toHaveAttribute('data-testid', 'tools');
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
});
