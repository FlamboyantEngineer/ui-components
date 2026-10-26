import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { applyTreeMove } from '../../utils/tree-reorder.js';
import { FolderManager, type FolderItem, type FolderManagerProps } from './folder-manager.js';
import type { FolderSelectionMode } from './use-folder-tree.js';

interface Folder extends FolderItem {
  children?: Folder[];
}

const sample: Folder[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [
      { id: 'citrus', name: 'Citrus' },
      { id: 'berries', name: 'Berries' },
    ],
  },
  { id: 'vegetables', name: 'Vegetables' },
];

function mapFolders(
  folders: readonly Folder[],
  change: (folder: Folder) => Folder | null,
): Folder[] {
  return folders.flatMap((folder) => {
    const next = change(folder);
    if (!next) return [];
    return [{ ...next, ...(next.children ? { children: mapFolders(next.children, change) } : {}) }];
  });
}

function insertFolder(folders: readonly Folder[], parentKey: Key | null, folder: Folder): Folder[] {
  if (parentKey === null) return [...folders, folder];
  return mapFolders(folders, (entry) =>
    entry.id === parentKey ? { ...entry, children: [...(entry.children ?? []), folder] } : entry,
  );
}

type ManagerProps<M extends FolderSelectionMode> = Partial<FolderManagerProps<Folder, M>> & {
  /** Every callback is applied to the folders unless a test replaces it. */
  editable?: boolean;
};

/** A manager whose callbacks apply each change to its own folders. */
function Manager<M extends FolderSelectionMode = 'single'>({
  editable = true,
  ...props
}: ManagerProps<M>) {
  const [folders, setFolders] = useState<readonly Folder[]>(sample);
  const callbacks: Partial<FolderManagerProps<Folder, M>> = editable
    ? {
        onCreate: ({ name, parentKey }) => {
          const id = name.toLowerCase();
          setFolders((current) => insertFolder(current, parentKey, { id, name }));
          return id;
        },
        onRename: ({ key, name }) =>
          setFolders((current) =>
            mapFolders(current, (folder) => (folder.id === key ? { ...folder, name } : folder)),
          ),
        onDelete: (key) =>
          setFolders((current) =>
            mapFolders(current, (folder) => (folder.id === key ? null : folder)),
          ),
        onMove: (move) => setFolders((current) => applyTreeMove(current, move)),
      }
    : {};
  return (
    <FolderManager<Folder, M> aria-label="Folders" folders={folders} {...callbacks} {...props} />
  );
}

function row(name: string) {
  return screen.getByRole('row', { name });
}

function rowNames() {
  return screen.getAllByRole('row').map((element) => element.getAttribute('aria-label'));
}

