import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFieldControl, type FieldInputProps } from './field-control.js';

interface SampleProps extends FieldInputProps<string> {
  rows?: number;
}

function renderControl(
  props: SampleProps,
  check?: (value: string) => null | { severity: 'error'; message: string },
) {
  return renderHook(() =>
    useFieldControl<string, SampleProps>(props, { initialValue: '', emptyValue: '', check }),
  );
}

describe('useFieldControl', () => {
  it('UIC-FIELD-8.1 splits control props into field state, field layout and own props', () => {
    const { result } = renderControl({
      label: 'Fruit',
      description: 'Pick one.',
      className: 'caller',
      id: 'fruit',
      'data-testid': 'probe',
      committedValue: 'Fig',
      isRequired: true,
      rows: 4,
    });
    expect(result.current.field).toEqual({
      label: 'Fruit',
      description: 'Pick one.',
      className: 'caller',
      id: 'fruit',
      'data-testid': 'probe',
    });
    expect(result.current.rest).toEqual({ rows: 4 });
    expect(result.current.state.value).toBe('Fig');
    expect(result.current.state.isRequired).toBe(true);
  });

  it('UIC-FIELD-8.1 starts at the initial value and clears to the empty value by default', () => {
    const { result } = renderControl({ label: 'Fruit', committedValue: 'Fig' });
    expect(result.current.state.canSetDefault).toBe(true);
    expect(result.current.state.canClear).toBe(true);
    const fresh = renderControl({ label: 'Fruit' });
    expect(fresh.result.current.state.value).toBe('');
  });

  it("UIC-FIELD-8.1 runs the control's own check before the caller's validate", () => {
    const check = (value: string) =>
      value === 'Stone' ? { severity: 'error' as const, message: 'Not a fruit.' } : null;
    const validate = (value: string) =>
      value.length > 3 ? { severity: 'warning' as const, message: 'Long name.' } : null;
    const stone = renderControl({ label: 'Fruit', defaultValue: 'Stone', validate }, check);
    expect(stone.result.current.state.validation).toEqual({
      status: 'invalid',
      message: 'Not a fruit.',
    });
    const mango = renderControl({ label: 'Fruit', defaultValue: 'Mango', validate }, check);
    expect(mango.result.current.state.validation).toEqual({
      status: 'warning',
      message: 'Long name.',
    });
  });
});
