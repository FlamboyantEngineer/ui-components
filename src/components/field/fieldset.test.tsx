import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { ColorSwatchPicker, ColorSwatchPickerItem } from '../color-swatch/color-swatch-picker.js';
import { Combobox } from '../combobox/combobox.js';
import { GridSizePicker } from '../grid-size-picker/grid-size-picker.js';
import { InlineEdit } from '../inline-edit/inline-edit.js';
import { SearchField } from '../search-field/search-field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { Switch } from '../switch/switch.js';
import { Fieldset } from './fieldset.js';

describe('Fieldset', () => {
  it('UIC-FIELD-10.1 draws a zero legend and skips an empty one', () => {
    const { container, rerender } = render(
      <Fieldset legend={0}>
        <TextField label="Street" />
      </Fieldset>,
    );
    expect(screen.getByRole('group', { name: '0' })).toBeInTheDocument();
    rerender(
      <Fieldset legend="">
        <TextField label="Street" />
      </Fieldset>,
    );
    expect(container.querySelector('legend')).toBeNull();
  });

  it('UIC-FIELD-10.1 groups fields under a legend that names the group', () => {
    const { container } = render(
      <Fieldset legend="Delivery" id="delivery" className="wide" data-test="group">
        <TextField label="Street" />
        <TextField label="City" />
      </Fieldset>,
    );
    const group = screen.getByRole('group', { name: 'Delivery' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveClass('ui-fieldset', 'wide');
    expect(group).toHaveAttribute('id', 'delivery');
    expect(group).toHaveAttribute('data-test', 'group');
    expect(container.querySelector('legend')).toHaveClass('ui-fieldset__legend');
    expect(group).not.toHaveAttribute('data-disabled');
    expect(screen.getByRole('textbox', { name: 'City' })).toBeEnabled();
    expectHooksMatchSpec(container, 'FIELD', {
      slots: ['legend'],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-FIELD-10.2 disables the library controls outside the field base too', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <Fieldset legend="Settings" isDisabled>
        <Checkbox>Notify</Checkbox>
        <Switch>Dark</Switch>
        <SegmentedChoice
          aria-label="View"
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />
        <Combobox label="Fruit" defaultItems={[{ id: 1, label: 'Apple' }]} />
        <SearchField label="Search" />
        <InlineEdit label="Title" value="Rye loaf" onSave={() => {}} />
        <GridSizePicker onSelect={onSelect} />
        <ColorSwatchPicker aria-label="Colours" onChange={onChange}>
          <ColorSwatchPickerItem color="#ff0000" />
        </ColorSwatchPicker>
      </Fieldset>,
    );
    for (const name of [
      'checkbox',
      'switch',
      'segmented-choice',
      'combobox',
      'search-field',
      'inline-edit',
      'grid-size-picker',
      'color-swatch-picker__item',
    ]) {
      const element = container.querySelector(`.ui-${name}`);
      expect(element, name).toHaveAttribute('data-disabled', 'true');
    }
    await user.click(screen.getAllByRole('gridcell')[0] as HTMLElement);
    await user.click(screen.getByRole('option'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-FIELD-10.2 disables every field inside, nested groups included', () => {
    const { container } = render(
      <Fieldset legend="Payment" isDisabled>
        <TextField label="Card holder" options={{ committedValue: 'Ada', value: 'Grace' }} />
        <Fieldset legend="Billing">
          <TextField label="Postcode" />
          <button type="button">Look up</button>
        </Fieldset>
      </Fieldset>,
    );
    const [outer, inner] = container.querySelectorAll('fieldset');
    expect(outer).toBeDisabled();
    expect(outer).toHaveAttribute('data-disabled', 'true');
    expect(inner).toHaveAttribute('data-disabled', 'true');
    const holder = screen.getByRole('textbox', { name: 'Card holder' });
    expect(holder).toBeDisabled();
    expect(holder.closest('.ui-field')).toHaveAttribute('data-disabled', 'true');
    expect(holder.closest('.ui-field')).not.toHaveAttribute('data-dirty');
    expect(screen.getByRole('textbox', { name: 'Postcode' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Look up' })).toBeDisabled();
    expectHooksMatchSpec(container, 'FIELD');
  });
});
