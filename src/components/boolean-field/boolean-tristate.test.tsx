import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BooleanField } from './boolean-field.js';

describe('explicit tri-state fields', () => {
  it('UIC-BOOLEAN-FIELD-3.5 shows three selectable segments and keeps unset selected on repeat presses', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BooleanField
        label="Ripe"
        variant="segmented"
        allowsUnset
        unsetLabel="Inherited"
        onChange={onChange}
      />,
    );
    const unset = screen.getByRole('radio', { name: 'Inherited' });
    expect(unset).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    await user.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).toHaveBeenLastCalledWith(false);
    await user.click(unset);
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.click(unset);
    expect(unset).toBeChecked();
  });
  it('UIC-BOOLEAN-FIELD-3.5 publishes an explicit mixed hook on switch and toggle-button', () => {
    const { container, rerender } = render(
      <BooleanField label="Ripe" variant="switch" allowsUnset />,
    );
    expect(screen.getByRole('switch').closest('.ui-boolean-field__switch')).toHaveAttribute(
      'data-indeterminate',
      'true',
    );
    expect(screen.getByText('Unset')).toHaveClass('ui-switch__label');
    rerender(<BooleanField label="Ripe" variant="toggle-button" allowsUnset />);
    expect(container.querySelector('.ui-boolean-field__toggle-button')).toHaveAttribute(
      'data-indeterminate',
      'true',
    );
  });
});
