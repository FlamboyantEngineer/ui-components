'use client';

import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { RemoteSearch } from '../../utils/use-remote-search.js';
import { CardGrid, CardGridItem } from '../card/card.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { Image } from '../image/image.js';
import { assetPickerHooks as hooks } from './asset-picker-hooks.js';
import type { AssetPickerItem } from './asset-placement.js';

interface AssetResultsProps {
  search: RemoteSearch<AssetPickerItem>;
  chosenKey: Key | null;
  onChoose: (item: AssetPickerItem) => void;
}

/** What the grid shows without results: the first search loading, a failure, or no match. */
function AssetResultsEmpty({ search }: Pick<AssetResultsProps, 'search'>) {
  const strings = useUiStrings();
  if (search.isLoading)
    return <EmptyState variant="loading" size="sm" description={strings.loading} />;
  if (search.hasFailed)
    return <EmptyState variant="error" size="sm" description={strings.searchFailed} />;
  return <EmptyState size="sm" description={strings.assetsEmpty} />;
}

/**
 * The search's assets as a single-selection grid of thumbnails with their names; choosing one
 * reports it, and the grid asks for the next page as its end scrolls into view.
 */
export function AssetResults({ search, chosenKey, onChoose }: AssetResultsProps) {
  const strings = useUiStrings();
  const byKey = new Map(search.results.map((item) => [item.id, item]));
  return (
    <CardGrid
      {...hooks.slot('results')}
      aria-label={strings.assetResults}
      items={search.results}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={chosenKey === null ? [] : [chosenKey]}
      onSelectionChange={(keys: 'all' | Set<Key>) => {
        const [key] = keys === 'all' ? [] : [...keys];
        const item = key === undefined ? undefined : byKey.get(key);
        if (item) onChoose(item);
      }}
      onLoadMore={search.hasMore ? search.loadMore : undefined}
      isLoading={search.isLoadingMore}
      renderEmptyState={() => <AssetResultsEmpty search={search} />}
    >
      {(item) => (
        <CardGridItem id={item.id} textValue={item.name} {...hooks.slot('item')}>
          <Image {...hooks.slot('thumbnail')} src={item.thumbnailSrc} alt="" />
          <span {...hooks.slot('name')}>{item.name}</span>
        </CardGridItem>
      )}
    </CardGrid>
  );
}
