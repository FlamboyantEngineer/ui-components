import { useState, type CSSProperties, type ReactNode } from 'react';
import { ListLayout, Virtualizer, type Key, type Selection } from 'react-aria-components';
import { Button } from '../../src/components/button/button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  SubmenuTrigger,
  type MenuEntry,
  type MenuProps,
} from '../../src/components/menu/menu.js';
import { Portal, PortalHost } from '../../src/components/portal/portal.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const cities = ['Paris', 'Lima', 'Oslo', 'Cairo', 'Quito', 'Hanoi', 'Dakar', 'Perth', 'Turin'];

// Lab-only presentation; the library draws none of it.
const panel: CSSProperties = { padding: 12, border: '1px solid', background: 'Canvas' };

const dot = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const itemKinds = {
  plain: { id: 'item', label: 'Rename' },
  icon: { id: 'item', label: 'New file', icon: 'plus' },
  'custom icon': { id: 'item', label: 'Record', icon: dot },
  description: {
    id: 'item',
    label: 'Restore',
    icon: 'restore',
    description: 'Back to the saved copy',
  },
  shortcut: { id: 'item', label: 'Undo', icon: 'undo', shortcut: 'Ctrl+Z' },
  submenu: { id: 'item', label: 'Share', items: [{ id: 'mail', label: 'Mail' }] },
  custom: {
    id: 'item',
    label: 'Teal',
    renderContent: ({ isFocused }) => (
      <span data-lab-custom="">
        <span aria-hidden="true">■ </span>Teal{isFocused ? ' (focused)' : ''}
      </span>
    ),
  },
} satisfies Record<string, MenuEntry>;

/** A one-item menu showing the item in `state`. */
function stateMenu(state: string): MenuProps {
  const selectable = state === 'selected' || state === 'unselected';
  const item: MenuEntry = {
    id: 'item',
    label: state === 'pending' ? 'Loading…' : state === 'danger' ? 'Delete' : 'Archive',
    icon: 'minus',
    tone: state === 'danger' ? 'danger' : 'neutral',
    isDisabled: state === 'disabled',
    isPending: state === 'pending',
  };
  const selection: MenuProps = {
    selectionMode: 'single',
    selectedKeys: state === 'selected' ? ['item'] : [],
  };
  return { 'aria-label': `${state} item`, items: [item], ...(selectable ? selection : {}) };
}

/** A `Button` that opens a `Menu` (lab helper). */
function MenuButton({ label, ...menu }: MenuProps & { label: string }) {
  return (
    <MenuTrigger>
      <Button endIcon="chevron-down">{label}</Button>
      <MenuPopover>
        <Menu {...menu} />
      </MenuPopover>
    </MenuTrigger>
  );
}

const fileEntries: MenuEntry[] = [
  { id: 'new', label: 'New file', icon: 'plus', shortcut: 'Ctrl+N' },
  { id: 'open', label: 'Open…', shortcut: 'Ctrl+O' },
  { id: 'recent', label: 'Recent (none)', isDisabled: true },
  { type: 'separator', id: 'rule' },
  {
    id: 'export',
    label: 'Export as',
    items: [
      { id: 'pdf', label: 'Report.pdf' },
      { id: 'csv', label: 'Table.csv' },
      {
        id: 'image',
        label: 'Image',
        items: [
          { id: 'png', label: 'PNG' },
          { id: 'svg', label: 'SVG' },
        ],
      },
    ],
  },
  {
    type: 'section',
    id: 'danger-zone',
    title: 'Danger zone',
    items: [{ id: 'delete', label: 'Delete', icon: 'close', tone: 'danger' }],
  },
];

