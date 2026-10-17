import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Checkbox, cycleCheckState } from './checkbox.js';

function ThreeState() {
  const [value, setValue] = useState<boolean | null>(null);
  return (
    <Checkbox
      isSelected={value === true}
      isIndeterminate={value === null}
      onChange={() => setValue(cycleCheckState(value))}
    >
      Repeat header
    </Checkbox>
  );
}

describe('Checkbox', () => {
  it('UIC-CHECKBOX-1.1 draws a box around a hidden native input and its label', () => {
    const { container, rerender } = render(<Checkbox>Match case</Checkbox>);
    const root = container.querySelector('label.ui-checkbox');
    const input = screen.getByRole('checkbox', { name: 'Match case' });
    expect(root).toContainElement(input);
    expect(container.querySelector('.ui-checkbox__box')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ui-checkbox__label')).toHaveTextContent('Match case');
    expect(container.querySelector('.ui-checkbox__glyph')).toBeNull();
    rerender(<Checkbox isSelected>Match case</Checkbox>);
    expect(container.querySelector('.ui-checkbox__glyph')).toHaveAttribute('data-glyph', 'check');
    rerender(<Checkbox isIndeterminate>Match case</Checkbox>);
    expect(container.querySelector('.ui-checkbox__glyph')).toHaveAttribute('data-glyph', 'minus');
    expectHooksMatchSpec(container, 'CHECKBOX', { slots: 'all' });
  });

  it('UIC-CHECKBOX-1.2 toggles from the box, the label and Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Checkbox onChange={onChange}>Whole word</Checkbox>);
    const input = screen.getByRole('checkbox');
    await user.click(container.querySelector('.ui-checkbox__box') as Element);
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByText('Whole word'));
    expect(onChange).toHaveBeenLastCalledWith(false);
    input.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(input).toBeChecked();
  });

  it('UIC-CHECKBOX-1.2 keeps its state while read-only and leaves the focus order while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox isReadOnly isSelected onChange={onChange}>
        Archived
      </Checkbox>,
    );
    await user.click(screen.getByText('Archived'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-readonly', 'true');
    rerender(
      <Checkbox isDisabled onChange={onChange}>
        Archived
      </Checkbox>,
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
    await user.tab();
    expect(screen.getByRole('checkbox')).not.toHaveFocus();
  });

  it('UIC-CHECKBOX-1.3 is named, carries the id and reports mixed and invalid states', () => {
    const { container } = render(
      <>
        <Checkbox id="alone" aria-label="Select row" isIndeterminate />
        <Checkbox isInvalid isRequired>
          Accept
        </Checkbox>
      </>,
    );
    const alone = screen.getByRole('checkbox', { name: 'Select row' });
    expect(alone).toHaveAttribute('id', 'alone');
    expect(alone).toBePartiallyChecked();
    const accept = screen.getByRole('checkbox', { name: 'Accept' });
    expect(accept).toHaveAttribute('aria-invalid', 'true');
    expect(accept.closest('.ui-checkbox')).toHaveAttribute('data-invalid', 'true');
    expect(accept.closest('.ui-checkbox')).toHaveAttribute('data-required', 'true');
    expectHooksMatchSpec(container, 'CHECKBOX');
  });

  it('UIC-CHECKBOX-1.3 publishes keyboard focus on its root', async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox>Focus me</Checkbox>);
    await user.tab();
    expect(container.querySelector('.ui-checkbox')).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(container, 'CHECKBOX');
  });

  it('UIC-CHECKBOX-1.4 forwards the class name and data attributes to its root', () => {
    const { container } = render(
      <Checkbox className="dense" data-test="option">
        Option
      </Checkbox>,
    );
    const root = container.querySelector('.ui-checkbox');
    expect(root).toHaveClass('ui-checkbox', 'dense');
    expect(root).toHaveAttribute('data-test', 'option');
    expectHooksMatchSpec(container, 'CHECKBOX', { callerAttributes: ['data-test'] });
  });

  it('UIC-CHECKBOX-2.1 cycles unset, ticked and empty', async () => {
    expect(cycleCheckState(null)).toBe(true);
    expect(cycleCheckState(true)).toBe(false);
    expect(cycleCheckState(false)).toBe(null);
    const user = userEvent.setup();
    render(<ThreeState />);
    const input = screen.getByRole('checkbox', { name: 'Repeat header' });
    expect(input).toBePartiallyChecked();
    await user.click(input);
    expect(input).toBeChecked();
    await user.click(input);
    expect(input).not.toBeChecked();
    expect(input).not.toBePartiallyChecked();
    await user.click(input);
    expect(input).toBePartiallyChecked();
  });
});
