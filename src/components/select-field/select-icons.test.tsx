import { CheckGlyph, InfoGlyph, PlusGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const symbols: SelectFieldOption[] = [
  { id: 'star', label: 'Star', icon: <svg aria-label="Star glyph" /> },
  { id: 'check', label: 'Check', icon: CheckGlyph },
  { id: 'info', label: 'Info', icon: InfoGlyph },
];

const many: SelectFieldOption[] = Array.from({ length: 14 }, (_, index) => ({
  id: `symbol-${index}`,
  label: `Symbol ${index}`,
  icon: PlusGlyph,
}));

describe('SelectField', () => {
  it('UIC-SELECT-FIELD-11.1 shows the chosen icon in the trigger and icons on every option', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectField label="Symbol" options={symbols} defaultValue="check" />,
    );
    const trigger = screen.getByRole('button', { name: 'Check Symbol' });
    expect(trigger.querySelector('.ui-select-field__value-icon')).toHaveAttribute(
      'data-glyph',
      'check',
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute(
      'data-selection-mode',
      'single',
    );
    await user.click(trigger);
    const icons = screen
      .getAllByRole('option')
      .map((option) => option.querySelector('.ui-select-field__option-icon'));
    expect(icons.every(Boolean)).toBe(true);
    expect(
      screen.getByLabelText('Star glyph').closest('.ui-select-field__option-icon'),
    ).not.toBeNull();
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-multiselectable');
  });

  it('UIC-SELECT-FIELD-11.2 honors explicit filter preferences for icon choices', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SelectField label="Symbol" options={many} filterable={false} />);
    await user.click(screen.getByRole('button', { name: /Symbol$/ }));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    unmount();
    render(<SelectField label="Symbol" options={many} filterable />);
    await user.click(screen.getByRole('button', { name: /Symbol$/ }));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-11.3 keeps a no-icon choice that commits null', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Symbol"
        options={symbols}
        defaultValue="star"
        emptyLabel="No icon"
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Star Symbol' }));
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('No icon');
    await user.click(screen.getByRole('option', { name: 'No icon' }));
    expect(onCommit).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: 'No icon Symbol' })).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-11.4 adds its root hook before the caller class', () => {
    const { container } = render(
      <SelectField label="Symbol" options={symbols} className="caller" data-testid="probe" />,
    );
    const root = container.querySelector('.ui-field');
    expect(root?.className).toBe('ui-field ui-select-field caller');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'SELECT-FIELD', { callerAttributes: ['data-testid'] });
  });

  it('UIC-SELECT-FIELD-11.4 passes the select field options through, such as a clear button', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Symbol"
        options={symbols}
        defaultValue="star"
        isClearable
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear Symbol' }));
    expect(onCommit).toHaveBeenCalledWith(null);
  });
});
