import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Input } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Field,
  FieldScopeContext,
  toAriaControlProps,
  useFieldControl,
  type FieldControlProps,
  type FieldInputProps,
  type FieldState,
} from './field.js';

interface SampleProps extends FieldInputProps<string> {
  /** The control's own option. */
  placeholder?: string;
  onParts?: (parts: { state: FieldState<string>; rest: object }) => void;
}

/** A control built the way every field control is: the helper splits its props. */
function Sample({ onParts, ...props }: SampleProps) {
  const { state, field, rest } = useFieldControl(props, {
    initialValue: '',
    emptyValue: '-',
    check: (value) => (value === 'Stone' ? { severity: 'error', message: 'Not a fruit.' } : null),
  });
  onParts?.({ state, rest });
  return (
    <Field {...field} state={state}>
      {(control) => (
        <Input
          {...control}
          {...rest}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
          onBlur={() => state.commit()}
        />
      )}
    </Field>
  );
}

function controlProps(overrides: Partial<FieldControlProps>): FieldControlProps {
  return {
    id: 'fruit-control',
    ref: () => {},
    'aria-label': undefined,
    'aria-labelledby': 'fruit-label',
    'aria-describedby': 'fruit-description',
    'aria-errormessage': undefined,
    'aria-invalid': undefined,
    'aria-required': undefined,
    readOnly: false,
    disabled: false,
    ...overrides,
  };
}

describe('useFieldControl', () => {
  it('UIC-FIELD-8.1 splits the field, state and control props', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    let parts: { state: FieldState<string>; rest: object } | undefined;
    const { container } = render(
      <Sample
        id="fruit"
        label="Fruit"
        description="Pick one."
        className="extra"
        data-test="sample"
        placeholder="Apple"
        onCommit={onCommit}
        onParts={(next) => (parts = next)}
      />,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveAttribute('id', 'fruit');
    expect(root).toHaveClass('ui-field', 'extra');
    expect(root).toHaveAttribute('data-test', 'sample');
    expect(parts?.rest).toEqual({ placeholder: 'Apple' });
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveAttribute('placeholder', 'Apple');
    expect(input).toHaveAccessibleDescription('Pick one.');
    await user.type(input, 'Fig');
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith('Fig');
    expectHooksMatchSpec(container, 'FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-FIELD-8.1 starts at the initial value and clears to the control empty value', () => {
    let parts: { state: FieldState<string>; rest: object } | undefined;
    render(<Sample label="Fruit" onParts={(next) => (parts = next)} />);
    expect(parts?.state.value).toBe('');
    expect(parts?.state.canSetDefault).toBe(false);
    const { unmount } = render(
      <Sample label="Fruit" defaultValue="Fig" onParts={(next) => (parts = next)} />,
    );
    expect(parts?.state.value).toBe('Fig');
    act(() => parts?.state.clear());
    expect(parts?.state.value).toBe('-');
    unmount();
    render(
      <Sample label="Fruit" defaultValue="Fig" emptyValue="" onParts={(next) => (parts = next)} />,
    );
    act(() => parts?.state.clear());
    expect(parts?.state.value).toBe('');
  });

  it('UIC-FIELD-8.1 gives the form name to both the field state and the control', () => {
    let parts: { state: FieldState<string>; rest: object } | undefined;
    render(
      <FieldScopeContext.Provider value={{ validationErrors: { fruit: 'Sold out.' } }}>
        <Sample label="Fruit" name="fruit" onParts={(next) => (parts = next)} />
      </FieldScopeContext.Provider>,
    );
    expect(parts?.rest).toEqual({ name: 'fruit' });
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'fruit');
    expect(parts?.state.validation.message).toBe('Sold out.');
  });

  it('UIC-FIELD-8.1 runs the control check before the caller validate', () => {
    const validate = vi.fn((value: string) =>
      value.length > 3 ? { severity: 'warning' as const, message: 'Long.' } : null,
    );
    const { rerender } = render(<Sample label="Fruit" value="Stone" validate={validate} />);
    expect(screen.getByText('Not a fruit.')).toBeInTheDocument();
    expect(validate).not.toHaveBeenCalledWith('Stone');
    rerender(<Sample label="Fruit" value="Melon" validate={validate} />);
    expect(screen.getByText('Long.')).toBeInTheDocument();
  });
});

describe('toAriaControlProps', () => {
  it('UIC-FIELD-8.2 maps the control props to React Aria props', () => {
    expect(toAriaControlProps(controlProps({}))).toEqual({
      id: 'fruit-control',
      'aria-label': undefined,
      'aria-labelledby': 'fruit-label',
      'aria-describedby': 'fruit-description',
      'aria-errormessage': undefined,
      isInvalid: false,
      isRequired: false,
      isReadOnly: false,
      isDisabled: false,
      validationBehavior: 'aria',
    });
    expect(
      toAriaControlProps(
        controlProps({
          'aria-invalid': true,
          'aria-required': true,
          'aria-errormessage': 'fruit-message',
          readOnly: true,
          disabled: true,
        }),
      ),
    ).toMatchObject({
      'aria-errormessage': 'fruit-message',
      isInvalid: true,
      isRequired: true,
      isReadOnly: true,
      isDisabled: true,
    });
  });
});
