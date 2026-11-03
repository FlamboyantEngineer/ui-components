'use client';

import { useContext, useMemo, type FocusEvent, type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxLoadMoreItem,
  ListLayout,
  SearchField,
  useFilter,
  Virtualizer,
  type AutocompleteProps,
  Popover,
  OverlayTriggerStateContext,
} from '../../primitives/index.js';
import { PopoverPresence } from '../popover/popover.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { SelectListItems, type SelectOptionsDisplay } from './select-option.js';
import { flattenPickerItems, pickerListLayout, usePickerPopoverStyle } from '../field/field.js';
import { type SelectFieldItem } from './select-options.js';
import { DEFAULT_DROPDOWN_OFFSET, DEFAULT_OVERLAY_GUTTER } from '../../utils/overlay-defaults.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

/** The next page of a search's results, loaded when the end of the list scrolls into view. */
interface SelectListMore {
  isLoading: boolean;
  onLoadMore: () => void;
}

export interface SelectListProps extends SelectOptionsDisplay {
  popoverProps?: BaseProps | undefined;
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
  emptyMessage: ReactNode;
  /** Renders only the options in view. */
  isVirtualized: boolean;
  /** Ends the list with a row that loads the next page; `null` when there is none. */
  more: SelectListMore | null;
}

/** Starts typing after the filter text a key on the closed trigger seeded, not over it. */
function moveCaretToEnd(event: FocusEvent<HTMLInputElement>) {
  const { length } = event.currentTarget.value;
  event.currentTarget.setSelectionRange(length, length);
}

function OptionList(props: SelectListProps) {
  const strings = useUiStrings();
  const { items, more, emptyMessage, isMultiple, blockedKeys, renderOption } = props;
  const display = { isMultiple, blockedKeys, renderOption };
  const list = (
    <ListBox
      className={hooks.slotClass('listbox')}
      // Bulk edits require a fresh press on the option, not the trigger's opening release.
      shouldSelectOnPressUp={!isMultiple}
      renderEmptyState={() => <span {...hooks.slot('empty')}>{emptyMessage}</span>}
    >
      <SelectListItems items={items} display={display} />
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
    <Virtualizer layout={ListLayout} layoutOptions={pickerListLayout}>
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
  const state = useContext(OverlayTriggerStateContext);
  const style = usePickerPopoverStyle();
  const { contains } = useFilter({ sensitivity: 'base' });
  const descriptions = useMemo(
    () =>
      new Map(
        flattenPickerItems(props.items).map((option) => [
          toCollectionKey(option.id),
          option.description,
        ]),
      ),
    [props.items],
  );
  const filter: AutocompleteProps<object>['filter'] = (text, query, node) => {
    const description = descriptions.get(String(node.key));
    return (
      contains(text, query) || (typeof description === 'string' && contains(description, query))
    );
  };
  return (
    <>
      <PopoverPresence />
      <Popover
        {...props.popoverProps}
        {...hooks.slot('popover', { layer: 'dropdown' }, props.popoverProps?.className)}
        offset={DEFAULT_DROPDOWN_OFFSET}
        containerPadding={DEFAULT_OVERLAY_GUTTER}
        style={style}
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
            <SearchField
              className={hooks.slotClass('search')}
              aria-label={strings.search}
              autoFocus
            >
              <Input
                className={hooks.slotClass('search-input')}
                onFocus={moveCaretToEnd}
                onKeyDownCapture={(event) => {
                  if (
                    event.key !== 'Escape' ||
                    event.defaultPrevented ||
                    isComposingKey(event.nativeEvent) ||
                    !state
                  )
                    return;
                  event.preventDefault();
                  event.stopPropagation();
                  state.close();
                }}
              />
            </SearchField>
            <OptionList {...props} />
          </Autocomplete>
        ) : (
          <OptionList {...props} />
        )}
      </Popover>
    </>
  );
}
