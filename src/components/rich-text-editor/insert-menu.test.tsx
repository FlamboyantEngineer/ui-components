import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ViewProbe,
  getContent,
  installEditorDom,
  renderEditor,
  selectRange,
} from '../../../test/rich-text-fixtures.js';
import { InsertMenu, InsertMenuButton, type InsertMenuItem } from './insert-menu.js';
import { RichTextEditor, type RichTextDocument } from './rich-text-editor.js';

installEditorDom();

const signature: InsertMenuItem = {
  id: 'signature',
  label: 'Signature line',
  description: 'Inserts a sign-off',
  keywords: ['thanks'],
  command: { type: 'insert-text', text: 'With thanks' },
};

function list() {
  return screen.queryByRole('listbox', { name: 'Insert commands' });
}

async function optionLabels() {
  return within(await screen.findByRole('listbox', { name: 'Insert commands' }))
    .getAllByRole('option')
    .map((option) => option.querySelector('.ui-completion-list__label')?.textContent);
}

function renderMenu(props: { defaultValue?: RichTextDocument; isReadOnly?: boolean } = {}) {
  return renderEditor({
    ...props,
    toolbar: <InsertMenuButton items={[signature]} className="caller" />,
    children: (
      <>
        <ViewProbe />
        <InsertMenu items={[signature]} data-testid="slash" />
      </>
    ),
  });
}

