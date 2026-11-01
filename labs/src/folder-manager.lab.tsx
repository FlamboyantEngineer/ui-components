import { useState } from 'react';
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
import { LabOutput } from './lab-output.js';

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
  const callbacks: Pick<
    FolderManagerProps<Folder>,
    'onCreate' | 'onRename' | 'onDelete' | 'onMove'
  > = {
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
      <LabOutput name="Selected">{selected === null ? 'none' : String(selected)}</LabOutput>
      <LabOutput name="Action">{last}</LabOutput>
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
        onSelectionChange={(keys) => setSelected([...keys])}
        data-lab-manager="multiple"
        {...callbacks}
      />
      <LabOutput name="Selection">{selected.map(String).join(', ') || 'none'}</LabOutput>
      <LabOutput name="Bulk action">{last}</LabOutput>
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
      <LabOutput name="Chosen">{chosen === null ? 'none' : String(chosen)}</LabOutput>
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

/** A filter whose search box the host can hide: the query is set aside until it comes back. */
function FindingFolders() {
  const [isFilterable, setFilterable] = useState(true);
  return (
    <>
      <Button size="sm" onPress={() => setFilterable((on) => !on)}>
        {isFilterable ? 'Hide the search box' : 'Show the search box'}
      </Button>
      <FolderManager
        aria-label="Orchard folders"
        folders={orchard}
        filterable={isFilterable}
        data-lab-manager="filter"
      />
    </>
  );
}

/** A host that drops the folder being renamed: the name field closes and the manager frees up. */
function VanishingFolder() {
  const [isRemoved, setRemoved] = useState(false);
  const { folders, callbacks } = useFolders(0);
  const shown = isRemoved
    ? mapFolders(folders, (folder) => (folder.id === 'citrus' ? null : folder))
    : folders;
  return (
    <div data-lab-demo="vanishing">
      <Button
        onPress={() => {
          // The delay leaves time to rename Citrus, or start a folder inside it, first.
          if (isRemoved) setRemoved(false);
          else window.setTimeout(() => setRemoved(true), 1500);
        }}
      >
        {isRemoved ? 'Restore Citrus' : 'Remove Citrus in a moment'}
      </Button>
      <FolderManager
        aria-label="Changing folders"
        folders={shown}
        rootLabel="All folders"
        defaultSelectedKey="citrus"
        {...callbacks}
      />
    </div>
  );
}

const plainKeys: Folder[] = [
  { id: 'root', name: 'Root cellar', children: [{ id: 'draft', name: 'Draft notes' }] },
  { id: 7, name: 'Shelf 7 (number key)' },
  { id: '7', name: 'Shelf 7 (text key)' },
];

/** Folder keys that look like the manager's own rows: each still selects as itself. */
function AnyFolderKeys() {
  const [selected, setSelected] = useState<Key | null>('draft');
  return (
    <>
      <FolderManager
        aria-label="Keyed folders"
        folders={plainKeys}
        rootLabel="All folders"
        selectedKey={selected}
        onSelectionChange={setSelected}
        data-lab-manager="keys"
      />
      <LabOutput name="Selected key">
        {selected === null ? 'none' : `${typeof selected} ${String(selected)}`}
      </LabOutput>
    </>
  );
}

/** A locked folder selected inside another selected folder blocks the whole delete. */
function LockedInsideSelection() {
  const [last, setLast] = useState('none');
  const { folders, callbacks } = useFolders(0, setLast);
  return (
    <>
      <FolderManager
        aria-label="Locked folders"
        folders={folders}
        selectionMode="multiple"
        defaultSelectedKeys={['fruit', 'lemons']}
        getDeleteBlockedReason={(folder) => (folder.id === 'lemons' ? 'Lemons are locked.' : null)}
        data-lab-manager="locked"
        {...callbacks}
      />
      <LabOutput name="Locked action">{last}</LabOutput>
    </>
  );
}

/** A panel closed while its manager waits: the slow answer selects nothing once it is gone. */
function ClosingPanel() {
  const [isOpen, setOpen] = useState(true);
  const [selected, setSelected] = useState<Key | null>('fruit');
  const [last, setLast] = useState('none');
  const { folders, callbacks } = useFolders(1500, setLast);
  return (
    <div data-lab-demo="closing">
      <Button onPress={() => setOpen((open) => !open)}>
        {isOpen ? 'Close panel' : 'Open panel'}
      </Button>
      {isOpen ? (
        <FolderManager
          aria-label="Panel folders"
          folders={folders}
          selectedKey={selected}
          onSelectionChange={setSelected}
          {...callbacks}
        />
      ) : null}
      <LabOutput name="Panel selection">{selected === null ? 'none' : String(selected)}</LabOutput>
      <LabOutput name="Panel action">{last}</LabOutput>
    </div>
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
      description='New folder, Rename (F2) and Delete; right-click a row for its menu; Alt+Arrow keys or drag to move. Answers take 300 ms, the name "Taken" is refused, a folder with subfolders cannot be deleted, and folders nest at most three deep, even when a folder has many loaded children.'
    >
      <ManagedFolders />
    </LabSection>
    <LabSection
      title="Folder removed while named"
      description="Press the button, then rename Citrus or start a folder inside it: when Citrus goes, the name field closes without calling back, focus moves to the root row and the actions come back."
    >
      <VanishingFolder />
    </LabSection>
    <LabSection
      title="Several folders"
      description="Ctrl or Shift with a click, or Shift with the arrow keys, selects several folders. onSelectionChange reports them as a Set of keys. Delete removes them all; right-click for Move to. Folders already at the destination stay there, and the depth limit includes every selected subfolder."
    >
      <SeveralFolders />
    </LabSection>
    <LabSection
      title="Locked folder inside a selection"
      description="Fruit and Lemons are selected and Lemons is locked: Delete is disabled with the reason, and the Delete key shows it without deleting Fruit."
    >
      <LockedInsideSelection />
    </LabSection>
    <LabSection
      title="Subfolders on demand"
      description="Expanding a folder loads its shelves after 300 ms; the Cellar fails once, then Retry loads it."
    >
      <LazyFolders />
    </LabSection>
    <LabSection
      title="Finding a folder"
      description="Type in the search box: matching folders stay, with their parents expanded, and the matched text is marked. Hiding the search box sets the query aside until it comes back."
    >
      <FindingFolders />
    </LabSection>
    <LabSection
      title="Large tree"
      description="Two thousand folders: only the rows in view are in the document, while selection and branch expansion keep the folder order."
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
      title="Any folder keys"
      description="Folders keyed root, draft, 7 and '7' sit beside the root row: each selects and reports its own key."
    >
      <AnyFolderKeys />
    </LabSection>
    <LabSection
      title="Closing while saving"
      description="Answers take 1.5 seconds. Create or delete a folder, then close the panel before the answer: the folder is still created or deleted, but the closed panel selects nothing."
    >
      <ClosingPanel />
    </LabSection>
    <LabSection
      title="Picking in a modal"
      description="The host composes the manager in a modal and keeps the staged folder only on Apply."
    >
      <PickFolder />
    </LabSection>
  </>,
);
