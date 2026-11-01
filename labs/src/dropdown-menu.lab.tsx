import { ExpandGlyph, MoreVerticalGlyph, PlusGlyph, SaveGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import { Button, type ButtonVariant } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { MenuItem, MenuSection, type MenuEntry } from '../../src/components/menu/menu.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'ghost', 'danger'];
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['default', 'start icon', 'no caret', 'icon only', 'disabled'] as const;

const editEntries: MenuEntry[] = [
  { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
  { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
  { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', isDisabled: true },
  { type: 'separator', id: 'rule' },
  { id: 'select-all', label: 'Select all', shortcut: 'Ctrl+A' },
];

function Actions() {
  const [last, setLast] = useState('none');
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 360 }}>
        <DropdownMenu
          label="Edit"
          items={editEntries}
          onAction={(key: Key) => setLast(String(key))}
        />
        <DropdownMenu
          label="More actions"
          iconOnly
          icon={MoreVerticalGlyph}
          placement="bottom end"
          items={editEntries}
          onAction={(key: Key) => setLast(String(key))}
        />
      </div>
      <p>
        Last action: <output data-lab-output="action">{last}</output>
      </p>
    </>
  );
}

/** Menus their host disables a second after a press, so the reader can open one first. */
function DisabledWhileOpen() {
  const [isDisabled, setIsDisabled] = useState(false);
  const [last, setLast] = useState('none');
  const onAction = (key: Key) => setLast(String(key));
  return (
    <div data-lab-case="disabled-while-open">
      <p>
        <Button size="sm" onPress={() => window.setTimeout(() => setIsDisabled(true), 1000)}>
          Disable in a second
        </Button>{' '}
        <Button size="sm" onPress={() => setIsDisabled(false)}>
          Enable
        </Button>
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <DropdownMenu
          label="Lockable edit"
          items={editEntries}
          isDisabled={isDisabled}
          onAction={onAction}
        />
        <DropdownMenu
          label="Lockable save"
          icon={SaveGlyph}
          items={editEntries}
          isDisabled={isDisabled}
          onPress={() => setLast('save')}
          onAction={onAction}
        />
      </div>
      <p>
        Last action: <output data-lab-output="action">{last}</output>
      </p>
    </div>
  );
}

function Choice() {
  const [layout, setLayout] = useState<Selection>(new Set(['list']));
  const chosen = layout === 'all' ? 'all' : [...layout].map(String).join(', ');
  return (
    <>
      <DropdownMenu
        label={`Layout: ${chosen}`}
        icon={ExpandGlyph}
        selectionMode="single"
        selectedKeys={layout}
        onSelectionChange={setLayout}
        disallowEmptySelection
        menuSize="lg"
      >
        <MenuSection title="Layout">
          <MenuItem id="list">List</MenuItem>
          <MenuItem id="grid">Grid</MenuItem>
          <MenuItem id="table">Table</MenuItem>
        </MenuSection>
      </DropdownMenu>
      <p>
        Layout: <output data-lab-output="layout">{chosen}</output>
      </p>
    </>
  );
}

const saveEntries: MenuEntry[] = [
  { id: 'save-copy', label: 'Save a copy' },
  { id: 'save-template', label: 'Save as template' },
];

function Split() {
  const [last, setLast] = useState('none');
  return (
    <>
      <DropdownMenu
        label="Save"
        icon={SaveGlyph}
        variant="primary"
        items={saveEntries}
        onPress={() => setLast('save')}
        onAction={(key: Key) => setLast(String(key))}
      />
      <p>
        Last split action: <output data-lab-output="split">{last}</output>
      </p>
    </>
  );
}

const cityNames = ['Paris', 'Lima', 'Oslo', 'Cairo', 'Quito', 'Hanoi', 'Dakar', 'Perth', 'Turin'];

function Filterable() {
  const [last, setLast] = useState('none');
  return (
    <>
      <DropdownMenu
        label="Move to"
        filterable
        items={cityNames.map((name) => ({ id: name.toLowerCase(), label: name }))}
        onAction={(key: Key) => setLast(String(key))}
      />
      <p>
        Moved to: <output data-lab-output="moved">{last}</output>
      </p>
    </>
  );
}

const insertEntries: MenuEntry[] = [
  { id: 'text-box', label: 'Text box' },
  {
    id: 'shape',
    label: 'Shape',
    items: [
      { id: 'square', label: 'Square' },
      { id: 'circle', label: 'Circle' },
      { id: 'star', label: 'Star', isDisabled: true },
      { type: 'separator', id: 'shape-rule' },
      {
        id: 'arrow',
        label: 'Arrow',
        items: [
          { id: 'arrow-start', label: 'Arrow to start' },
          { id: 'arrow-end', label: 'Arrow to end' },
          { type: 'separator', id: 'arrow-rule' },
          { id: 'arrow-both', label: 'Double arrow' },
        ],
      },
    ],
  },
  {
    id: 'chart',
    label: 'Chart',
    items: [
      { id: 'bar-chart', label: 'Bar chart' },
      { id: 'line-chart', label: 'Line chart' },
      { id: 'pie-chart', label: 'Pie chart', isDisabled: true },
    ],
  },
  { type: 'separator', id: 'insert-rule' },
  { id: 'comment', label: 'Comment', isDisabled: true },
];

/** A menu two submenu levels deep whose leaf items report the action they ran. */
function Nested({ label, placement }: { label: string; placement?: 'bottom end' }) {
  const [last, setLast] = useState('none');
  return (
    <div data-lab-case={label}>
      <DropdownMenu
        label={label}
        items={insertEntries}
        placement={placement}
        onAction={(key: Key) => setLast(String(key))}
      />
      <p>
        Inserted: <output data-lab-output="inserted">{last}</output>
      </p>
    </div>
  );
}

/** Nested menus pressed against the inline end of the page, left to right and right to left. */
function NestedAtEdges() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Nested label="Insert at the end" placement="bottom end" />
      </div>
      <UiProvider locale="he-IL">
        <div dir="rtl" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Nested label="Insert right to left" placement="bottom end" />
        </div>
      </UiProvider>
    </div>
  );
}

