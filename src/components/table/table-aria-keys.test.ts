import { describe, expect, it, vi } from 'vitest';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createTableAriaKeys } from './table-aria-keys.js';

describe('table collection keys', () => {
  it('UIC-TABLE-3.1 treats a disabled string iterable as keys rather than an all-selection sentinel', () => {
    const props = createTableAriaKeys({
      selection: {
        selection: new Set(),
        setSelection() {},
        selectedRows: [],
        isRowDisabled: () => false,
        disabledKeys: new Set(),
      },
      drawnRows: [],
      expansion: { expandedKeys: new Set(), onExpandedChange() {} },
      disabledKeys: 'all',
    });
    expect(props.disabledKeys).toEqual(['a', 'l', 'l'].map(toCollectionKey));
  });

  it('UIC-TABLE-3.1 UIC-TABLE-9.1 preserves typed selection, disabled and expansion keys', () => {
    const setSelection = vi.fn();
    const onExpandedChange = vi.fn();
    const group = 'ui-table-group:kind=Fruit';
    const props = createTableAriaKeys({
      selection: {
        selection: new Set([1, '1', 'outside']),
        setSelection,
        selectedRows: [],
        isRowDisabled: () => false,
        disabledKeys: new Set([1]),
      },
      drawnRows: [],
      expansion: { expandedKeys: new Set([1, '1', group]), onExpandedChange },
      disabledKeys: [1],
    });
    expect(props.disabledKeys).toEqual([toCollectionKey(1)]);
    props.onSelectionChange(new Set([toCollectionKey('1'), toCollectionKey('outside')]));
    expect(setSelection).toHaveBeenCalledWith(new Set(['1', 'outside']));
    props.onExpandedChange(new Set([toCollectionKey('1'), toCollectionKey(group)]));
    expect(onExpandedChange).toHaveBeenCalledWith(new Set(['1', group]));
  });
});
