import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFieldState, type FieldIssues, type FieldStateOptions } from './field-state.js';

function renderField(options: FieldStateOptions<string>) {
  return renderHook((props: FieldStateOptions<string>) => useFieldState(props), {
    initialProps: options,
  });
}

/** A check that answers after 100 ms: `taken` is taken. */
function createCheck() {
  return vi.fn(
    (value: string, signal: AbortSignal) =>
      new Promise<FieldIssues>((resolve) => {
        const timer = setTimeout(
          () => resolve(value === 'taken' ? { severity: 'error', message: 'Taken.' } : null),
          100,
        );
        signal.addEventListener('abort', () => clearTimeout(timer));
      }),
  );
}

describe('asynchronous validation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('UIC-FIELD-3.8 waits for the value to settle, is pending meanwhile and reports the result', async () => {
    const validateAsync = createCheck();
    const { result } = renderField({
      defaultValue: 'free',
      validateAsync,
      validationDebounce: 300,
    });
    expect(result.current.validation).toEqual({ status: 'pending', message: 'Validating' });
    expect(result.current.realtimeValidation.status).toBe('pending');
    act(() => result.current.setValue('take'));
    act(() => result.current.setValue('taken'));
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(validateAsync).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(validateAsync).toHaveBeenCalledTimes(1);
    expect(validateAsync).toHaveBeenLastCalledWith('taken', expect.any(AbortSignal));
    expect(result.current.validation.status).toBe('pending');
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.validation).toEqual({ status: 'invalid', message: 'Taken.' });
  });

  it('UIC-FIELD-3.8 aborts a check the value moved on from', async () => {
    const validateAsync = createCheck();
    const { result } = renderField({ defaultValue: 'taken', validateAsync });
    await act(() => vi.advanceTimersByTimeAsync(50));
    const [, signal] = validateAsync.mock.calls[0] ?? [];
    act(() => result.current.setValue('free'));
    expect(signal?.aborted).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(result.current.validation.status).toBe('valid');
  });

  it('UIC-FIELD-3.8 skips the check while the value already has an error', async () => {
    const validateAsync = createCheck();
    const { result } = renderField({ defaultValue: '', isRequired: true, validateAsync });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(validateAsync).not.toHaveBeenCalled();
    expect(result.current.validation.message).toBe('A value is required.');
  });

  it('UIC-FIELD-3.8 reports no issue for a check that fails', async () => {
    const validateAsync = vi.fn(() => Promise.reject(new Error('offline')));
    const { result } = renderField({ defaultValue: 'free', validateAsync });
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(result.current.validation.status).toBe('valid');
  });

  it('UIC-FIELD-3.8 stays pending when the value returns to one checked before', async () => {
    const validateAsync = createCheck();
    const { result } = renderField({ defaultValue: 'free', validateAsync });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.validation.status).toBe('valid');
    act(() => result.current.setValue('taken'));
    expect(result.current.realtimeValidation.status).toBe('pending');
    act(() => result.current.setValue('free'));
    expect(result.current.realtimeValidation.status).toBe('pending');
    await act(() => vi.advanceTimersByTimeAsync(99));
    expect(result.current.realtimeValidation.status).toBe('pending');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current.realtimeValidation.status).toBe('valid');
    expect(validateAsync).toHaveBeenCalledTimes(2);
  });

  it('UIC-FIELD-3.8 checks the unchanged value again with a replacement validator', async () => {
    const first = createCheck();
    const { result, rerender } = renderField({ defaultValue: 'free', validateAsync: first });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.realtimeValidation.status).toBe('valid');
    const stricter = vi.fn(() =>
      Promise.resolve<FieldIssues>({ severity: 'error', message: 'Reserved.' }),
    );
    rerender({ defaultValue: 'free', validateAsync: stricter });
    expect(result.current.realtimeValidation.status).toBe('pending');
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(stricter).toHaveBeenCalledWith('free', expect.any(AbortSignal));
    expect(result.current.realtimeValidation).toEqual({ status: 'invalid', message: 'Reserved.' });
    rerender({ defaultValue: 'free', validateAsync: stricter });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(stricter).toHaveBeenCalledTimes(1);
  });

  it('UIC-FIELD-3.8 checks again once a skipped check is enabled, ignoring a superseded result', async () => {
    const validateAsync = createCheck();
    const { result } = renderField({ defaultValue: 'free', isRequired: true, validateAsync });
    await act(() => vi.advanceTimersByTimeAsync(50));
    act(() => result.current.setValue(''));
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(result.current.realtimeValidation.message).toBe('A value is required.');
    act(() => result.current.setValue('free'));
    expect(result.current.realtimeValidation.status).toBe('pending');
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.realtimeValidation.status).toBe('valid');
    expect(validateAsync).toHaveBeenCalledTimes(2);
  });
});
