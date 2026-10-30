import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Key } from '../../core/props.js';
import { describe, expect, it, vi } from 'vitest';
import { FolderManager, type FolderItem } from './folder-manager.js';

interface Folder extends FolderItem {
  children?: Folder[];
}

const sample: Folder[] = [
  { id: 'fruit', name: 'Fruit', children: [{ id: 'citrus', name: 'Citrus' }] },
  { id: 'vegetables', name: 'Vegetables' },
];

/** A promise the test settles. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('FolderManager actions that outlive it', () => {
  it('UIC-FOLDER-MANAGER-2.5 selects nothing when a create settles after the manager unmounts', async () => {
    const user = userEvent.setup();
    const created = deferred<Key>();
    const onSelectionChange = vi.fn();
    const manager = (
      <FolderManager
        aria-label="Folders"
        folders={sample}
        onCreate={() => created.promise}
        onSelectionChange={onSelectionChange}
      />
    );
    const { unmount } = render(manager);
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    await user.keyboard('Melons{Enter}');
    unmount();
    // A manager mounted in its place does not take up the departed one's completion.
    render(manager);
    await act(async () => created.resolve('melons'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it('UIC-FOLDER-MANAGER-2.5 reports nothing when a create is refused after the manager unmounts', async () => {
    const user = userEvent.setup();
    const created = deferred<Key>();
    const onSelectionChange = vi.fn();
    const { unmount } = render(
      <FolderManager
        aria-label="Folders"
        folders={sample}
        onCreate={() => created.promise}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    await user.keyboard('Melons{Enter}');
    unmount();
    await act(async () => created.reject(new Error('That name is taken.')));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('UIC-FOLDER-MANAGER-2.6 selects nothing when a delete settles after the manager unmounts', async () => {
    const user = userEvent.setup();
    const deleted = deferred<undefined>();
    const onDelete = vi.fn(() => deleted.promise);
    const onSelectionChange = vi.fn();
    const manager = (
      <FolderManager
        aria-label="Folders"
        folders={sample}
        defaultSelectedKey="citrus"
        onDelete={onDelete}
        onSelectionChange={onSelectionChange}
      />
    );
    const { unmount } = render(manager);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('citrus');
    unmount();
    render(manager);
    await act(async () => deleted.resolve(undefined));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('row', { name: 'Citrus' })).toHaveAttribute('aria-selected', 'true');
  });
});
