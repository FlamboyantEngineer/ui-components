// Dropdown Menu cases for multiple selection from defaults with disabled entries, whether a choice
// closes the menu, opening on mount, and an icon-only trigger in every button variant.

import { useState } from 'react';
import type { Selection } from '../../src/core/props.js';
import { Button, type ButtonVariant } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { MenuItem, MenuSection, type MenuEntry } from '../../src/components/menu/menu.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const describeSelection = (keys: Selection) =>
  keys === 'all' ? 'all' : [...keys].map(String).sort().join(', ') || 'none';

/** Uncontrolled multiple selection: starts from defaults, with entries that cannot be chosen. */
function MultipleChoice() {
  const [closesOnSelect, setClosesOnSelect] = useState(false);
  const [chosen, setChosen] = useState('apples, pears');
  return (
    <div data-lab-demo="multiple">
      <Switch isSelected={closesOnSelect} onChange={setClosesOnSelect}>
        Close on each choice
      </Switch>
      <DropdownMenu
        label="Fruit"
        selectionMode="multiple"
        defaultSelectedKeys={['apples', 'pears']}
        disabledKeys={['quinces']}
        shouldCloseOnSelect={closesOnSelect}
        onSelectionChange={(keys) => setChosen(describeSelection(keys))}
      >
        <MenuSection title="Fruit">
          <MenuItem id="apples">Apples</MenuItem>
          <MenuItem id="pears">Pears</MenuItem>
          <MenuItem id="plums">Plums</MenuItem>
          <MenuItem id="quinces">Quinces (out of season)</MenuItem>
        </MenuSection>
      </DropdownMenu>
      <p data-lab-output="multiple">
        Selected: {chosen}; shouldCloseOnSelect: {String(closesOnSelect)}
      </p>
    </div>
  );
}

const shareEntries: MenuEntry[] = [
  { id: 'copy', label: 'Copy link' },
  { id: 'mail', label: 'Send by mail' },
];

/** A menu mounted on demand that opens as it mounts. */
function OpenOnMount() {
  const [isMounted, setMounted] = useState(false);
  const [action, setAction] = useState('none');
  return (
    <div data-lab-demo="default-open">
      <Button size="sm" variant="secondary" onPress={() => setMounted((mounted) => !mounted)}>
        {isMounted ? 'Remove the share menu' : 'Add the share menu'}
      </Button>{' '}
      {isMounted ? (
        <DropdownMenu
          label="Share"
          defaultOpen
          items={shareEntries}
          onAction={(key) => setAction(String(key))}
        />
      ) : null}
      <p data-lab-output="default-open">Last action: {action}</p>
    </div>
  );
}

const allVariants: ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'ghost',
  'danger',
  'link',
  'accent',
  'chip',
  'bare',
];

export function DropdownMenuCoverageSections() {
  return (
    <>
      <LabSection
        title="Multiple choice"
        description="selectionMode multiple, uncontrolled from defaultSelectedKeys (apples and pears), with quinces in disabledKeys. By default the menu stays open while choosing; switch on shouldCloseOnSelect to close it after each choice."
      >
        <MultipleChoice />
      </LabSection>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens an uncontrolled menu as it mounts; Add the share menu mounts it open."
      >
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Icon-only triggers"
        description="An icon-only trigger in every button variant, including link, accent, chip and bare."
      >
        <StateMatrix
          axes={{ variant: allVariants }}
          render={({ variant }) => (
            <DropdownMenu
              label="More options"
              iconOnly
              variant={variant}
              size="sm"
              items={shareEntries}
            />
          )}
        />
      </LabSection>
    </>
  );
}