describe('FolderManager', () => {
  it('UIC-FOLDER-MANAGER-1.1 shows the folders as an expanded tree of folder rows', async () => {
    const user = userEvent.setup();
    const { container } = render(<Manager editable={false} />);
    expect(screen.getByRole('treegrid', { name: 'Folders' })).toHaveClass('ui-tree');
    expect(rowNames()).toEqual(['Fruit', 'Citrus', 'Berries', 'Vegetables']);
    expect(row('Fruit')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Citrus')).toHaveAttribute('aria-level', '2');
    expect(row('Citrus').querySelector('[data-glyph="folder"]')).not.toBeNull();
    await user.click(within(row('Fruit')).getByRole('button', { name: 'Collapse Fruit' }));
    expect(rowNames()).toEqual(['Fruit', 'Vegetables']);
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['tree'] });
  });

  it('UIC-FOLDER-MANAGER-1.2 adds a root row that stands for no folder', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Manager
        rootLabel="All folders"
        defaultSelectedKey="citrus"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(rowNames()).toEqual(['All folders', 'Fruit', 'Citrus', 'Berries', 'Vegetables']);
    expect(row('Fruit')).toHaveAttribute('aria-level', '2');
    await user.click(row('All folders'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    expect(row('All folders')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    await user.keyboard('{F2}{Delete}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(rowNames()).toHaveLength(5);
  });

  it('UIC-FOLDER-MANAGER-1.3 selects one folder, controlled or not', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(<Manager onSelectionChange={onSelectionChange} />);
    await user.click(row('Citrus'));
    expect(row('Citrus')).toHaveAttribute('aria-selected', 'true');
    expect(onSelectionChange).toHaveBeenLastCalledWith('citrus');
    await user.keyboard('{ArrowDown}');
    expect(row('Berries')).toHaveAttribute('aria-selected', 'true');
    rerender(<Manager selectedKey="vegetables" onSelectionChange={onSelectionChange} />);
    expect(row('Vegetables')).toHaveAttribute('aria-selected', 'true');
    await user.click(row('Fruit'));
    expect(onSelectionChange).toHaveBeenLastCalledWith('fruit');
    expect(row('Vegetables')).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-FOLDER-MANAGER-1.4 shows a loading row and holds the actions while pending', () => {
    const { container } = render(
      <FolderManager aria-label="Folders" folders={[]} isPending onCreate={() => {}} />,
    );
    expect(screen.getByRole('treegrid')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(container.querySelector('.ui-folder-manager')).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled();
    expectHooksMatchSpec(container, 'FOLDER-MANAGER');
  });

  it('UIC-FOLDER-MANAGER-2.1 offers only the actions whose callbacks are set', () => {
    const { container, rerender } = render(
      <FolderManager aria-label="Folders" folders={sample} onCreate={() => {}} />,
    );
    const toolbar = container.querySelector('.ui-folder-manager__toolbar');
    expect(
      within(toolbar as HTMLElement)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['New folder']);
    rerender(<Manager />);
    const buttons = screen.getAllByRole('button', { name: /^(New folder|Rename|Delete)$/ });
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'New folder',
      'Rename',
      'Delete',
    ]);
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'New folder' }).querySelector('[data-glyph="plus"]'),
    ).not.toBeNull();
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['toolbar'] });
    rerender(<FolderManager aria-label="Folders" folders={sample} />);
    expect(container.querySelector('.ui-folder-manager__toolbar')).toBeNull();
  });

  it('UIC-FOLDER-MANAGER-2.2 creates a folder from a focused draft row and selects it', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(<Manager onSelectionChange={onSelectionChange} />);
    await user.click(row('Fruit'));
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    const input = screen.getByRole('textbox', { name: 'New folder name' });
    expect(input).toHaveClass('ui-folder-manager__name-input');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    expect(input.closest('[role="row"]')).toHaveAttribute('aria-level', '2');
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['name-input'] });
    await user.keyboard('  Melons {Enter}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(rowNames()).toEqual(['Fruit', 'Citrus', 'Berries', 'Melons', 'Vegetables']);
    expect(onSelectionChange).toHaveBeenLastCalledWith('melons');
    await waitFor(() => expect(row('Melons')).toHaveFocus());
    expect(row('Melons')).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-FOLDER-MANAGER-2.2 abandons a blank or escaped draft and submits on leaving the field', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<FolderManager aria-label="Folders" folders={sample} onCreate={onCreate} />);
    const newFolder = screen.getByRole('button', { name: 'New folder' });
    await user.click(newFolder);
    await user.keyboard('Plums{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(newFolder);
    await user.keyboard('   {Enter}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(newFolder);
    expect(screen.getByRole('textbox').closest('[role="row"]')).toHaveAttribute('aria-level', '1');
    await user.keyboard('Plums');
    await user.click(newFolder.parentElement?.parentElement as HTMLElement);
    expect(onCreate).toHaveBeenCalledWith({ name: 'Plums', parentKey: null });
  });

  it('UIC-FOLDER-MANAGER-2.3 renames a folder in place with F2 and returns focus to its row', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<Manager onRename={onRename} />);
    await user.click(row('Citrus'));
    await user.keyboard('{F2}');
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Rename Citrus' });
    expect(input).toHaveValue('Citrus');
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);
    await user.keyboard('Citrus{Enter}');
    expect(onRename).not.toHaveBeenCalled();
    await waitFor(() => expect(row('Citrus')).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.keyboard('Lemons{Enter}');
    expect(onRename).toHaveBeenCalledWith({ key: 'citrus', name: 'Lemons' });
    await waitFor(() => expect(row('Citrus')).toHaveFocus());
  });

  it('UIC-FOLDER-MANAGER-2.4 keeps every key typed in the name field out of the tree', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Manager onSelectionChange={onSelectionChange} defaultSelectedKey="citrus" />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByRole<HTMLInputElement>('textbox');
    onSelectionChange.mockClear();
    await user.keyboard('{End}{ArrowLeft}{ArrowLeft}{Home} b{ArrowDown}{ArrowUp}');
    expect(input).toHaveFocus();
    expect(input).toHaveValue(' bCitrus');
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.keyboard('{Delete}{F2}');
    expect(input).toHaveValue(' bitrus');
    expect(screen.getByRole('textbox')).toBe(input);
    expect(rowNames()).toHaveLength(4);
  });

  it('UIC-FOLDER-MANAGER-2.5 ignores submits while pending and keeps a refused name for a retry', async () => {
    const user = userEvent.setup();
    const attempts: Array<{ resolve: (key: Key) => void; reject: (error: Error) => void }> = [];
    const onCreate = vi.fn(
      () =>
        new Promise<Key>((resolve, reject) => {
          attempts.push({ resolve, reject });
        }),
    );
    const { container } = render(
      <FolderManager aria-label="Folders" folders={sample} onCreate={onCreate} />,
    );
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    await user.keyboard('Pears{Enter}{Enter}');
    expect(onCreate).toHaveBeenCalledTimes(1);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-folder-manager')).toHaveAttribute('data-pending', 'true');
    await act(async () => attempts[0]?.reject(new Error('That name is taken.')));
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('That name is taken.');
    expect(message).toHaveClass('ui-folder-manager__message', 'ui-inline-error');
    expect(input).toHaveValue('Pears');
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('That name is taken.');
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['message'] });
    await user.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledTimes(2);
    expect(onCreate).toHaveBeenLastCalledWith({ name: 'Pears', parentKey: null });
    await act(async () => attempts[1]?.reject(new Error('')));
    expect(screen.getByRole('alert')).toHaveTextContent('The action could not be completed.');
    await user.keyboard('{Enter}');
    await act(async () => attempts[2]?.resolve('pears'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UIC-FOLDER-MANAGER-2.6 deletes the selected folder and falls back to its parent', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Manager onSelectionChange={onSelectionChange} />);
    await user.click(row('Citrus'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(rowNames()).toEqual(['Fruit', 'Berries', 'Vegetables']);
    expect(onSelectionChange).toHaveBeenLastCalledWith('fruit');
    await waitFor(() => expect(row('Fruit')).toHaveFocus());
    await user.click(row('Vegetables'));
    await user.keyboard('{Delete}');
    expect(rowNames()).toEqual(['Fruit', 'Berries']);
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
  });

  it('UIC-FOLDER-MANAGER-2.6 refuses a blocked folder with its reason', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <Manager
        onDelete={onDelete}
        getDeleteBlockedReason={(folder) => (folder.children ? 'Empty the folder first.' : null)}
        defaultSelectedKey="fruit"
      />,
    );
    const remove = screen.getByRole('button', { name: 'Delete' });
    expect(remove).toHaveAttribute('aria-disabled', 'true');
    await user.tab();
    await user.tab();
    await user.tab();
    expect(remove).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Empty the folder first.');
    await user.click(remove);
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(row('Fruit'));
    await user.keyboard('{Delete}');
    expect(screen.getByRole('alert')).toHaveTextContent('Empty the folder first.');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('UIC-FOLDER-MANAGER-2.6 shows the message of a refused delete', async () => {
    const user = userEvent.setup();
    render(
      <FolderManager
        aria-label="Folders"
        folders={sample}
        defaultSelectedKey="vegetables"
        onDelete={() => Promise.reject(new Error('The folder is in use.'))}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The folder is in use.');
    expect(row('Vegetables')).toBeInTheDocument();
  });

  it('UIC-FOLDER-MANAGER-2.7 holds new folders and moves at the depth limit', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { rerender } = render(
      <Manager maxDepth={2} defaultSelectedKey="citrus" onMove={onMove} />,
    );
    const newFolder = screen.getByRole('button', { name: 'New folder' });
    expect(newFolder).toHaveAttribute('aria-disabled', 'true');
    await user.tab();
    expect(newFolder).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Folders nest at most 2 levels deep.');
    await user.click(row('Vegetables'));
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onMove).toHaveBeenCalledWith({
      key: 'vegetables',
      targetKey: 'fruit',
      position: 'inside',
    });
    rerender(<Manager maxDepth={1} onMove={onMove} />);
    onMove.mockClear();
    await user.click(row('Vegetables'));
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-FOLDER-MANAGER-2.8 opens Rename and Delete in a context menu on the row under the pointer', async () => {
    const user = userEvent.setup();
    render(
      <Manager
        rootLabel="All folders"
        getDeleteBlockedReason={(folder) => (folder.children ? 'Empty the folder first.' : null)}
      />,
    );
    fireEvent.contextMenu(row('Citrus'));
    expect(screen.getByRole('row', { name: 'Citrus', hidden: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Rename', 'Delete']);
    await user.click(within(menu).getByRole('menuitem', { name: 'Rename' }));
    expect(screen.getByRole('textbox', { name: 'Rename Citrus' })).toHaveFocus();
    await user.keyboard('{Escape}');
    fireEvent.contextMenu(row('Fruit'));
    const blocked = within(await screen.findByRole('menu')).getByRole('menuitem', {
      name: /Delete/,
    });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveTextContent('Empty the folder first.');
    await user.keyboard('{Escape}');
    fireEvent.contextMenu(row('All folders'));
    const rootMenu = await screen.findByRole('menu');
    for (const item of within(rootMenu).getAllByRole('menuitem')) {
      expect(item).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('UIC-FOLDER-MANAGER-2.8 leaves the browser menu alone without rename and delete', () => {
    render(<FolderManager aria-label="Folders" folders={sample} onCreate={() => {}} />);
    const event = fireEvent.contextMenu(row('Citrus'));
    expect(event).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-FOLDER-MANAGER-3.1 reports moves for the owner to apply and keeps the root in place', async () => {
    const user = userEvent.setup();
    render(<Manager rootLabel="All folders" />);
    expect(row('All folders')).not.toHaveAttribute('draggable');
    expect(row('Citrus')).toHaveAttribute('draggable', 'true');
    await user.click(row('Citrus'));
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(rowNames()).toEqual(['All folders', 'Fruit', 'Berries', 'Citrus', 'Vegetables']);
    expect(row('Citrus')).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(row('Citrus')).toHaveAttribute('aria-level', '2');
    expect(rowNames()).toEqual(['All folders', 'Fruit', 'Berries', 'Citrus', 'Vegetables']);
    await user.click(row('Fruit'));
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(row('Fruit')).toHaveAttribute('aria-level', '2');
    expect(rowNames()[0]).toBe('All folders');
  });

  it('UIC-FOLDER-MANAGER-3.1 moves nothing while a folder is being named', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Manager onMove={onMove} defaultSelectedKey="vegetables" />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    expect(row('Citrus')).not.toHaveAttribute('draggable');
    act(() => row('Citrus').focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-FOLDER-MANAGER-4.1 appends the caller class and forwards the id and data attributes', () => {
    const { container } = render(<Manager className="caller" id="folders" data-testid="probe" />);
    const root = container.querySelector('.ui-folder-manager');
    expect(root).toHaveClass('ui-folder-manager', 'caller');
    expect(root).toHaveAttribute('id', 'folders');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { callerAttributes: ['data-testid'] });
  });

  it('UIC-FOLDER-MANAGER-5.1 loads subfolders when a folder that has some is expanded', async () => {
    // The loading row watches its visibility; the test DOM has no observer of its own.
    vi.stubGlobal('IntersectionObserver', function createObserver() {
      return { observe() {}, disconnect() {} };
    });
    const user = userEvent.setup();
    const answers: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
    function Lazy() {
      const [folders, setFolders] = useState<readonly Folder[]>([
        { id: 'pantry', name: 'Pantry', hasChildren: true },
        { id: 'cellar', name: 'Cellar' },
      ]);
      const onLoadChildren = vi.fn(
        (key: Key) =>
          new Promise<void>((resolve, reject) => {
            answers.push({
              resolve: () => {
                setFolders((current) =>
                  mapFolders(current, (folder) =>
                    folder.id === key
                      ? { ...folder, children: [{ id: 'jars', name: 'Jars' }] }
                      : folder,
                  ),
                );
                resolve();
              },
              reject,
            });
          }),
      );
      return (
        <FolderManager aria-label="Folders" folders={folders} onLoadChildren={onLoadChildren} />
      );
    }
    const { container } = render(<Lazy />);
    expect(row('Pantry')).toHaveAttribute('aria-expanded', 'false');
    await user.click(within(row('Pantry')).getByRole('button', { name: 'Expand Pantry' }));
    expect(answers).toHaveLength(1);
    expect(container.querySelector('.ui-tree__loader')).not.toBeNull();
    await act(async () => answers[0]?.reject(new Error('The pantry is locked.')));
    const error = within(row('Pantry')).getByRole('alert');
    expect(error).toHaveClass('ui-folder-manager__load-error', 'ui-inline-error');
    expect(error).toHaveTextContent('The pantry is locked.');
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['load-error'] });
    await user.click(within(error).getByRole('button', { name: 'Retry' }));
    expect(answers).toHaveLength(2);
    await act(async () => answers[1]?.resolve());
    expect(rowNames()).toEqual(['Pantry', 'Jars', 'Cellar']);
    expect(row('Pantry')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('UIC-FOLDER-MANAGER-6.1 selects several folders and offers only what applies to them', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(keys: Set<Key>) => void>();
    render(
      <Manager
        selectionMode="multiple"
        defaultSelectedKeys={['citrus']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(row('Citrus')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Control>}');
    await user.click(row('Vegetables'));
    await user.keyboard('{/Control}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['citrus', 'vegetables']));
    expect(row('Vegetables')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    await user.click(row('Berries'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['berries']));
    expect(screen.getByRole('button', { name: 'Rename' })).toBeEnabled();
  });

  it('UIC-FOLDER-MANAGER-6.1 reports a multiple selection as a set through onSelectionChange', async () => {
    expectTypeOf<FolderManagerProps<Folder, 'multiple'>>().not.toHaveProperty(
      'onSelectedKeysChange',
    );
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(keys: Set<Key>) => void>();
    render(
      <FolderManager
        aria-label="Folders"
        folders={sample}
        selectionMode="multiple"
        defaultSelectedKeys={['citrus']}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.keyboard('{Control>}');
    await user.click(row('Vegetables'));
    await user.keyboard('{/Control}');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(requireDefined(onSelectionChange.mock.lastCall)[0]).toBeInstanceOf(Set);
    expect([...requireDefined(onSelectionChange.mock.lastCall)[0]]).toEqual([
      'citrus',
      'vegetables',
    ]);
  });

  it('UIC-FOLDER-MANAGER-6.2 deletes every selected folder, one after another', async () => {
    const user = userEvent.setup();
    const deleted: Key[] = [];
    render(
      <Manager
        selectionMode="multiple"
        defaultSelectedKeys={['citrus', 'fruit', 'vegetables']}
        onDelete={(key) => {
          deleted.push(key);
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleted).toEqual(['fruit', 'vegetables']);
  });

  it('UIC-FOLDER-MANAGER-6.2 refuses to delete a selection holding a blocked folder', () => {
    render(
      <Manager
        selectionMode="multiple"
        defaultSelectedKeys={['citrus', 'fruit']}
        getDeleteBlockedReason={(folder) => (folder.children ? 'Empty the folder first.' : null)}
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-FOLDER-MANAGER-6.3 moves the selected folders to a place chosen in the context menu', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <Manager selectionMode="multiple" defaultSelectedKeys={['citrus', 'berries']} maxDepth={2} />,
    );
    fireEvent.contextMenu(row('Citrus'));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Rename', 'Delete', 'Move to']);
    await user.click(within(menu).getByRole('menuitem', { name: 'Move to' }));
    const places = await screen.findAllByRole('menu');
    const submenu = places.at(-1) as HTMLElement;
    expect(
      within(submenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Top level', 'Fruit', 'Vegetables']);
    await user.click(within(submenu).getByRole('menuitem', { name: 'Vegetables' }));
    expect(rowNames()).toEqual(['Fruit', 'Vegetables', 'Citrus', 'Berries']);
    expect(row('Vegetables')).toHaveAttribute('aria-expanded', 'true');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('UIC-FOLDER-MANAGER-6.3 lists the places only when the menu opens', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    let nameReads = 0;
    const counted = (id: Key, name: string, children?: Folder[]): Folder => ({
      id,
      get name() {
        nameReads += 1;
        return name;
      },
      ...(children ? { children } : {}),
    });
    const folders = [
      counted('fruit', 'Fruit', [counted('citrus', 'Citrus'), counted(1, 'Berries')]),
      counted('1', 'Vegetables'),
    ];
    render(
      <FolderManager
        aria-label="Folders"
        folders={folders}
        selectionMode="multiple"
        defaultSelectedKeys={['citrus']}
        onMove={onMove}
      />,
    );
    nameReads = 0;
    await user.click(row('Berries'));
    await user.click(row('Citrus'));
    expect(nameReads).toBe(0);
    fireEvent.contextMenu(row('Citrus'));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Move to' }));
    const submenu = (await screen.findAllByRole('menu')).at(-1) as HTMLElement;
    expect(nameReads).toBeGreaterThan(0);
    await user.click(within(submenu).getByRole('menuitem', { name: 'Vegetables' }));
    expect(onMove).toHaveBeenCalledExactlyOnceWith({
      key: 'citrus',
      targetKey: '1',
      position: 'inside',
    });
  });

  it('UIC-FOLDER-MANAGER-6.3 checks each destination depth against the selected subtree', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <FolderManager
        aria-label="Folders"
        folders={[
          { id: 'moving', name: 'Moving', children: [{ id: 'leaf', name: 'Leaf' }] },
          { id: 'target', name: 'Target', children: [{ id: 'nested', name: 'Nested' }] },
        ]}
        selectionMode="multiple"
        defaultSelectedKeys={['moving']}
        maxDepth={3}
        onMove={onMove}
      />,
    );
    fireEvent.contextMenu(row('Moving'));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Move to' }));
    const submenu = (await screen.findAllByRole('menu')).at(-1) as HTMLElement;
    expect(
      within(submenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Top level', 'Target']);
    await user.click(within(submenu).getByRole('menuitem', { name: 'Target' }));
    expect(onMove).toHaveBeenCalledExactlyOnceWith({
      key: 'moving',
      targetKey: 'target',
      position: 'inside',
    });
  });

  it('UIC-FOLDER-MANAGER-7.1 filters the folders by name and highlights the matches', async () => {
    const user = userEvent.setup();
    const { container } = render(<Manager filterable />);
    const search = screen.getByRole('searchbox', { name: 'Filter folders' });
    expect(container.querySelector('.ui-folder-manager__filter')).toContainElement(search);
    await user.click(within(row('Fruit')).getByRole('button', { name: 'Collapse Fruit' }));
    await user.type(search, 'ber');
    expect(rowNames()).toEqual(['Fruit', 'Berries']);
    expect(row('Berries').querySelector('mark')).toHaveTextContent('Ber');
    expectHooksMatchSpec(container, 'FOLDER-MANAGER', { slots: ['filter'] });
    await user.clear(search);
    await user.type(search, 'plum');
    expect(screen.queryAllByRole('row').map((element) => element.textContent)).toEqual([
      'No results',
    ]);
    await user.clear(search);
    expect(rowNames()).toEqual(['Fruit', 'Citrus', 'Berries', 'Vegetables']);
  });

  it('UIC-FOLDER-MANAGER-7.1 expands a collapsed root row to show the matches', async () => {
    const user = userEvent.setup();
    render(<Manager filterable rootLabel="All folders" />);
    await user.click(row('All folders'));
    await user.keyboard('{ArrowLeft}');
    expect(rowNames()).toEqual(['All folders']);
    const search = screen.getByRole('searchbox', { name: 'Filter folders' });
    await user.type(search, 'cit');
    expect(rowNames()).toEqual(['All folders', 'Fruit', 'Citrus']);
    await user.clear(search);
    await user.type(search, 'plum');
    expect(screen.getAllByRole('row').map((element) => element.textContent)).toContain(
      'No results',
    );
  });

  it('UIC-FOLDER-MANAGER-7.1 clears the filter to create a folder', async () => {
    const user = userEvent.setup();
    render(<Manager filterable defaultSelectedKey="vegetables" />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter folders' }), 'cit');
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    expect(screen.getByRole('searchbox', { name: 'Filter folders' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'New folder name' })).toHaveFocus();
  });

  it('UIC-FOLDER-MANAGER-8.1 renders a virtualized tree', () => {
    const { container } = render(<Manager virtualized rowHeight={30} />);
    expect(container.querySelector('.ui-tree')).toHaveAttribute('data-virtualized', 'true');
  });
});
