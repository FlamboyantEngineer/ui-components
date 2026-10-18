import { useState, type ReactNode } from 'react';
import type { Key } from '../../src/core/props.js';
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
      defaultSelectedKey="citrus"
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

/** Several folders at once: Delete removes them all, and the context menu moves them. */
function SeveralFolders() {
  const [last, setLast] = useState('none');
  const [selected, setSelected] = useState<Key[]>(['citrus', 'herbs']);
  const { folders, callbacks } = useFolders(0, setLast);
  return (
    <>
      <FolderManager
        aria-label="Pantry folders"
        folders={folders}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectedKeysChange={setSelected}
        data-lab-manager="multiple"
        {...callbacks}
      />
      <Output name="Selection">{selected.map(String).join(', ') || 'none'}</Output>
      <Output name="Bulk action">{last}</Output>
    </>
  );
}

let loadAttempts = 0;

/** Folders whose subfolders load on demand after 300 ms; "Cellar" fails the first time. */
function LazyFolders() {
  const [folders, setFolders] = useState<readonly Folder[]>([
    { id: 'pantry', name: 'Pantry', hasChildren: true },
    { id: 'cellar', name: 'Cellar', hasChildren: true },
    { id: 'freezer', name: 'Freezer' },
  ]);
  const onLoadChildren = async (key: Key) => {
    await wait(300);
    if (key === 'cellar' && (loadAttempts += 1) === 1) throw new Error('The cellar is locked.');
    const children: Folder[] = [1, 2, 3].map((index) => ({
      id: `${String(key)}-shelf-${index}`,
      name: `Shelf ${index}`,
      hasChildren: index === 1,
    }));
    setFolders((current) =>
      mapFolders(current, (folder) => (folder.id === key ? { ...folder, children } : folder)),
    );
  };
  return (
    <FolderManager
      aria-label="Storage folders"
      folders={folders}
      onLoadChildren={onLoadChildren}
      data-lab-manager="lazy"
    />
  );
}

const orchard: Folder[] = ['North', 'South', 'East', 'West'].map((side) => ({
  id: side.toLowerCase(),
  name: `${side} orchard`,
  children: ['Apples', 'Pears', 'Plums', 'Cherries'].map((fruit) => ({
    id: `${side.toLowerCase()}-${fruit.toLowerCase()}`,
    name: fruit,
    children: ['Early', 'Late'].map((season) => ({
      id: `${side.toLowerCase()}-${fruit.toLowerCase()}-${season.toLowerCase()}`,
      name: `${season} ${fruit.toLowerCase()}`,
    })),
  })),
}));

const warehouse: Folder[] = Array.from({ length: 40 }, (_, aisle) => ({
  id: `aisle-${aisle + 1}`,
  name: `Aisle ${aisle + 1}`,
  children: Array.from({ length: 50 }, (_, bin) => ({
    id: `aisle-${aisle + 1}-bin-${bin + 1}`,
    name: `Bin ${aisle * 50 + bin + 1}`,
  })),
}));

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
      title="Several folders"
      description="Ctrl or Shift with a click, or Shift with the arrow keys, selects several folders. Delete removes them all; right-click for Move to."
    >
      <SeveralFolders />
    </LabSection>
    <LabSection
      title="Subfolders on demand"
      description="Expanding a folder loads its shelves after 300 ms; the Cellar fails once, then Retry loads it."
    >
      <LazyFolders />
    </LabSection>
    <LabSection
      title="Finding a folder"
      description="Type in the search box: matching folders stay, with their parents expanded, and the matched text is marked."
    >
      <FolderManager
        aria-label="Orchard folders"
        folders={orchard}
        filterable
        data-lab-manager="filter"
      />
    </LabSection>
    <LabSection
      title="Large tree"
      description="Two thousand folders: only the rows in view are in the document."
    >
      <FolderManager
        aria-label="Warehouse folders"
        folders={warehouse}
        virtualized
        rowHeight={28}
        data-lab-manager="virtualized"
      />
    </LabSection>
    <LabSection
      title="Picking in a modal"
      description="The host composes the manager in a modal and keeps the staged folder only on Apply."
    >
      <PickFolder />
    </LabSection>
  </>,
);
