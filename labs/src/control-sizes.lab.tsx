import type { ReactNode } from 'react';
import { BooleanField } from '../../src/components/boolean-field/boolean-field.js';
import { Button } from '../../src/components/button/button.js';
import { CheckboxGroup } from '../../src/components/checkbox-group/checkbox-group.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { ColorField } from '../../src/components/color-field/color-field.js';
import { Combobox, type ComboboxItem } from '../../src/components/combobox/combobox.js';
import { DateTimeField } from '../../src/components/date-time-field/date-time-field.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';

import { Menubar, MenubarMenu } from '../../src/components/menubar/menubar.js';
import type { MenuEntry } from '../../src/components/menu/menu.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Radio, RadioGroup } from '../../src/components/radio-group/radio-group.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  SelectField,
  type SelectFieldOption,
} from '../../src/components/select-field/select-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TagsInput } from '../../src/components/tags-input/tags-input.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
const contents = ['short', 'long', 'large type'] as const;
const controls = [
  'button',
  'button-icon',
  'dropdown-menu',
  'segmented-choice',
  'search-field',
  'combobox',
  'menubar',
  'text-field',
  'select-field',
  'number-field',
  'date-time-field',
  'color-field',
  'tags-input',
  'boolean-field',
  'checkbox',
  'checkbox-group',
  'switch',
  'radio-group',
] as const;

type Control = (typeof controls)[number];

interface CellProps {
  size: ControlSize;
  isLong: boolean;
}

const entries: MenuEntry[] = [
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
];

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];

const options = (isLong: boolean): SelectFieldOption[] => [
  { id: 'apple', label: isLong ? 'Apple, crisp and sweet' : 'Apple' },
  { id: 'pear', label: 'Pear' },
];

const cells: Record<Control, (props: CellProps) => ReactNode> = {
  button: ({ size, isLong }) => (
    <Button size={size} startIcon="plus" endIcon={isLong ? 'chevron-down' : undefined}>
      {isLong ? 'Save every change' : 'Save'}
    </Button>
  ),
  'button-icon': ({ size, isLong }) => (
    <Button
      variant="secondary"
      size={size}
      icon={isLong ? 'more-vertical' : 'plus'}
      label={isLong ? 'More editing actions' : 'Add'}
    />
  ),
  'dropdown-menu': ({ size, isLong }) => (
    <DropdownMenu size={size} label={isLong ? 'More editing actions' : 'Edit'} items={entries} />
  ),
  'segmented-choice': ({ size, isLong }) => (
    <SegmentedChoice
      size={size}
      aria-label="View"
      defaultValue="day"
      options={[
        { value: 'day', label: isLong ? 'One day at a time' : 'Day' },
        { value: 'week', label: 'Week' },
      ]}
    />
  ),
  'search-field': ({ size, isLong }) => (
    <SearchField size={size} label="Search" defaultValue={isLong ? 'A long query, typed' : 'Fig'} />
  ),
  combobox: ({ size, isLong }) => (
    <Combobox
      size={size}
      aria-label="Fruit"
      defaultItems={fruit}
      defaultInputValue={isLong ? 'A long typed value' : 'Fig'}
    />
  ),
  menubar: ({ size, isLong }) => (
    <Menubar aria-label="Editor" size={size}>
      <MenubarMenu label={isLong ? 'Preferences' : 'File'} items={entries} />
      <MenubarMenu label="Edit" items={entries} />
    </Menubar>
  ),
  'text-field': ({ size, isLong }) => (
    <TextField
      size={size}
      label="Name"
      labelLayout="control-only"
      defaultValue={isLong ? 'A value much longer than the box is wide' : 'Ada'}
    />
  ),
  'select-field': ({ size, isLong }) => (
    <SelectField
      size={size}
      label="Fruit"
      labelLayout="control-only"
      options={options(isLong)}
      defaultValue="apple"
    />
  ),
  'number-field': ({ size, isLong }) => (
    <NumberField
      size={size}
      label="Count"
      labelLayout="control-only"
      defaultValue={isLong ? 1234567.89 : 4}
    />
  ),
  'date-time-field': ({ size, isLong }) => (
    <DateTimeField
      size={size}
      label="Due"
      labelLayout="control-only"
      mode={isLong ? 'date-time' : 'date'}
      defaultValue={isLong ? '2026-04-13T09:30' : '2026-04-13'}
    />
  ),
  'color-field': ({ size, isLong }) => (
    <ColorField
      size={size}
      label="Accent"
      labelLayout="control-only"
      defaultValue={isLong ? '#2e8b5780' : '#2e8b57'}
    />
  ),
  'tags-input': ({ size, isLong }) => (
    <TagsInput
      size={size}
      label="Fruit"
      labelLayout="control-only"
      defaultValue={isLong ? ['Apple', 'Pear'] : ['Fig']}
    />
  ),
  'boolean-field': ({ size, isLong }) => (
    <BooleanField
      size={size}
      label="Ripe"
      labelLayout="control-only"
      variant="toggle-button"
      trueLabel={isLong ? 'Ripe and ready' : 'Ripe'}
      falseLabel="Raw"
      defaultValue
    />
  ),
  checkbox: ({ size, isLong }) => (
    <Checkbox size={size} defaultSelected>
      {isLong ? 'Remember this choice' : 'Ripe'}
    </Checkbox>
  ),
  'checkbox-group': ({ size, isLong }) => (
    <CheckboxGroup
      size={size}
      label="Fruit"
      labelLayout="control-only"
      defaultValue={['apple']}
      options={[
        { value: 'apple', label: isLong ? 'Apple, crisp and sweet' : 'Apple' },
        { value: 'pear', label: isLong ? 'Pear, soft and juicy' : 'Pear' },
        { value: 'fig', label: 'Fig' },
      ]}
    />
  ),
  switch: ({ size, isLong }) => (
    <Switch size={size} defaultSelected>
      {isLong ? 'Show every hidden column' : 'Wrap'}
    </Switch>
  ),
  'radio-group': ({ size, isLong }) => (
    <RadioGroup size={size} label="Fruit" labelLayout="control-only" defaultValue="apple">
      <Radio value="apple">{isLong ? 'Apple, crisp and sweet' : 'Apple'}</Radio>
      <Radio value="pear">{isLong ? 'Pear, soft and juicy' : 'Pear'}</Radio>
      <Radio value="fig">Fig</Radio>
    </RadioGroup>
  ),
};

mountLab(
  <>
    <LabSection
      title="Every control at every size"
      description="Compare xs (20), sm (24), md (28) and lg (32 pixels) across each row. Long content changes labels, not height; icon buttons keep a square frame and put their label in a tooltip. Large type enlarges the Aa sample around each control to 24 pixels with double line height; the control keeps its own type and size."
    >
      <StateMatrix
        axes={{ control: controls, content: contents, size: sizes }}
        render={({ control, content, size }) => {
          const Cell = cells[control];
          return (
            <div
              data-lab-control-sample={content}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                ...(content === 'large type' ? { fontSize: 24, lineHeight: 2 } : {}),
              }}
            >
              <span aria-hidden="true">Aa</span>
              <Cell size={size} isLong={content === 'long'} />
            </div>
          );
        }}
      />
    </LabSection>
  </>,
);
