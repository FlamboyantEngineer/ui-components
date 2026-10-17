import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Input } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { Field, useFieldControl, type FieldValueProps } from './field.js';

interface ProbeFieldProps extends FieldValueProps<string> {
  placeholder?: string;
  onOwn?: (own: object) => void;
}

/** A control built the way every field control is: split props, then render `Field`. */
function ProbeField(props: ProbeFieldProps) {
  const { state, field, own } = useFieldControl<string, ProbeFieldProps>(props);
  props.onOwn?.(own);
  return (
    <Field {...field} state={state}>
      {(control) => (
        <Input
          {...control}
          placeholder={own.placeholder}
          value={state.value ?? ''}
          onChange={(event) => state.setValue(event.target.value)}
          onBlur={() => state.commit()}
        />
      )}
    </Field>
  );
}

describe('useFieldControl', () => {
  it('UIC-FIELD-9.1 splits field, state and own props and creates the state', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onOwn = vi.fn();
    const { container } = render(
      <ProbeField
        label="Fruit"
        id="fruit"
        className="caller"
        data-testid="probe"
        description="Pick one."
        defaultValue="Apple"
        isRequired
        onCommit={onCommit}
        placeholder="Type a fruit"
        onOwn={onOwn}
      />,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveClass('caller');
    expect(root).toHaveAttribute('id', 'fruit');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-required', 'true');
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveAttribute('placeholder', 'Type a fruit');
    expect(input).toHaveAccessibleDescription('Pick one.');
    expect(Object.keys(onOwn.mock.calls[0]?.[0] as object).sort()).toEqual([
      'onOwn',
      'placeholder',
    ]);
    await user.clear(input);
    await user.type(input, 'Pear');
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith('Pear');
  });
});
