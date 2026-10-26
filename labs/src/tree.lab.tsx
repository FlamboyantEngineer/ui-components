import { useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Tree, type TreeItemState } from '../../src/components/tree/tree.js';
import { applyTreeMove, type TreeMove } from '../../src/utils/tree-reorder.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  CheckboxTree,
  FilterTree,
  InPlaceRenameTree,
  LoadingTree,
  MultipleReorderTree,
  NestedTree,
  PrimitiveTree,
} from './tree-cases.js';

interface Entry {
  id: string;
  name: string;
  href?: string;
  children?: Entry[];
}

const folder = (id: string, name: string, children: Entry[] = []): Entry => ({
  id,
  name,
  children,
});
const file = (id: string, name: string, href?: string): Entry => ({
  id,
  name,
  ...(href ? { href } : {}),
});

const LIBRARY: Entry[] = [
  folder('recipes', 'Recipes', [
    file('soup', 'Tomato soup.txt'),
    file('bread', 'Sourdough bread with a long overnight rise.txt'),
    folder('desserts', 'Desserts', [file('tart', 'Lemon tart.txt'), file('flan', 'Flan.txt')]),
  ]),
  folder('travel', 'Travel', [file('lisbon', 'Lisbon.pdf'), file('oslo', 'Oslo.pdf')]),
  file('budget', 'Budget.xlsx'),
  file('archive', 'Archive.zip'),
];

const ALL_FOLDERS = ['recipes', 'desserts', 'travel'];

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5h-7.1L10.5 5H4.5A1.5 1.5 0 0 0 3 6.5Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

const name = (entry: Entry) => entry.name;
const icon = (entry: Entry) => (entry.children ? <FolderIcon /> : <FileIcon />);
const sizeOf = (entry: Entry) => (entry.children ? `${entry.children.length} items` : null);

