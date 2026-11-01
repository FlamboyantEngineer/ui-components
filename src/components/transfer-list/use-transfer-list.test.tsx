import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTransferList } from './use-transfer-list.js';

const items = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Blue' },
  { id: 1, label: 'One' },
];

describe('useTransferList', () => {
  it('UIC-TRANSFER-LIST-2.4 never reorders a disabled row, even from a drag started before', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTransferList({
        items,
        value: undefined,
        defaultValue: ['a', 'b', 1],
        onChange,
        disabledKeys: ['a'],
        isDisabled: false,
      }),
    );
    act(() => result.current.drop({ keys: ['a'], targetKey: 'b', position: 'after' }));
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.drop({ keys: ['a', 1], targetKey: 'a', position: 'before' }));
    expect(onChange).toHaveBeenLastCalledWith([1, 'a', 'b']);
  });
});