function Feedback({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function DataMenu() {
  const [last, setLast] = useState('none');
  return (
    <>
      <MenuButton label="File" items={fileEntries} onAction={(key) => setLast(String(key))} />
      <Feedback name="File action">{last}</Feedback>
    </>
  );
}

function JsxMenu() {
  const [last, setLast] = useState('none');
  const onAction = (key: Key) => setLast(String(key));
  return (
    <>
      <MenuTrigger>
        <IconButton icon="more" label="Edit actions" variant="secondary" />
        <MenuPopover>
          <Menu onAction={onAction}>
            <MenuSection title="Clipboard">
              <MenuItem id="cut" shortcut="Ctrl+X">
                Cut
              </MenuItem>
              <MenuItem id="copy" shortcut="Ctrl+C">
                Copy
              </MenuItem>
              <MenuItem id="paste" shortcut="Ctrl+V" isDisabled>
                Paste
              </MenuItem>
            </MenuSection>
            <MenuSeparator />
            <SubmenuTrigger>
              <MenuItem id="move">Move to</MenuItem>
              <MenuPopover>
                <Menu
                  onAction={onAction}
                  items={cities.slice(0, 3).map((id) => ({ id, label: id }))}
                />
              </MenuPopover>
            </SubmenuTrigger>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
      <Feedback name="Edit action">{last}</Feedback>
    </>
  );
}

function list(selection: Selection) {
  return selection === 'all' ? 'all' : [...selection].map(String).join(', ') || 'none';
}

function SelectionMenu() {
  const [sort, setSort] = useState<Selection>(new Set(['name']));
  const [columns, setColumns] = useState<Selection>(new Set(['size']));
  return (
    <>
      <MenuButton label="View">
        <MenuSection
          title="Sort by"
          selectionMode="single"
          selectedKeys={sort}
          onSelectionChange={setSort}
          disallowEmptySelection
        >
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
        </MenuSection>
        <MenuSection
          title="Columns"
          selectionMode="multiple"
          selectedKeys={columns}
          onSelectionChange={setColumns}
        >
          <MenuItem id="size">Size</MenuItem>
          <MenuItem id="kind">Kind</MenuItem>
          <MenuItem id="owner">Owner</MenuItem>
        </MenuSection>
      </MenuButton>
      <Feedback name="Sort">{list(sort)}</Feedback>
      <Feedback name="Columns">{list(columns)}</Feedback>
    </>
  );
}

const cityEntries: MenuEntry[] = Array.from({ length: 45 }, (_, index) => ({
  id: `city-${index + 1}`,
  label: `${cities[index % cities.length]} ${index + 1}`,
}));

function FilterableMenu() {
  const [last, setLast] = useState('none');
  return (
    <>
      <MenuButton
        label="Move to"
        filterable
        items={cityEntries}
        onAction={(key) => setLast(String(key))}
      />
      <Feedback name="Move action">{last}</Feedback>
    </>
  );
}

function HighlightedMenu() {
  return <MenuButton label="Highlighted cities" filterable highlightMatches items={cityEntries} />;
}

const pageSize = 20;

/** A menu that loads 20 more cities, after a short wait, each time its end scrolls into view. */
function PagedMenu() {
  const [count, setCount] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const entries = Array.from({ length: count }, (_, index) => ({
    id: `paged-${index + 1}`,
    label: `${cities[index % cities.length]} ${index + 1}`,
  }));
  return (
    <>
      <MenuButton
        label="Paged cities"
        items={entries}
        isLoading={isLoading}
        onLoadMore={() => {
          if (isLoading || count >= 100) return;
          setIsLoading(true);
          setTimeout(() => {
            setCount((current) => current + pageSize);
            setIsLoading(false);
          }, 500);
        }}
      />
      <Feedback name="Loaded">{count}</Feedback>
    </>
  );
}

const manyCities: MenuEntry[] = Array.from({ length: 5000 }, (_, index) => ({
  id: `many-${index + 1}`,
  label: `${cities[index % cities.length]} ${index + 1}`,
}));

function VirtualizedMenu() {
  return (
    <MenuTrigger>
      <Button endIcon="chevron-down">5000 cities</Button>
      <MenuPopover>
        <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: 28 }}>
          <Menu aria-label="5000 cities" items={manyCities} />
        </Virtualizer>
      </MenuPopover>
    </MenuTrigger>
  );
}

