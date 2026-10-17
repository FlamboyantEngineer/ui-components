import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FieldScopeContext, type FieldScope } from './field-scope.js';
import { useFieldState, type FieldIssue, type FieldStateOptions } from './field-state.js';

function renderField<T>(options: FieldStateOptions<T>, scope: FieldScope = {}) {
  return renderHook((props: FieldStateOptions<T>) => useFieldState(props), {
    initialProps: options,
    wrapper: ({ children }: { children: ReactNode }) => (
      <FieldScopeContext.Provider value={scope}>{children}</FieldScopeContext.Provider>
    ),
  });
}

const tooShort: FieldIssue = { severity: 'error', message: 'Too short.', validity: 'tooShort' };
const noDigit: FieldIssue = { severity: 'error', message: 'Add a digit.', validity: 'customError' };
const common: FieldIssue = { severity: 'warning', message: 'A common word.' };

describe('field validation', () => {
  it('UIC-FIELD-3.5 lists every issue, errors first, and shows the first error', () => {
    const { result, rerender } = renderField<string>({
      defaultValue: 'pear',
      validate: () => [common, tooShort, noDigit],
    });
    expect(result.current.validation).toEqual({ status: 'invalid', message: 'Too short.' });
    expect(result.current.issues).toEqual([tooShort, noDigit, common]);
    rerender({ defaultValue: 'pear', validate: () => [common] });
    expect(result.current.validation).toEqual({ status: 'warning', message: 'A common word.' });
    expect(result.current.issues).toEqual([common]);
    rerender({ defaultValue: 'pear', validate: () => null });
    expect(result.current.issues).toEqual([]);
  });

  it('UIC-FIELD-3.5 tags a missing required value as valueMissing', () => {
    const { result } = renderField<string>({ defaultValue: '', isRequired: true });
    expect(result.current.issues).toEqual([
      { severity: 'error', message: 'A value is required.', validity: 'valueMissing' },
    ]);
  });

  it('UIC-FIELD-3.7 shows validation from the start in the immediate mode', () => {
    const { result } = renderField<string>({ defaultValue: '', isRequired: true });
    expect(result.current.validation.status).toBe('invalid');
    expect(result.current.realtimeValidation.status).toBe('invalid');
  });

  it('UIC-FIELD-3.7 waits for an edit in the change mode', () => {
    const { result } = renderField<string>({
      defaultValue: '',
      isRequired: true,
      validationMode: 'change',
    });
    expect(result.current.validation).toEqual({ status: 'valid' });
    expect(result.current.issues).toEqual([]);
    expect(result.current.realtimeValidation.status).toBe('invalid');
    act(() => result.current.setValue('a'));
    act(() => result.current.setValue(''));
    expect(result.current.validation.status).toBe('invalid');
  });

  it('UIC-FIELD-3.7 waits for focus to leave in the blur mode', () => {
    const { result } = renderField<string>({
      defaultValue: '',
      isRequired: true,
      validationMode: 'blur',
    });
    act(() => result.current.setValue('a'));
    act(() => result.current.setValue(''));
    expect(result.current.validation.status).toBe('valid');
    expect(result.current.isTouched).toBe(false);
    act(() => result.current.touch());
    expect(result.current.isTouched).toBe(true);
    expect(result.current.validation.status).toBe('invalid');
  });

  it('UIC-FIELD-3.7 waits for a submit in the submit mode, then follows the value', () => {
    const { result } = renderField<string>(
      { defaultValue: '', isRequired: true },
      {
        validationMode: 'submit',
      },
    );
    act(() => result.current.touch());
    expect(result.current.validation.status).toBe('valid');
    act(() => result.current.revealValidation());
    expect(result.current.validation.status).toBe('invalid');
    act(() => result.current.setValue('Fig'));
    expect(result.current.validation.status).toBe('valid');
    act(() => result.current.setValue(''));
    expect(result.current.validation.status).toBe('invalid');
  });

  it('UIC-FIELD-3.7 lets the field mode win over the form mode', () => {
    const { result } = renderField<string>(
      { defaultValue: '', isRequired: true, validationMode: 'immediate' },
      { validationMode: 'submit' },
    );
    expect(result.current.validation.status).toBe('invalid');
  });

  it('UIC-FIELD-3.9 shows external errors for its name until the value changes', () => {
    const errors = { email: ['Already taken.', 'Use a work address.'], other: 'Elsewhere.' };
    const scope: FieldScope = { validationErrors: errors, validationMode: 'submit' };
    const { result } = renderField<string>(
      { name: 'email', defaultValue: 'ada@example.com' },
      scope,
    );
    expect(result.current.validation).toEqual({ status: 'invalid', message: 'Already taken.' });
    expect(result.current.issues.map((issue) => issue.validity)).toEqual([
      'customError',
      'customError',
    ]);
    act(() => result.current.setValue('ada@example.org'));
    expect(result.current.validation.status).toBe('valid');
    act(() => result.current.setValue('ada@example.com'));
    expect(result.current.validation.status).toBe('valid');
  });

  it('UIC-FIELD-3.9 shows a new errors object again and ignores other names', () => {
    let scope: FieldScope = { validationErrors: { email: 'Taken.' } };
    const { result, rerender } = renderHook(() => useFieldState<string>({ name: 'email' }), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <FieldScopeContext.Provider value={scope}>{children}</FieldScopeContext.Provider>
      ),
    });
    act(() => result.current.setValue('b'));
    expect(result.current.validation.status).toBe('valid');
    scope = { validationErrors: { email: 'Taken.' } };
    rerender();
    expect(result.current.validation.message).toBe('Taken.');
    scope = { validationErrors: { city: 'Unknown.' } };
    rerender();
    expect(result.current.validation.status).toBe('valid');
  });

  it('UIC-FIELD-10.2 disables a field inside a disabled scope', () => {
    const { result } = renderField<string>({ defaultValue: 'Fig' }, { isDisabled: true });
    expect(result.current.isDisabled).toBe(true);
    act(() => result.current.setValue('Kiwi'));
    expect(result.current.value).toBe('Fig');
  });
});
