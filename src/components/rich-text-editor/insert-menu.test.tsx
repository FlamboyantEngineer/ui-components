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
import { InsertMenu, InsertMenuButton, type InsertMenuItem } from './insert-menu.js';
import type { RichTextDocument } from './rich-text-editor.js';

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

function optionLabels() {
  return within(list() as HTMLElement)
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
    expect(optionLabels()).toEqual([
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
    expect(optionLabels()).toEqual(['Heading 1']);
    await user.keyboard(' /todo');
    expect(optionLabels()).toEqual(['Task list']);
    await user.keyboard(' /thank');
    expect(optionLabels()).toEqual(['Signature line']);
    await user.keyboard('zz');
    expect(list()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-8.1 needs the slash at a block start or after a space', async () => {
    const { user } = renderMenu();
    await user.click(getContent());
    await user.keyboard('a/');
    expect(list()).toBeNull();
    await user.keyboard(' /');
    expect(list()).not.toBeNull();
    await user.keyboard(' ');
    expect(list()).toBeNull();
  });

  it('UIC-RICH-TEXT-EDITOR-8.2 moves through entries with the arrow keys and inserts one in place of the query', async () => {
    const { user, value } = renderMenu();
    const content = getContent();
    await user.click(content);
    await user.keyboard('/head');
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
    await user.click(screen.getByRole('option', { name: /Quote/ }));
    expect(value()?.content).toEqual([
      {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '/q ' }] }],
      },
    ]);
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
    expect(screen.getAllByRole('menuitem')).toHaveLength(11);
    await user.click(screen.getByRole('menuitem', { name: 'Divider' }));
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
});