function Layering() {
  return (
    <div data-lab-stage="" style={{ position: 'relative', width: 320, height: 220 }}>
      <PortalHost>
        <Portal layer="modal">
          <div data-lab-modal-panel="" style={{ ...panel, width: 276, height: 176 }}>
            <p style={{ margin: '0 0 8px' }}>A panel on the modal layer.</p>
            <MenuButton
              label="Layered menu"
              items={['First', 'Second', 'Third'].map((n) => ({ id: n, label: `${n} action` }))}
            />
          </div>
        </Portal>
        <Portal layer="tooltip">
          <div
            data-lab-tooltip-note=""
            style={{ ...panel, position: 'absolute', left: 60, top: 100, padding: 4 }}
          >
            Tooltip layer
          </div>
        </Portal>
      </PortalHost>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Items by size"
      description="Each item kind in a standalone menu at every size. Rows, icons and shortcuts follow the menu size."
    >
      <StateMatrix
        axes={{
          item: Object.keys(itemKinds) as Array<keyof typeof itemKinds>,
          size: sizes,
        }}
        render={({ item, size }) => (
          <Menu aria-label={`${item} item`} size={size} items={[itemKinds[item]]} />
        )}
      />
    </LabSection>
    <LabSection
      title="Item states by size"
      description="Tone, disabled, pending and selection. Hover, press and keyboard focus show on interaction."
    >
      <StateMatrix
        axes={{
          state: ['default', 'danger', 'disabled', 'pending', 'selected', 'unselected'],
          size: sizes,
        }}
        render={({ state, size }) => <Menu size={size} {...stateMenu(state)} />}
      />
    </LabSection>
    <LabSection
      title="Opened from a button, items as data"
      description="A separator, a section, a disabled item and two levels of submenus. Arrow Right opens a submenu; Arrow Left or Escape closes it."
    >
      <DataMenu />
    </LabSection>
    <LabSection
      title="Composed with JSX"
      description="An icon button trigger, a titled section with shortcuts and a submenu."
    >
      <JsxMenu />
    </LabSection>
    <LabSection
      title="Selection"
      description="A single-choice section and a multiple-choice section; choosing in the multiple-choice section keeps the menu open."
    >
      <SelectionMenu />
    </LabSection>
    <LabSection
      title="Long menu"
      description="The popover fits its height to the viewport and scrolls."
    >
      <MenuButton label="Cities" items={cityEntries} />
    </LabSection>
    <LabSection
      title="Layering"
      description="A menu opened from a panel on the modal layer stacks above the panel and below the tooltip layer."
    >
      <Layering />
    </LabSection>
    <LabSection
      title="Search and loading states"
      description="A filterable menu with and without a match, and a menu loading its first entries."
    >
      <StateMatrix
        axes={{ state: ['filterable', 'no match', 'loading'], size: sizes }}
        render={({ state, size }) =>
          state === 'loading' ? (
            <Menu aria-label="Loading menu" size={size} items={[]} isLoading />
          ) : (
            <Menu
              aria-label={`${state} menu`}
              size={size}
              filterable
              items={state === 'no match' ? [] : cityEntries.slice(0, 3)}
            />
          )
        }
      />
    </LabSection>
    <LabSection
      title="Filterable menu"
      description="Typing in the search field narrows the cities while focus stays in it; Arrow Down moves the highlight and Enter picks."
    >
      <FilterableMenu />
    </LabSection>
    <LabSection
      title="Highlighted matches"
      description="With highlightMatches, the typed text is marked in each matching label."
    >
      <HighlightedMenu />
    </LabSection>
    <LabSection
      title="Loading more"
      description="Scrolling to the end shows a loading row, then 20 more cities, up to 100."
    >
      <PagedMenu />
    </LabSection>
    <LabSection
      title="Virtualized menu"
      description="5000 cities in a React Aria Virtualizer: only the rows in view render, and End reaches the last."
    >
      <VirtualizedMenu />
    </LabSection>
  </>,
);
