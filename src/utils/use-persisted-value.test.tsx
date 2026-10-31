import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../core/storage.js';
import { numberCodec } from './json-codec.js';
import { usePersistedValue } from './use-persisted-value.js';

interface Props {
  value?: number | undefined;
  persistKey?: string | undefined;
}

function renderPersisted(storage: UiStorage, initialProps: Props, onChange = vi.fn()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UiProvider storage={storage}>{children}</UiProvider>
  );
  const view = renderHook(
    ({ value, persistKey }: Props) =>
      usePersistedValue({ value, defaultValue: 10, onChange, persistKey, codec: numberCodec }),
    { initialProps, wrapper },
  );
  return { ...view, onChange };
}

describe('usePersistedValue', () => {
  it('UIC-PROVIDER-6.4 restores, stores and reports an uncontrolled value', () => {
    const storage = createMemoryStorage({ width: '24' });
    const { result, onChange } = renderPersisted(storage, { persistKey: 'width' });
    expect(result.current[0]).toBe(24);
    act(() => result.current[1](30));
    expect(result.current[0]).toBe(30);
    expect(storage.getItem('width')).toBe('30');
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('UIC-PROVIDER-6.4 starts from the default when the stored value is unreadable', () => {
    const { result } = renderPersisted(createMemoryStorage({ width: '"wide"' }), {
      persistKey: 'width',
    });
    expect(result.current[0]).toBe(10);
  });

  it('UIC-PROVIDER-6.4 leaves a controlled value to the caller and never stores it', () => {
    const storage = createMemoryStorage({ width: '24' });
    const { result, onChange } = renderPersisted(storage, { value: 50, persistKey: 'width' });
    expect(result.current[0]).toBe(50);
    act(() => result.current[1](60));
    expect(result.current[0]).toBe(50);
    expect(storage.getItem('width')).toBe('24');
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('UIC-PROVIDER-6.4 holds plain state without a key', () => {
    const storage = createMemoryStorage();
    const { result } = renderPersisted(storage, {});
    act(() => result.current[1](12));
    expect(result.current[0]).toBe(12);
    expect(storage.getItem('undefined')).toBeNull();
  });
});
