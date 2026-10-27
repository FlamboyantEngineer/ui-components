import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { useFieldState, type FieldStateOptions } from './field-state.js';

function renderField<T>(options: FieldStateOptions<T>) {
  return renderHook((props: FieldStateOptions<T>) => useFieldState(props), {
    initialProps: options,
  });
}

describe('useFieldState', () => {
  it('UIC-FIELD-3.11 puts a draft issue first in the realtime validation, keeping the value', () => {
    const onChange = vi.fn();
    const { result } = renderField({
      defaultValue: 'Apple',
      validationMode: 'submit',
      validate: () => ({ severity: 'warning', message: 'Seasonal' }),
      onChange,
    });
    const draft = { severity: 'error' as const, message: 'Finish entering the date.' };
    act(() => result.current.setDraftIssue(draft));
    expect(result.current.realtimeValidation).toEqual({
      status: 'invalid',
      message: 'Finish entering the date.',
    });
    expect(result.current.validation.status).toBe('valid');
    expect(result.current.value).toBe('Apple');
    const shown = result.current;
    act(() => result.current.setDraftIssue({ ...draft }));
    expect(result.current.realtimeValidation).toBe(shown.realtimeValidation);
    act(() => result.current.revealValidation());
    expect(result.current.issues.map((issue) => issue.message)).toEqual([
      'Finish entering the date.',
      'Seasonal',
    ]);
    act(() => result.current.setDraftIssue(null));
    expect(result.current.realtimeValidation.status).toBe('warning');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-FIELD-2.1 holds an uncontrolled value from the committed value, else the default', () => {
    const onChange = vi.fn();
    const { result: fresh } = renderField({ defaultValue: 'Apple', onChange });
    expect(fresh.current.value).toBe('Apple');
    act(() => fresh.current.setValue('Pear'));
    expect(fresh.current.value).toBe('Pear');
    expect(onChange).toHaveBeenCalledWith('Pear');
    const { result: saved } = renderField({ defaultValue: 'Apple', committedValue: 'Plum' });
    expect(saved.current.value).toBe('Plum');
    const { result: nullable } = renderField<string | null>({
      defaultValue: 'Apple',
      committedValue: null,
    });
    expect(nullable.current.value).toBeNull();
  });

  it('UIC-FIELD-2.1 relays a controlled value through onChange', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderField({ value: 'Apple', onChange });
    act(() => result.current.setValue('Pear'));
    expect(onChange).toHaveBeenCalledWith('Pear');
    expect(result.current.value).toBe('Apple');
    rerender({ value: 'Pear', onChange });
    expect(result.current.value).toBe('Pear');
  });

  it('UIC-FIELD-2.2 commits a changed value once and makes it the committed value', () => {
    const onCommit = vi.fn();
    const { result } = renderField({ defaultValue: 'Apple', onCommit });
    act(() => result.current.commit());
    expect(onCommit).not.toHaveBeenCalled();
    act(() => {
      result.current.setValue('Pear');
      result.current.commit();
      result.current.commit();
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('Pear');
    expect(result.current.committedValue).toBe('Pear');
    expect(result.current.isDirty).toBe(false);
  });

  it('UIC-FIELD-2.2 leaves a controlled committed value to the caller', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderField({ value: 'Pear', committedValue: 'Apple', onCommit });
    act(() => result.current.commit());
    expect(onCommit).toHaveBeenCalledWith('Pear');
    expect(result.current.isDirty).toBe(true);
    rerender({ value: 'Pear', committedValue: 'Pear', onCommit });
    expect(result.current.isDirty).toBe(false);
    const { result: controlled } = renderField({ value: 'Fig' });
    expect(controlled.current.committedValue).toBe('Fig');
    expect(controlled.current.isDirty).toBe(false);
  });

  it('UIC-FIELD-2.2 commits the value a controlled caller renders after a change in the same event', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => {
      const [value, setValue] = useState('');
      return useFieldState({ value, onChange: (next) => setValue(next.toUpperCase()), onCommit });
    });
    act(() => {
      result.current.setValue('ab');
      result.current.commit();
    });
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('AB');
    expect(result.current.committedValue).toBe('AB');
    expect(result.current.isDirty).toBe(false);

    const ignored = vi.fn();
    const { result: fixed } = renderField({ value: 'Apple', onCommit: ignored });
    act(() => {
      fixed.current.setValue('Pear');
      fixed.current.commit();
    });
    expect(ignored).not.toHaveBeenCalled();
    expect(fixed.current.committedValue).toBe('Apple');
  });

  it('UIC-FIELD-2.3 compares values by structure', () => {
    const committedValue = { name: 'Ada', tags: ['a', 'b'] };
    const { result, rerender } = renderField({
      value: { tags: ['a', 'b'], name: 'Ada' },
      committedValue,
    });
    expect(result.current.isDirty).toBe(false);
    rerender({ value: { tags: ['b', 'a'], name: 'Ada' }, committedValue });
    expect(result.current.isDirty).toBe(true);
    const { result: dates } = renderField({ value: new Date(0), committedValue: new Date(0) });
    expect(dates.current.isDirty).toBe(false);
  });

  it('UIC-FIELD-2.4 refuses every change while read-only or disabled', () => {
    for (const lock of [{ isReadOnly: true }, { isDisabled: true }]) {
      const onChange = vi.fn();
      const onCommit = vi.fn();
      const { result } = renderField({
        value: 'Pear',
        committedValue: 'Apple',
        defaultValue: 'Fig',
        emptyValue: '',
        onChange,
        onCommit,
        ...lock,
      });
      const state = result.current;
      expect(state.isDirty).toBe(false);
      expect([state.canUndo, state.canRedo, state.canClear, state.canSetDefault]).toEqual([
        false,
        false,
        false,
        false,
      ]);
      act(() => {
        state.setValue('Kiwi');
        state.commit();
        state.restore();
        state.clear();
        state.setToDefault();
        state.undo();
        state.redo();
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
      expect(result.current.isReadOnly || result.current.isDisabled).toBe(true);
    }
  });

  it('UIC-FIELD-2.5 clears to the empty value and sets the default, committing each', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderField({
      defaultValue: 'Apple',
      committedValue: 'Plum',
      emptyValue: '',
      onCommit,
    });
    expect(result.current.canClear).toBe(true);
    expect(result.current.canSetDefault).toBe(true);
    act(() => result.current.clear());
    expect(result.current.value).toBe('');
    expect(onCommit).toHaveBeenLastCalledWith('');
    expect(result.current.canClear).toBe(false);
    act(() => result.current.setToDefault());
    expect(result.current.value).toBe('Apple');
    expect(onCommit).toHaveBeenLastCalledWith('Apple');
    expect(result.current.canSetDefault).toBe(false);
    rerender({ defaultValue: 'Apple', committedValue: 'Plum', emptyValue: '', isRequired: true });
    expect(result.current.canClear).toBe(false);
    act(() => result.current.clear());
    expect(result.current.value).toBe('Apple');
    const { result: bare } = renderField({ value: 'Pear' });
    expect([bare.current.canClear, bare.current.canSetDefault]).toEqual([false, false]);
  });

  it('UIC-FIELD-3.1 decides the status in order: required, error, pending, warning, valid', () => {
    const validate = (value: string[] | string) => {
      if (value === 'bad') return { severity: 'error' as const, message: 'Bad.' };
      if (value === 'odd') return { severity: 'warning' as const, message: 'Odd.' };
      return undefined;
    };
    const status = (options: FieldStateOptions<string[] | string>) =>
      renderField({ validate, ...options }).result.current.validation;
    expect(status({ value: '  ', isRequired: true })).toEqual({
      status: 'invalid',
      message: 'A value is required.',
    });
    expect(status({ value: [], isRequired: true }).status).toBe('invalid');
    expect(status({ value: 'bad', isPending: true })).toEqual({
      status: 'invalid',
      message: 'Bad.',
    });
    expect(status({ value: 'odd', isPending: true })).toEqual({
      status: 'pending',
      message: 'Validating',
    });
    expect(status({ value: 'odd' })).toEqual({ status: 'warning', message: 'Odd.' });
    expect(status({ value: 'fine', isRequired: true })).toEqual({ status: 'valid' });
  });

  it('UIC-FIELD-3.1 takes its messages from the provider strings', () => {
    const { result } = renderHook(() => useFieldState({ value: '', isRequired: true }), {
      wrapper: ({ children }) => (
        <UiProvider messages={{ valueRequired: 'Obligatoire.' }}>{children}</UiProvider>
      ),
    });
    expect(result.current.validation.message).toBe('Obligatoire.');
  });

  it('UIC-FIELD-5.1 undoes and redoes every value the field showed, committing each step', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderField({ defaultValue: 'A', onCommit });
    expect([result.current.canUndo, result.current.canRedo]).toEqual([false, false]);
    act(() => result.current.setValue('AB'));
    act(() => result.current.setValue('ABC'));
    act(() => result.current.undo());
    expect(result.current.value).toBe('AB');
    expect(onCommit).toHaveBeenLastCalledWith('AB');
    act(() => result.current.undo());
    expect(result.current.value).toBe('A');
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.undo());
    expect(result.current.value).toBe('A');
    act(() => result.current.redo());
    expect(result.current.value).toBe('AB');
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.setValue('ABX'));
    expect(result.current.canRedo).toBe(false);
    rerender({ defaultValue: 'A', onCommit });
    act(() => result.current.undo());
    expect(result.current.value).toBe('AB');
  });

  it('UIC-FIELD-5.1 undoes back to a first value that is undefined', () => {
    const { result } = renderField<string | undefined>({});
    act(() => result.current.setValue('a'));
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.undo());
    expect(result.current.value).toBeUndefined();
    expect([result.current.canUndo, result.current.canRedo]).toEqual([false, true]);
    act(() => result.current.redo());
    expect(result.current.value).toBe('a');
  });

  it('UIC-FIELD-5.1 records controlled changes and actions in the history', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState('One');
      return { setValue, field: useFieldState({ value, onChange: setValue, emptyValue: '' }) };
    });
    act(() => result.current.setValue('Two'));
    expect(result.current.field.canUndo).toBe(true);
    act(() => result.current.field.undo());
    expect(result.current.field.value).toBe('One');
    expect(result.current.field.canRedo).toBe(true);
    act(() => result.current.field.clear());
    expect(result.current.field.value).toBe('');
    expect(result.current.field.canRedo).toBe(false);
    act(() => result.current.field.undo());
    expect(result.current.field.value).toBe('One');
  });
});