const variants = ['default', 'picker'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const states = ['default', 'selected', 'current', 'disabled'] as const;

function StatesTree({ state }: { state: (typeof states)[number] }) {
  return (
    <Tree
      aria-label={`${state} rows`}
      items={LIBRARY}
      getTextValue={name}
      getIcon={icon}
      defaultExpandedKeys={['travel']}
      selectionMode={state === 'selected' ? 'single' : 'none'}
      defaultSelectedKeys={state === 'selected' ? ['lisbon'] : undefined}
      isItemCurrent={state === 'current' ? (entry) => entry.id === 'lisbon' : undefined}
      disabledKeys={state === 'disabled' ? ['lisbon'] : undefined}
    />
  );
}

function SelectionTree() {
  const [selected, setSelected] = useState('none');
  const [action, setAction] = useState('none');
  return (
    <div data-lab-selection>
      <Tree
        aria-label="Pick a file"
        items={LIBRARY}
        getTextValue={name}
        getIcon={icon}
        defaultExpandedKeys={ALL_FOLDERS}
        selectionMode="single"
        selectionBehavior="replace"
        onSelectionChange={(keys) => setSelected(keys === 'all' ? 'all' : [...keys].join(', '))}
        onAction={(key) => setAction(String(key))}
        renderMeta={sizeOf}
        renderActions={(entry) => <Button icon="more" size="sm" label={`More for ${entry.name}`} />}
      />
      <p data-lab-output>
        Selected: {selected} · Opened: {action}
      </p>
    </div>
  );
}

function LazyTree() {
  const [loaded, setLoaded] = useState<Entry[] | null>(null);
  const [pending, setPending] = useState(false);
  const items: Entry[] = [
    { id: 'remote', name: 'Shared drive', ...(loaded ? { children: loaded } : {}) },
    file('local', 'Local notes.txt'),
  ];
  return (
    <Tree
      aria-label="Drives"
      items={items}
      getTextValue={name}
      getIcon={(entry) => (entry.id === 'local' ? <FileIcon /> : <FolderIcon />)}
      hasChildItems={(entry) => entry.id === 'remote'}
      isItemPending={() => pending}
      onExpandedChange={(keys) => {
        if (keys.has('remote') && !loaded && !pending) {
          setPending(true);
          setTimeout(() => {
            setLoaded([file('plans', 'Plans.pdf'), file('photos', 'Photos.zip')]);
            setPending(false);
          }, 600);
        }
      }}
    />
  );
}

function renameEntry(entries: readonly Entry[], id: string, newName: string): Entry[] {
  return entries.map((entry) => ({
    ...entry,
    ...(entry.id === id ? { name: newName } : {}),
    ...(entry.children ? { children: renameEntry(entry.children, id, newName) } : {}),
  }));
}

function RenameTree() {
  const [items, setItems] = useState<Entry[]>(LIBRARY);
  const [renaming, setRenaming] = useState<string | null>(null);
  const renameField = (entry: Entry) => (
    <input
      aria-label={`Rename ${entry.name}`}
      defaultValue={entry.name}
      autoFocus
      onBlur={() => setRenaming(null)}
      onKeyDown={(event) => {
        if (event.key === 'Enter')
          setItems((current) => renameEntry(current, entry.id, event.currentTarget.value));
        if (event.key === 'Enter' || event.key === 'Escape') setRenaming(null);
      }}
    />
  );
  return (
    <div data-lab-rename>
      <Tree
        aria-label="Rename with F2"
        items={items}
        getTextValue={name}
        getChildren={(entry) => entry.children}
        getIcon={icon}
        defaultExpandedKeys={['recipes']}
        renderLabel={(entry) => (entry.id === renaming ? renameField(entry) : entry.name)}
        onItemKeyDown={(entry, event) => {
          if (event.key !== 'F2') return false;
          setRenaming(entry.id);
          return true;
        }}
      />
    </div>
  );
}

/** Folders take files and folders; the top level takes only folders. */
const canMoveInto = (entry: Entry, parent: Entry | null) =>
  parent === null ? Boolean(entry.children) : Boolean(parent.children);

function ReorderTree({ betweenParents }: { betweenParents: boolean }) {
  const [items, setItems] = useState<readonly Entry[]>(LIBRARY);
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(ALL_FOLDERS));
  const [last, setLast] = useState<TreeMove | null>(null);
  const label = betweenParents ? 'Reorder between folders' : 'Reorder among siblings';
  return (
    <div data-lab-reorder={betweenParents ? 'parents' : 'siblings'}>
      <Tree
        aria-label={label}
        items={items}
        getTextValue={name}
        getIcon={icon}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
        disabledKeys={['archive']}
        reorder={{
          canMove: (entry) => entry.id !== 'budget',
          canMoveInto: betweenParents ? canMoveInto : undefined,
          onMove: (move) => {
            setLast(move);
            setItems((current) => applyTreeMove(current, move));
          },
        }}
      />
      <p data-lab-output>
        Last move: {last ? `${last.key} ${last.position} ${last.targetKey}` : 'none'}
      </p>
    </div>
  );
}

const stateNote = (state: TreeItemState) => (state.isExpanded ? 'open' : null);

const manyFolders: Entry[] = Array.from({ length: 20 }, (_, group) =>
  folder(
    `crate-${group + 1}`,
    `Crate ${group + 1}`,
    Array.from({ length: 99 }, (_, index) =>
      file(`crate-${group + 1}-${index + 1}`, `Apple ${group * 99 + index + 1}.txt`),
    ),
  ),
);

