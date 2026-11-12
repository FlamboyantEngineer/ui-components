'use client';

import { useEffect, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { type RemoteSearch, useRemoteSearch } from '../../utils/use-remote-search.js';
import { Button } from '../button/button.js';
import { SearchField } from '../search-field/search-field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { AssetDetails } from './asset-details.js';
import { assetPickerHooks as hooks } from './asset-picker-hooks.js';
import {
  type AssetPickerAlign,
  type AssetPickerItem,
  type AssetPickerSearch,
  type AssetPlacement,
  initialPlacement,
} from './asset-placement.js';
import { AssetResults } from './asset-results.js';

export type {
  AssetPickerAlign,
  AssetPickerItem,
  AssetPickerPage,
  AssetPickerSearch,
  AssetPlacement,
} from './asset-placement.js';

export interface AssetPickerProps extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /**
   * Finds the assets matching a query, or with `cursor` the next page; the empty query, searched
   * as the picker mounts, browses. It should stop when `signal` aborts. Keep it stable: a new
   * function ends the running search.
   */
  search: AssetPickerSearch;
  /** Called with the chosen asset and how the reader placed it when they insert it. */
  onSelect: (item: AssetPickerItem, placement: AssetPlacement) => void;
  /** Called when the reader cancels; without it there is no Cancel button. */
  onCancel?: (() => void) | undefined;
  /** The alignment a chosen asset starts with. Defaults to `start`. */
  defaultAlign?: AssetPickerAlign | undefined;
  /** Milliseconds to wait after the last keystroke before searching. Defaults to 240. */
  searchDelay?: number | undefined;
}

/** The chosen asset and its placement, which starts again from each newly chosen asset. */
function useChoice(defaultAlign: AssetPickerAlign) {
  const [choice, setChoice] = useState<{ item: AssetPickerItem; placement: AssetPlacement } | null>(
    null,
  );
  return {
    choice,
    choose: (item: AssetPickerItem) => {
      if (choice?.item.id !== item.id)
        setChoice({ item, placement: initialPlacement(item, defaultAlign) });
    },
    place: (placement: AssetPlacement) =>
      setChoice((current) => current && { ...current, placement }),
  };
}

/**
 * A new `search` function ends the running search (it is the search's source), so the picker
 * searches its current query again with it rather than sitting idle with no results.
 */
function useSearchAgainWith<T>(load: unknown, search: RemoteSearch<T>) {
  const previousRef = useRef(load);
  useEffect(() => {
    if (previousRef.current === load) return;
    previousRef.current = load;
    search.searchNow(search.query);
  }, [load, search]);
}

/**
 * Browses and searches assets through the caller's `search`, shows them as a grid of thumbnails,
 * and places the chosen one: alternative text, width and height kept in proportion or not, and
 * alignment. Insert hands the asset and its placement to `onSelect`. All data comes through the
 * callbacks; the picker stores nothing.
 */
export function AssetPicker({
  search: load,
  onSelect,
  onCancel,
  defaultAlign = 'start',
  searchDelay,
  className,
  ref,
  ...rest
}: AssetPickerProps) {
  const strings = useUiStrings();
  const search = useRemoteSearch({ load, source: load, minSearchLength: 0, searchDelay });
  useSearchAgainWith(load, search);
  const { choice, choose, place } = useChoice(defaultAlign);
  const results = search.results.length;
  return (
    <div {...rest} {...hooks.root({ className, props: rest })} ref={ref} role="group">
      <SearchField {...hooks.slot('search')} label={strings.assetSearch} onChange={search.search} />
      <VisuallyHidden role="status">
        {search.isLoading ? strings.loading : results === 0 ? strings.assetsEmpty : ''}
      </VisuallyHidden>
      <AssetResults search={search} chosenKey={choice?.item.id ?? null} onChoose={choose} />
      {choice ? (
        <AssetDetails item={choice.item} placement={choice.placement} onChange={place} />
      ) : null}
      <div {...hooks.slot('actions')}>
        {onCancel ? <Button onPress={onCancel}>{strings.cancel}</Button> : null}
        <Button
          variant="primary"
          isDisabled={!choice}
          onPress={() => {
            if (choice) onSelect(choice.item, choice.placement);
          }}
        >
          {strings.insert}
        </Button>
      </div>
    </div>
  );
}
