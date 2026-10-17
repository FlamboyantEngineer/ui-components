import { useRef, useState } from 'react';
import { Input, SearchField } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { PropertyPanel, type PropertyPanelProps } from '../property-panel/property-panel.js';
import { PropertyScope } from '../property-scope/property-scope.js';

export interface PropertyFilterProps extends Omit<
  PropertyPanelProps,
  'header' | 'aria-label' | 'aria-labelledby'
> {
  /** Names the panel, and the search box from it (`Filter <label>`). */
  'aria-label': string;
  /** Placeholder text in the search box. */
  placeholder?: string | undefined;
}

const hooks = createHooks('property-filter', ['search', 'icon', 'input', 'clear']);

/**
 * A property panel whose header holds a search box (React Aria `SearchField`) that filters every
 * section, group, card and row in the panel through a `PropertyScope`.
 */
export function PropertyFilter({
  'aria-label': label,
  placeholder,
  children,
  className,
  ...rest
}: PropertyFilterProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useState('');
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
          aria-label={strings.filterLabel(label)}
          value={query}
          onChange={setQuery}
        >
          <Glyph name="search" className={hooks.slotClass('icon')} />
          <Input ref={inputRef} className={hooks.slotClass('input')} placeholder={placeholder} />
          {query ? (
            <IconButton
              icon="close"
              label={strings.clear}
              variant="ghost"
              size="sm"
              className={hooks.slotClass('clear')}
            />
          ) : null}
        </SearchField>
      }
    >
      <PropertyScope query={query} onClear={clearQuery}>
        {children}
      </PropertyScope>
    </PropertyPanel>
  );
}
