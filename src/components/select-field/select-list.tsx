import type { CSSProperties, FocusEvent } from 'react';
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  PopoverContext,
  SearchField,
  useFilter,
  useSlottedContext,
  type AutocompleteProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { useLayerZIndex } from '../portal/portal.js';
import type { SelectFieldOption } from './select-options.js';

export interface SelectListProps {
  options: readonly SelectFieldOption[];
  isMultiple: boolean;
  /** Draws a filter input above the options. */
  isFilterable: boolean;
  /** Filters the options by the filter text; off when a search already chose them. */
  filtersLocally: boolean;
  filterText: string;
  onFilterTextChange: (text: string) => void;
  /** A search is running: a status line says so above the options it replaces. */
  isLoading: boolean;
  /** Shown when no option is listed. */
  emptyMessage: string;
}

const hooks = createHooks('select-field', [
  'popover',
  'search',
  'search-input',
  'loading',
  'listbox',
  'option',
  'option-check',
  'option-icon',
  'option-label',
  'option-description',
  'empty',
]);

/** Starts typing after the filter text a key on the closed trigger seeded, not over it. */
function moveCaretToEnd(event: FocusEvent<HTMLInputElement>) {
  const { length } = event.currentTarget.value;
  event.currentTarget.setSelectionRange(length, length);
}

function OptionRow({ option, isMultiple }: { option: SelectFieldOption; isMultiple: boolean }) {
  return (
    <ListBoxItem
      id={option.id}
      textValue={option.label}
      isDisabled={option.isDisabled}
      className={hooks.slotClass('option')}
    >
      {({ isSelected }) => (
        <>
          {isMultiple ? (
            <span {...hooks.slot('option-check')} aria-hidden="true">
              {isSelected ? <Glyph name="check" /> : null}
            </span>
          ) : null}
          {option.icon ? (
            <Icon {...toIconProps(option.icon)} className={hooks.slotClass('option-icon')} />
          ) : null}
          <span {...hooks.slot('option-label')}>{option.label}</span>
          {option.description ? (
            <>
              {' '}
              <span {...hooks.slot('option-description')}>{option.description}</span>
            </>
          ) : null}
        </>
      )}
    </ListBoxItem>
  );
}

function OptionList({ options, isMultiple, emptyMessage }: SelectListProps) {
  return (
    <ListBox<SelectFieldOption>
      className={hooks.slotClass('listbox')}
      items={options}
      renderEmptyState={() => <span {...hooks.slot('empty')}>{emptyMessage}</span>}
    >
      {(option) => <OptionRow option={option} isMultiple={isMultiple} />}
    </ListBox>
  );
}

/**
 * The open list of a select field: a popover on the `dropdown` layer holding the options, led by a
 * filter input when the list is filterable. Focus stays in the filter while the arrow keys move
 * through the options.
 */
export function SelectList(props: SelectListProps) {
  const strings = useUiStrings();
  const zIndex = useLayerZIndex('dropdown');
  const { contains } = useFilter({ sensitivity: 'base' });
  const context = useSlottedContext(PopoverContext);
  const contextStyle = typeof context?.style === 'object' ? (context.style as CSSProperties) : {};
  const descriptions = new Map(props.options.map((option) => [option.id, option.description]));
  const filter: AutocompleteProps<SelectFieldOption>['filter'] = (text, query, node) => {
    const description = descriptions.get(node.key);
    return contains(text, query) || Boolean(description && contains(description, query));
  };
  return (
    <Popover
      {...hooks.slot('popover', { layer: 'dropdown' })}
      offset={4}
      containerPadding={8}
      style={{ ...contextStyle, zIndex }}
    >
      {props.isLoading && props.options.length > 0 ? (
        <div {...hooks.slot('loading')} role="status">
          {strings.loading}
        </div>
      ) : null}
      {props.isFilterable ? (
        <Autocomplete<SelectFieldOption>
          inputValue={props.filterText}
          onInputChange={props.onFilterTextChange}
          filter={props.filtersLocally ? filter : undefined}
        >
          <SearchField className={hooks.slotClass('search')} aria-label={strings.search} autoFocus>
            <Input className={hooks.slotClass('search-input')} onFocus={moveCaretToEnd} />
          </SearchField>
          <OptionList {...props} />
        </Autocomplete>
      ) : (
        <OptionList {...props} />
      )}
    </Popover>
  );
}
