import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import type { Key } from '../../core/props.js';
import { SelectField, type SelectFieldItem, type SelectFieldOption } from './select-field.js';

const mixed: SelectFieldOption = {
  id: 'pear',
  label: 'Pear',
  description: 'Crisp and sweet',
  isIndeterminate: true,
};
const grouped: SelectFieldItem[] = [{ id: 'fruit', label: 'Fruit', options: [mixed] }];

describe('SelectField mixed membership', () => {
  it('UIC-SELECT-FIELD-3.4 keeps native callbacks, filtering, keyboard toggles and chips', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<Key[]>([]);
      return (
        <SelectField
          label="Produce"
          options={grouped}
          selectionMode="multiple"
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
          onCommit={onCommit}
          filterable
        />
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: /Produce$/ }));
    await user.type(screen.getByRole('searchbox'), 'crisp');
    const pear = screen.getByRole('option', { name: 'Pear Crisp and sweet' });
    const indicator = pear.querySelector('.ui-select-field__option-check');
    expect(indicator).toHaveAttribute('data-indeterminate', 'true');
    expect(pear).toHaveAccessibleDescription('Selected for some records');
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['option-check'] });
    await user.click(pear);
    expect(onChange).toHaveBeenLastCalledWith(['pear']);
    expect(onCommit).toHaveBeenLastCalledWith(['pear']);
    expect(pear).toHaveAttribute('aria-selected', 'true');
    expect(indicator).not.toHaveAttribute('data-indeterminate');
    expect(indicator?.querySelector('[data-glyph="check"]')).not.toBeNull();
    expect(pear).not.toHaveAccessibleDescription();
    expect(
      screen.getByText('Pear', { selector: '.ui-select-field__chip-label' }),
    ).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(onCommit).toHaveBeenLastCalledWith([]);
    expect(pear).toHaveAttribute('aria-selected', 'false');
    expect(indicator).toHaveAttribute('data-indeterminate', 'true');
    expect(pear).toHaveAccessibleDescription('Selected for some records');
    expect(screen.getByRole('listbox')).toBeVisible();
  });

  it('UIC-SELECT-FIELD-3.4 updates mixed metadata for the same grouped key while open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SelectField label="Produce" selectionMode="multiple" options={grouped} />,
    );
    await user.click(screen.getByRole('button', { name: /Produce$/ }));
    expect(screen.getByRole('option')).toHaveAccessibleDescription('Selected for some records');
    rerender(
      <SelectField
        label="Produce"
        selectionMode="multiple"
        options={[{ id: 'fruit', label: 'Fruit', options: [{ ...mixed, isIndeterminate: false }] }]}
      />,
    );
    const pear = screen.getByRole('option', { name: 'Pear Crisp and sweet' });
    expect(pear).not.toHaveAccessibleDescription();
    expect(pear.querySelector('.ui-select-field__option-check')).not.toHaveAttribute(
      'data-indeterminate',
    );
    expect(pear.querySelector('[data-glyph="minus"]')).toBeNull();
  });

  it('UIC-SELECT-FIELD-3.4 preserves a custom renderer and localizes the mixed explanation', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider messages={{ selectOptionIndeterminate: 'Partly selected' }}>
        <SelectField
          label="Produce"
          selectionMode="multiple"
          options={[mixed]}
          renderOption={(option) => <strong>{option.label} choice</strong>}
        />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Produce$/ }));
    const pear = screen.getByRole('option', { name: 'Pear choice' });
    expect(pear).toHaveAccessibleDescription('Partly selected');
    expect(
      pear.querySelector('.ui-select-field__option-check [data-glyph="minus"]'),
    ).not.toBeNull();
  });

  it('UIC-SELECT-FIELD-3.4 leaves disabled mixed options and limits under ordinary selection rules', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectField
        label="Produce"
        selectionMode="multiple"
        maxValues={1}
        defaultValue={['apple']}
        options={[
          { id: 'apple', label: 'Apple' },
          mixed,
          { id: 'fig', label: 'Fig', isIndeterminate: true, isDisabled: true },
        ]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Produce$/ }));
    const pear = screen.getByRole('option', { name: 'Pear Crisp and sweet' });
    const fig = screen.getByRole('option', { name: 'Fig' });
    expect(pear).toHaveAttribute('aria-disabled', 'true');
    expect(fig).toHaveAccessibleDescription('Selected for some records');
    await user.click(pear);
    await user.click(fig);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(pear).not.toHaveAttribute('aria-disabled');
    expect(fig).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{ArrowDown}');
    expect(pear).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['pear']);
  });

  it('UIC-SELECT-FIELD-3.4 ignores mixed metadata in single selects', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Produce" options={[mixed]} defaultValue="pear" />);
    await user.click(screen.getByRole('button', { name: 'Pear Produce' }));
    const pear = screen.getByRole('option', { name: 'Pear Crisp and sweet' });
    expect(pear).toHaveAttribute('aria-selected', 'true');
    expect(pear).not.toHaveAccessibleDescription();
    expect(pear.querySelector('.ui-select-field__option-check')).toBeNull();
    expect(pear.querySelector('[data-glyph="minus"]')).toBeNull();
    await user.click(pear);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.4 keeps mixed metadata on loaded options', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Produce"
        selectionMode="multiple"
        options={[]}
        loadOptions={async () => [mixed]}
        minSearchLength={0}
        searchDelay={0}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Produce$/ }));
    const pear = await screen.findByRole('option', { name: 'Pear Crisp and sweet' });
    expect(pear).toHaveAccessibleDescription('Selected for some records');
    expect(pear.querySelector('.ui-select-field__option-check')).toHaveAttribute(
      'data-indeterminate',
      'true',
    );
  });
});