mountLab(
  <>
    <LabSection
      title="Variants and sizes"
      description="Each variant at each row size. Archive.zip is disabled: the picker greys it out, the default variant keeps its text."
    >
      <StateMatrix
        axes={{ variant: variants, size: sizes }}
        render={({ variant, size }) => (
          <div data-lab-column="240" style={{ width: 240 }}>
            <Tree
              aria-label={`${variant} ${size}`}
              items={LIBRARY}
              getTextValue={name}
              getIcon={icon}
              variant={variant}
              size={size}
              defaultExpandedKeys={['recipes']}
              disabledKeys={['archive']}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Row states"
      description="Lisbon.pdf selected, current or disabled, beside a row in its ordinary state."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) => (
          <div data-lab-column="220" style={{ width: 220 }}>
            <StatesTree state={state} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Expand glyphs and wrapping"
      description="Chevrons or plus and minus; labels on one line or wrapping in a 200px column."
    >
      <StateMatrix
        axes={{ glyph: ['chevron', 'plus-minus'], wrap: ['nowrap', 'wrap'] }}
        render={({ glyph, wrap }) => (
          <div data-lab-column="200" style={{ width: 200 }}>
            <Tree
              aria-label={`${glyph} ${wrap}`}
              items={LIBRARY}
              getTextValue={name}
              getIcon={icon}
              renderMeta={(entry, state) => stateNote(state) ?? sizeOf(entry)}
              expandGlyph={glyph}
              wrap={wrap === 'wrap'}
              defaultExpandedKeys={['recipes']}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Selection, actions and links"
      description="Click selects, double-click or Enter opens; each row has a trailing action. Below, link rows navigate to in-page anchors and the current one is marked."
    >
      <SelectionTree />
      <Tree
        aria-label="Travel links"
        items={[
          file('lisbon-link', 'Lisbon', '#lisbon'),
          file('oslo-link', 'Oslo', '#oslo'),
          file('kyoto-link', 'Kyoto', '#kyoto'),
        ]}
        getTextValue={name}
        getHref={(entry) => entry.href}
        isItemCurrent={(entry) => entry.id === 'oslo-link'}
      />
    </LabSection>
    <LabSection
      title="Owner labels and keys"
      description="The owner draws labels and sees each key first: F2 on a row swaps its label for a rename field, whose keys stay out of the tree's navigation. Enter keeps the name, Escape drops it."
    >
      <RenameTree />
    </LabSection>
    <LabSection
      title="Persisted expansion"
      description="Expansion is stored through the provider's storage: expand a folder and reload the page."
    >
      <Tree
        aria-label="Persisted folders"
        items={LIBRARY}
        getTextValue={name}
        getIcon={icon}
        persistKey="tree-lab-expansion"
        data-lab-persisted
      />
    </LabSection>
    <LabSection
      title="Loading and empty"
      description="A tree loading its items, an empty tree, and a folder whose children load when it is first expanded."
    >
      <StateMatrix
        axes={{ state: ['loading', 'empty', 'lazy'] }}
        render={({ state }) =>
          state === 'lazy' ? (
            <LazyTree />
          ) : (
            <Tree
              aria-label={`${state} tree`}
              items={[]}
              getTextValue={name}
              isPending={state === 'loading'}
              emptyMessage="No files yet"
            />
          )
        }
      />
    </LabSection>
    <LabSection
      title="Virtualized"
      description="Two thousand rows in twenty folders: only the rows in view are in the document."
    >
      <Tree
        aria-label="Many folders"
        items={manyFolders}
        getTextValue={name}
        getIcon={icon}
        defaultExpandedKeys={manyFolders.map((entry) => entry.id)}
        virtualized
        data-lab-tree="virtualized"
      />
    </LabSection>
    <LabSection
      title="Primitive keys"
      description="Numeric and text ids stay distinct in selection, expansion, actions and reordering. Space key is disabled independently of Dash key."
    >
      <PrimitiveTree />
    </LabSection>
    <LabSection
      title="Reordering"
      description="Drag a row, use its drag handle with the keyboard, or press Alt+Arrow keys. Budget.xlsx is fixed and Archive.zip disabled. On the right, rows also move between folders, and folders to the top level."
    >
      <div data-lab-row style={{ display: 'flex', gap: 32 }}>
        <ReorderTree betweenParents={false} />
        <ReorderTree betweenParents />
      </div>
    </LabSection>
    <LabSection
      title="Reordering several rows"
      description="Lisbon and Porto are selected: drag either to move both, in order. Cities may move to another country."
    >
      <MultipleReorderTree />
    </LabSection>
    <LabSection
      title="Checkbox selection"
      description="Checking a country checks its cities; a country with only some cities checked shows a mixed box. Bergen is disabled and left alone."
    >
      <CheckboxTree />
    </LabSection>
    <LabSection
      title="Filtering"
      description="Matching places show with their ancestors opened and the match marked; a matching country keeps its cities to open."
    >
      <FilterTree />
    </LabSection>
    <LabSection
      title="Loading on demand"
      description="Opening a region loads its towns in their given order. South fails the first time: its row shows why, with a retry."
    >
      <LoadingTree />
    </LabSection>
    <LabSection
      title="Nested filtering and selection"
      description="Twenty-four loaded levels: filter for Level 24 to reveal its ancestors, or select the root to select every descendant."
    >
      <NestedTree />
    </LabSection>
    <LabSection
      title="Renaming in place"
      description="F2 renames the focused country or city; Enter or leaving the field keeps the name, Escape drops it. Continents cannot be renamed."
    >
      <InPlaceRenameTree />
    </LabSection>
  </>,
);
