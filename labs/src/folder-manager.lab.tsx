import { useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import {
  FolderManager,
  type FolderItem,
  type FolderManagerProps,
} from '../../src/components/folder-manager/folder-manager.js';
import { Modal } from '../../src/components/modal/modal.js';
import { applyTreeMove } from '../../src/utils/tree-reorder.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface Folder extends FolderItem {
  children?: Folder[];
}

const sample: Folder[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [
      { id: 'citrus', name: 'Citrus', children: [{ id: 'lemons', name: 'Lemons' }] },
      { id: 'berries', name: 'Berries' },
    ],
  },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'herbs', name: 'Herbs' },
];

const states = ['editable', 'read-only', 'loading'] as const;
const roots = ['none', 'root'] as const;

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

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** In-memory folders with callbacks that answer after `delay`; the name "Taken" is refused. */
function useFolders(delay: number, onAction: (text: string) => void = () => {}) {
  const [folders, setFolders] = useState<readonly Folder[]>(sample);
  const callbacks: Partial<FolderManagerProps<Folder>> = {
    onCreate: async ({ name, parentKey }) => {
      await wait(delay);
      if (name === 'Taken') throw new Error('A folder named Taken already exists.');
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      setFolders((current) => insertFolder(current, parentKey, { id, name }));
      onAction(`created ${name}`);
      return id;
    },
    onRename: async ({ key, name }) => {
      await wait(delay);
      if (name === 'Taken') throw new Error('A folder named Taken already exists.');
      setFolders((current) =>
        mapFolders(current, (folder) => (folder.id === key ? { ...folder, name } : folder)),
      );
      onAction(`renamed ${String(key)} to ${name}`);
    },
    onDelete: async (key) => {
      await wait(delay);
      setFolders((current) => mapFolders(current, (folder) => (folder.id === key ? null : folder)));
      onAction(`deleted ${String(key)}`);
    },
    onMove: (move) => {
      setFolders((current) => applyTreeMove(current, move));
      onAction(`moved ${String(move.key)} ${move.position} ${String(move.targetKey)}`);
    },
  };
  return { folders, callbacks };
}

function blockedReason(folder: Folder) {
  return folder.children?.length ? 'Empty the folder first.' : null;
}

function MatrixCell({ state, root }: { state: string; root: string }) {
  const { folders, callbacks } = useFolders(0);
  return (
    <FolderManager
      aria-label="Folders"
      folders={state === 'loading' ? [] : folders}
      rootLabel={root === 'root' ? 'All folders' : undefined}
      isPending={state === 'loading'}
      getDeleteBlockedReason={blockedReason}
      {...(state === 'editable' ? callbacks : {})}
    />
  );
}

function Output({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function ManagedFolders() {
  const [last, setLast] = useState('none');
  const [selected, setSelected] = useState<Key | null>('fruit');
  const { folders, callbacks } = useFolders(300, setLast);
  return (
    <>
      <FolderManager
        aria-label="Market folders"
        folders={folders}
        selectedKey={selected}
        onSelectionChange={setSelected}
        getDeleteBlockedReason={blockedReason}
        maxDepth={3}
        data-lab-manager="managed"
        {...callbacks}
      />
      <Output name="Selected">{selected === null ? 'none' : String(selected)}</Output>
      <Output name="Action">{last}</Output>
    </>
  );
}

/** A host that stages a choice: the manager picks inside a modal, and Apply keeps it. */
function PickFolder() {
  const [chosen, setChosen] = useState<Key | null>(null);
  const [staged, setStaged] = useState<Key | null>(null);
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button
        onPress={() => {
          setStaged(chosen);
          setOpen(true);
        }}
      >
        Choose folder
      </Button>
      <Output name="Chosen">{chosen === null ? 'none' : String(chosen)}</Output>
      <Modal
        isOpen={isOpen}
        onOpenChange={setOpen}
        title="Choose a folder"
        primaryAction={{
          label: 'Apply',
          isDisabled: staged === chosen,
          onPress: (close) => {
            setChosen(staged);
            close();
          },
        }}
      >
        <FolderManager
          aria-label="Folders"
          folders={sample}
          rootLabel="No folder"
          selectedKey={staged}
          onSelectionChange={setStaged}
        />
      </Modal>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Editable, read-only (no callbacks) and loading managers, with and without a root row."
    >
      <StateMatrix
        axes={{ state: states, root: roots }}
        render={({ state, root }) => <MatrixCell state={state} root={root} />}
      />
    </LabSection>
    <LabSection
      title="Managing folders"
      description='New folder, Rename (F2) and Delete; right-click a row for its menu; Alt+Arrow keys or drag to move. Answers take 300 ms, the name "Taken" is refused, a folder with subfolders cannot be deleted, and folders nest at most three deep.'
    >
      <ManagedFolders />
    </LabSection>
    <LabSection
      title="Picking in a modal"
      description="The host composes the manager in a modal and keeps the staged folder only on Apply."
    >
      <PickFolder />
    </LabSection>
  </>,
);
