import { useState } from 'react';
import type { Key, Selection } from '../../src/primitives/index.js';
import type { ButtonVariant } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { MenuItem, MenuSection, type MenuEntry } from '../../src/components/menu/menu.js';
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
          icon="more-vertical"
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

function Choice() {
  const [layout, setLayout] = useState<Selection>(new Set(['list']));
  const chosen = layout === 'all' ? 'all' : [...layout].map(String).join(', ');
  return (
    <>
      <DropdownMenu
        label={`Layout: ${chosen}`}
        icon="expand"
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
        icon="save"
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
            {...(state === 'start icon' ? { icon: 'plus' as const } : {})}
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
    <LabSection title="Controlled" description="The open state lives in the lab.">
      <Controlled />
    </LabSection>
  </>,
);