function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu label="Controlled" items={editEntries} isOpen={open} onOpenChange={setOpen} />
      <p>
        Open: <output data-lab-output="open">{String(open)}</output>
      </p>
    </>
  );
}

mountLab(
  <>
    <LabSection title="Variants and sizes" description="The trigger is a Button with a caret.">
      <StateMatrix
        axes={{ variant: variants, size: sizes }}
        render={({ variant, size }) => (
          <DropdownMenu label="Options" variant={variant} size={size} items={editEntries} />
        )}
      />
    </LabSection>
    <LabSection
      title="Trigger forms and states"
      description="A start icon, no caret, an icon-only trigger and a disabled trigger."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <DropdownMenu
            label={state === 'icon only' ? 'More options' : 'Options'}
            size={size}
            items={editEntries}
            iconOnly={state === 'icon only'}
            showCaret={state === 'no caret' ? false : undefined}
            isDisabled={state === 'disabled'}
            {...(state === 'start icon' ? { icon: PlusGlyph } : {})}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Actions"
      description="Press, Enter, Space or Arrow Down open the menu; Arrow Up opens it on the last item. The icon-only menu aligns to the trigger's end."
    >
      <Actions />
    </LabSection>
    <LabSection
      title="Split buttons"
      description="The labelled button runs its own action; the chevron beside it opens the menu."
    >
      <StateMatrix
        axes={{ action: variants, size: sizes }}
        render={({ action, size }) => (
          <DropdownMenu
            label="Save"
            variant={action}
            size={size}
            items={saveEntries}
            onPress={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Split action"
      description="Save runs at once; More options opens Save a copy and Save as template."
    >
      <Split />
    </LabSection>
    <LabSection
      title="Filterable"
      description="The menu leads with a search field that narrows the cities."
    >
      <Filterable />
    </LabSection>
    <LabSection title="Choice" description="A single choice shown in the trigger label.">
      <Choice />
    </LabSection>
    <LabSection
      title="Disabled while open"
      description="Press Disable in a second, then open either menu: when its trigger turns disabled the menu closes and its items choose nothing, and enabling the trigger again leaves it closed."
    >
      <DisabledWhileOpen />
    </LabSection>
    <LabSection
      title="Nested submenus"
      description="Insert opens Shape and Chart, and Shape opens Arrow, two levels below the menu. Point at an item with a chevron to open its submenu, or press Arrow Right (Enter or Space also open it); Arrow Left or Escape close only that level and return focus to the item that opened it. Choosing a leaf closes every level, shows it under Inserted and returns focus to the trigger. Star, Pie chart and Comment are disabled; separators group the entries."
    >
      <Nested label="Insert" />
    </LabSection>
    <LabSection
      title="Nested submenus at the edge"
      description="The same menu against the end of the line, left to right and right to left: submenus that would leave the window open on the side with room instead. In right-to-left text Arrow Left opens a level and Arrow Right closes it."
    >
      <NestedAtEdges />
    </LabSection>
    <LabSection title="Controlled" description="The open state lives in the lab.">
      <Controlled />
    </LabSection>
  </>,
);
