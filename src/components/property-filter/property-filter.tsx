'use client';

import { useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { PropertyPanel, type PropertyPanelProps } from '../property-panel/property-panel.js';
import { PropertyScope, type PropertyScopeFilter } from '../property-scope/property-scope.js';
import { SearchField } from '../search-field/search-field.js';

export interface PropertyFilterProps extends Omit<
  PropertyPanelProps,
  'header' | 'aria-label' | 'aria-labelledby'
> {
  /** Names the panel, and the search box from it (`Filter <label>`). */
  'aria-label': string;
  /** Placeholder text in the search box. */
  placeholder?: string | undefined;
  /** The query, controlled. */
  query?: string | undefined;
  /** The query to start from, uncontrolled. */
  defaultQuery?: string | undefined;
  /** Called with the query as the reader types or clears it. */
  onQueryChange?: ((query: string) => void) | undefined;
  /** Replaces term matching, as on `PropertyScope`. */
  filter?: PropertyScopeFilter | undefined;
}

const hooks = createHooks('property-filter', ['search']);

/**
 * A property panel whose header holds a `SearchField` that filters every section, group, card and
 * row in the panel through a `PropertyScope`.
 */
export function PropertyFilter({
  'aria-label': label,
  placeholder,
  query: controlledQuery,
  defaultQuery = '',
  onQueryChange,
  filter,
  children,
  className,
  ...rest
}: PropertyFilterProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useControllableState(controlledQuery, defaultQuery, onQueryChange);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <PropertyPanel
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      aria-label={label}
      header={
        <SearchField
          className={hooks.slotClass('search')}
          label={strings.filterLabel(label)}
          placeholder={placeholder}
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
        />
      }
    >
      <PropertyScope query={query} filter={filter} onClear={clearQuery}>
        {children}
      </PropertyScope>
    </PropertyPanel>
  );
}
