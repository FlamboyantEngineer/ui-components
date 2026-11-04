'use client';

import { CloseGlyph, SearchGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, Input, SearchField } from '../../primitives/index.js';
import { Icon } from '../icon/icon.js';
import { tableHooks as hooks } from './table-hooks.js';

interface TableSearchProps {
  /** Accessible name and placeholder. */
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** The search box above a filterable table. Escape or the clear button empties it. */
export function TableSearch({ label, value, onChange }: TableSearchProps) {
  const strings = useUiStrings();
  return (
    <SearchField
      aria-label={label}
      value={value}
      onChange={onChange}
      className={hooks.slotClass('filter')}
    >
      <Icon icon={SearchGlyph} size="sm" className={hooks.slotClass('filter-icon')} />
      <Input className={hooks.slotClass('filter-input')} placeholder={label} />
      <AriaButton className={hooks.slotClass('filter-clear')} aria-label={strings.clear}>
        <Icon icon={CloseGlyph} size="sm" />
      </AriaButton>
    </SearchField>
  );
}
