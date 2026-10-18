import { useState, type ReactNode } from 'react';
import type { Key, Selection } from '../../src/primitives/index.js';
import { UiProvider } from '../../src/core/provider.js';
import {
  MenuItem,
  MenuSection,
  MenuSeparator,
  type MenuEntry,
} from '../../src/components/menu/menu.js';
import { Menubar, MenubarMenu } from '../../src/components/menubar/menubar.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const orientations = ['horizontal', 'vertical'] as const;

const fileEntries: MenuEntry[] = [
  { id: 'new', label: 'New file', icon: 'plus', shortcut: 'Ctrl+N' },
  {
    id: 'recent',
    label: 'Open recent',
    items: [
      { id: 'report', label: 'Report.pdf' },
      { id: 'recipes', label: 'Recipes.csv' },
      {
        id: 'older',
        label: 'Older',
        items: [
          { id: 'cities', label: 'Cities.txt' },
          { id: 'fruit', label: 'Fruit.txt' },
        ],
      },
    ],
  },
  { id: 'save', label: 'Save', icon: 'save', shortcut: 'Ctrl+S' },
  { type: 'separator', id: 'rule' },
  { id: 'close', label: 'Close', shortcut: 'Ctrl+W' },
];

const editEntries: MenuEntry[] = [
  { id: 'undo', label: 'Undo', icon: 'undo', shortcut: 'Ctrl+Z' },
  { id: 'redo', label: 'Redo', icon: 'redo', shortcut: 'Ctrl+Shift+Z' },
  { type: 'separator', id: 'rule' },
  { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
  { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
  { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', isDisabled: true },
  { type: 'separator', id: 'danger-rule' },
  { id: 'delete', label: 'Delete', icon: 'delete', tone: 'danger' },
];

const helpEntries: MenuEntry[] = [
  { id: 'guide', label: 'Guide', icon: 'help', description: 'Opens the getting started guide' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', shortcut: 'Ctrl+/' },
];

/** File, Edit and Help menus for the matrix cells. */
function CompactBar({ label, orientation, size }: { label: string } & Partial<CellProps>) {
  return (
    <Menubar aria-label={label} orientation={orientation} size={size}>
      <MenubarMenu label="File" items={fileEntries} />
      <MenubarMenu label="Edit" items={editEntries} />
      <MenubarMenu label="Help" items={helpEntries} />
    </Menubar>
  );
}

interface CellProps {
  orientation: (typeof orientations)[number];
  size: (typeof sizes)[number];
}

function Feedback({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}

function list(selection: Selection) {
  return selection === 'all' ? 'all' : [...selection].map(String).join(', ') || 'none';
}

/** A full application bar: actions, submenus, a checkable section and a single choice. */
function ApplicationBar() {
  const [last, setLast] = useState('none');
  const [panels, setPanels] = useState<Selection>(new Set(['ruler']));
  const [zoom, setZoom] = useState<Selection>(new Set(['100']));
  const onAction = (key: Key) => setLast(String(key));
  return (
    <>
      <Menubar aria-label="Editor">
        <MenubarMenu label="File" items={fileEntries} onAction={onAction} />
        <MenubarMenu label="Edit" items={editEntries} onAction={onAction} />
        <MenubarMenu label="View" onAction={onAction}>
          <MenuSection
            title="Panels"
            selectionMode="multiple"
            selectedKeys={panels}
            onSelectionChange={setPanels}
          >
            <MenuItem id="ruler">Ruler</MenuItem>
            <MenuItem id="grid">Grid</MenuItem>
            <MenuItem id="outline">Outline</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection
            title="Zoom"
            selectionMode="single"
            selectedKeys={zoom}
            onSelectionChange={setZoom}
            disallowEmptySelection
          >
            <MenuItem id="75">75%</MenuItem>
            <MenuItem id="100">100%</MenuItem>
            <MenuItem id="150">150%</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuItem id="full-screen" shortcut="F11">
            Full screen
          </MenuItem>
        </MenubarMenu>
        <MenubarMenu label="Help" items={helpEntries} onAction={onAction} />
      </Menubar>
      <Feedback name="Action">{last}</Feedback>
      <Feedback name="Panels">{list(panels)}</Feedback>
      <Feedback name="Zoom">{list(zoom)}</Feedback>
    </>
  );
}

function VerticalBar() {
  const [last, setLast] = useState('none');
  const onAction = (key: Key) => setLast(String(key));
  return (
    <>
      <Menubar aria-label="Sections" orientation="vertical">
        <MenubarMenu label="Fruit" onAction={onAction}>
          <MenuItem id="apple">Apple</MenuItem>
          <MenuItem id="pear">Pear</MenuItem>
        </MenubarMenu>
        <MenubarMenu
          label="Cities"
          onAction={onAction}
          items={[
            { id: 'lima', label: 'Lima' },
            { id: 'oslo', label: 'Oslo' },
          ]}
        />
        <MenubarMenu label="Recipes" onAction={onAction}>
          <MenuItem id="soup">Soup</MenuItem>
          <MenuItem id="salad">Salad</MenuItem>
        </MenubarMenu>
      </Menubar>
      <Feedback name="Vertical action">{last}</Feedback>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Bars by orientation and size"
      description="A row or a column of top-level items at each size; the menus take the bar's row density. Hover, press and focus show on interaction."
    >
      <StateMatrix
        axes={{ orientation: orientations, size: sizes }}
        render={({ orientation, size }) => (
          <CompactBar
            label={`${orientation} ${size} menubar`}
            orientation={orientation}
            size={size}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Application menubar"
      description="One tab stop. Arrow Left and Right move along the bar; Arrow Down, Enter or Space open a menu; Arrow Left and Right in an open menu pass to the neighbouring menu, except where they open or close a submenu. Once a menu is open, pointing at another item opens its menu."
    >
      <ApplicationBar />
    </LabSection>
    <LabSection
      title="Vertical menubar"
      description="Arrow Up and Down move along the column; Arrow Right opens a menu beside it and Arrow Left closes it."
    >
      <VerticalBar />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In right-to-left text Arrow Left moves to the next item and menus open from the right."
    >
      <UiProvider locale="he-IL">
        <div dir="rtl">
          <CompactBar label="Right to left menubar" />
        </div>
      </UiProvider>
    </LabSection>
  </>,
);