describe('InsertMenu', () => {
  it('UIC-RICH-TEXT-EDITOR-8.1 UIC-RICH-TEXT-EDITOR-11.2 opens on a slash at the caret and filters by label and keyword', async () => {
    const { user, container } = renderMenu();
    expect(list()).toBeNull();
    await user.click(getContent());
    await user.keyboard('/');
    expect(await optionLabels()).toEqual([
      'Text',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Code block',
      'Bulleted list',
      'Numbered list',
      'Task list',
      'Quote',
      'Divider',
      'Signature line',
    ]);
    const popover = document.querySelector('.ui-insert-menu');
    expect(popover).toHaveClass('ui-completion-list');
    expect(popover).toHaveAttribute('data-testid', 'slash');
    expect(container.querySelector('.ui-insert-menu__caret')).toHaveStyle({ position: 'absolute' });
    expectHooksMatchSpec(document.body, 'RICH-TEXT-EDITOR', {
      callerAttributes: ['data-testid'],
    });
    await user.keyboard('title');
    expect(await optionLabels()).toEqual(['Heading 1']);
    await user.keyboard(' /todo');
    expect(await optionLabels()).toEqual(['Task list']);
    await user.keyboard(' /thank');
    expect(await optionLabels()).toEqual(['Signature line']);
    await user.keyboard('zz');
    expect(list()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-8.1 needs the slash at a block start or after a space', async () => {
    const { user } = renderMenu();
    await user.click(getContent());
    await user.keyboard('a/');
    expect(list()).toBeNull();
    await user.keyboard(' /');
    expect(await screen.findByRole('listbox', { name: 'Insert commands' })).toBeInTheDocument();
    await user.keyboard(' ');
    expect(list()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-8.2 moves through entries with the arrow keys and inserts one in place of the query', async () => {
    const { user, value } = renderMenu();
    const content = getContent();
    await user.click(content);
    await user.keyboard('/head');
    await screen.findByRole('listbox', { name: 'Insert commands' });
    expect(content).toHaveAttribute('aria-autocomplete', 'list');
    expect(content).toHaveAttribute('aria-haspopup', 'listbox');
    expect(content).toHaveAttribute('aria-controls', list()?.id);
    const options = within(list() as HTMLElement).getAllByRole('option');
    expect(content).toHaveAttribute('aria-activedescendant', options[0]?.id);
    await user.keyboard('{ArrowDown}');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(list()).toBeNull();
    expect(content).not.toHaveAttribute('aria-controls');
    expect(value()?.content).toEqual([{ type: 'heading', attrs: { level: 3 } }]);
    await user.keyboard('Plums /sig{Tab}');
    expect(value()?.content?.[0]?.content).toEqual([{ type: 'text', text: 'Plums With thanks' }]);
  });

  it('UIC-RICH-TEXT-EDITOR-8.2 closes on Escape until another slash and inserts a pressed entry', async () => {
    const { user, value } = renderMenu();
    await user.click(getContent());
    await user.keyboard('/');
    await user.keyboard('{Escape}');
    expect(list()).toBeNull();
    await user.keyboard('q');
    expect(list()).toBeNull();
    await user.keyboard(' /quo');
    await user.click(await screen.findByRole('option', { name: /Quote/ }));
    expect(value()?.content).toEqual([
      {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '/q ' }] }],
      },
    ]);
  });

  it('UIC-RICH-TEXT-EDITOR-8.2 opens again when a dismissed slash is removed and retyped at the same position', async () => {
    const { user } = renderMenu();
    await user.click(getContent());
    await user.keyboard('/{Escape}');
    expect(list()).toBeNull();
    selectRange(1, 2);
    await user.keyboard('{Backspace}');
    expect(getContent()).toHaveTextContent(/^$/);
    await user.keyboard('/');
    expect(await screen.findByRole('listbox', { name: 'Insert commands' })).toBeInTheDocument();
  });

  it('UIC-RICH-TEXT-EDITOR-8.3 inserts from the insert button and returns focus to the document', async () => {
    const note: RichTextDocument = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Above' }] }],
    };
    const { user, value, container } = renderMenu({ defaultValue: note });
    selectRange(6);
    const button = screen.getByRole('button', { name: 'Insert' });
    expect(button).toHaveClass('ui-insert-menu-button', 'ui-dropdown-menu', 'caller');
    await user.click(button);
    expect(await screen.findAllByRole('menuitem')).toHaveLength(11);
    await user.click(await screen.findByRole('menuitem', { name: 'Divider' }));
    expect(value()?.content?.map((block) => block.type)).toEqual([
      'paragraph',
      'horizontalRule',
      'paragraph',
    ]);
    expectHooksMatchSpec(container, 'RICH-TEXT-EDITOR');
  });

  it('UIC-RICH-TEXT-EDITOR-8.3 disables the insert button in a read-only editor', () => {
    renderMenu({ isReadOnly: true });
    expect(screen.getByRole('button', { name: 'Insert' })).toBeDisabled();
  });

  it.each(['isReadOnly', 'isDisabled'] as const)(
    'UIC-RICH-TEXT-EDITOR-4.1 UIC-RICH-TEXT-EDITOR-8.1 refuses the slash menu while %s, including a menu already open',
    async (lock) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const content = (
        <>
          <ViewProbe />
          <InsertMenu />
        </>
      );
      const { rerender } = render(
        <RichTextEditor label="Notes" onChange={onChange}>
          {content}
        </RichTextEditor>,
      );
      await user.click(getContent());
      await user.keyboard('/head');
      expect(await screen.findByRole('listbox', { name: 'Insert commands' })).toBeInTheDocument();
      rerender(
        <RichTextEditor label="Notes" onChange={onChange} {...{ [lock]: true }}>
          {content}
        </RichTextEditor>,
      );
      onChange.mockClear();
      expect(list()).toBeNull();
      selectRange(6);
      await user.keyboard('{Enter}{Tab}');
      expect(getContent()).toHaveTextContent('/head');
      expect(list()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it('UIC-RICH-TEXT-EDITOR-4.1 UIC-RICH-TEXT-EDITOR-8.3 dismisses an open insert button menu when the editor locks', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RichTextEditor label="Notes" toolbar={<InsertMenuButton />} />);
    await user.click(screen.getByRole('button', { name: 'Insert' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    rerender(<RichTextEditor label="Notes" isReadOnly toolbar={<InsertMenuButton />} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(<RichTextEditor label="Notes" toolbar={<InsertMenuButton />} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
