import type { CSSProperties, FocusEvent } from 'react';
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxLoadMoreItem,
  ListLayout,
  Popover,
  PopoverContext,
  SearchField,
  useFilter,
  useSlottedContext,
  Virtualizer,
  type AutocompleteProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useLayerZIndex } from '../portal/portal.js';
import { SelectListItem, type SelectOptionsDisplay } from './select-option.js';
import { flattenSelectItems, type SelectFieldItem } from './select-options.js';

/** The next page of a search's results, loaded when the end of the list scrolls into view. */
export interface SelectListMore {
  isLoading: boolean;
  onLoadMore: () => void;
}

export interface SelectListProps extends SelectOptionsDisplay {
  /** The options and groups, in display order. */
  items: readonly SelectFieldItem[];
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
  /** Renders only the options in view. */
  isVirtualized: boolean;
  /** Ends the list with a row that loads the next page; `null` when there is none. */
  more: SelectListMore | null;
}

const hooks = createHooks('select-field', [
  'popover',
  'search',
  'search-input',
  'loading',
  'listbox',
  'load-more',
  'empty',
]);

// Estimates the virtualizer starts from; it measures each row as it renders.
const listLayoutOptions = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };

/** Starts typing after the filter text a key on the closed trigger seeded, not over it. */
function moveCaretToEnd(event: FocusEvent<HTMLInputElement>) {
  const { length } = event.currentTarget.value;
  event.currentTarget.setSelectionRange(length, length);
}

function OptionList(props: SelectListProps) {
  const strings = useUiStrings();
  const { items, more, emptyMessage } = props;
  const list = (
    <ListBox
      className={hooks.slotClass('listbox')}
      renderEmptyState={() => <span {...hooks.slot('empty')}>{emptyMessage}</span>}
    >
      {items.map((item) => (
        <SelectListItem key={item.id} item={item} display={props} />
      ))}
      {more ? (
        <ListBoxLoadMoreItem
          className={hooks.slotClass('load-more')}
          isLoading={more.isLoading}
          onLoadMore={more.onLoadMore}
        >
          {strings.loading}
        </ListBoxLoadMoreItem>
      ) : null}
    </ListBox>
  );
  if (!props.isVirtualized) return list;
  return (
    <Virtualizer layout={ListLayout} layoutOptions={listLayoutOptions}>
      {list}
    </Virtualizer>
  );
}

/**
 * The open list of a select field: a popover on the `dropdown` layer holding the options and
 * groups, led by a filter input when the list is filterable. Focus stays in the filter while the
 * arrow keys move through the options.
 */
export function SelectList(props: SelectListProps) {
  const strings = useUiStrings();
  const zIndex = useLayerZIndex('dropdown');
  const { contains } = useFilter({ sensitivity: 'base' });
  const context = useSlottedContext(PopoverContext);
  const contextStyle = typeof context?.style === 'object' ? (context.style as CSSProperties) : {};
  const descriptions = new Map(
    flattenSelectItems(props.items).map((option) => [option.id, option.description]),
  );
  const filter: AutocompleteProps<object>['filter'] = (text, query, node) => {
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
      {props.isLoading && props.items.length > 0 ? (
        <div {...hooks.slot('loading')} role="status">
          {strings.loading}
        </div>
      ) : null}
      {props.isFilterable ? (
        <Autocomplete
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
