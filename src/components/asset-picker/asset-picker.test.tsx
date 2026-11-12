import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { AssetPicker, type AssetPickerItem } from './asset-picker.js';

const assets: AssetPickerItem[] = [
  {
    id: 'loaf',
    name: 'Loaf',
    thumbnailSrc: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    alt: 'A round loaf',
    width: 800,
    height: 600,
  },
  { id: 'rolls', name: 'Rolls', thumbnailSrc: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' },
];

function searchAssets(query: string) {
  return Promise.resolve(
    assets.filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase())),
  );
}

function renderPicker(props: Partial<Parameters<typeof AssetPicker>[0]> = {}) {
  const onSelect = vi.fn();
  const search = vi.fn(searchAssets);
  const view = render(
    <AssetPicker
      aria-label="Insert an image"
      search={search}
      onSelect={onSelect}
      searchDelay={0}
      {...props}
    />,
  );
  return { ...view, onSelect, search };
}

function requireAsset(id: string): AssetPickerItem {
  const asset = assets.find((each) => each.id === id);
  if (!asset) throw new Error(`No asset ${id}`);
  return asset;
}

const grid = () => screen.getByRole('grid', { name: 'Images' });

describe('AssetPicker', () => {
  it('UIC-ASSET-PICKER-1.1 browses with the empty query and searches as the reader types', async () => {
    const user = userEvent.setup();
    const { search, container } = renderPicker();
    expect(await within(grid()).findByRole('row', { name: 'Loaf' })).toBeVisible();
    expect(search).toHaveBeenCalledWith('', expect.any(AbortSignal));
    await user.type(screen.getByRole('searchbox', { name: 'Search images' }), 'rol');
    expect(await within(grid()).findByRole('row', { name: 'Rolls' })).toBeVisible();
    expect(within(grid()).queryByRole('row', { name: 'Loaf' })).not.toBeInTheDocument();
    expect(search).toHaveBeenLastCalledWith('rol', expect.any(AbortSignal));
    expectHooksMatchSpec(container, 'ASSET-PICKER', {
      slots: ['search', 'results', 'item', 'thumbnail', 'name', 'actions'],
    });
  });

  it('UIC-ASSET-PICKER-1.1 says when nothing matches and when the search fails', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPicker();
    await user.type(await screen.findByRole('searchbox', { name: 'Search images' }), 'zz');
    expect(await within(grid()).findByText('No images found')).toBeVisible();
    unmount();
    renderPicker({ search: () => Promise.reject(new Error('offline')) });
    expect(await within(grid()).findByText('Search is unavailable.')).toBeVisible();
  });

  it('UIC-ASSET-PICKER-1.2 places the chosen asset and inserts it with its placement', async () => {
    const user = userEvent.setup();
    const { onSelect, container } = renderPicker();
    const insert = screen.getByRole('button', { name: 'Insert' });
    expect(insert).toBeDisabled();
    await user.click(await within(grid()).findByRole('row', { name: 'Loaf' }));
    expect(screen.getByRole('textbox', { name: 'Alternative text' })).toHaveValue('A round loaf');
    const width = screen.getByRole('textbox', { name: 'Width' });
    expect(width).toHaveValue('800');
    await user.clear(width);
    await user.type(width, '400');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Height' })).toHaveValue('300');
    await user.click(screen.getByRole('radio', { name: 'Center' }));
    await user.click(insert);
    expect(onSelect).toHaveBeenCalledWith(assets[0], {
      alt: 'A round loaf',
      width: 400,
      height: 300,
      align: 'center',
      constrain: true,
    });
    expectHooksMatchSpec(container, 'ASSET-PICKER', {
      slots: [
        'search',
        'results',
        'item',
        'thumbnail',
        'name',
        'details',
        'alt',
        'size',
        'constrain',
        'align',
        'actions',
      ],
    });
  });

  it('UIC-ASSET-PICKER-1.2 lets width and height change apart once proportions are off', async () => {
    const user = userEvent.setup();
    renderPicker({ defaultAlign: 'end' });
    await user.click(await within(grid()).findByRole('row', { name: 'Loaf' }));
    await user.click(screen.getByRole('checkbox', { name: 'Keep proportions' }));
    const height = screen.getByRole('textbox', { name: 'Height' });
    await user.clear(height);
    await user.type(height, '100');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Width' })).toHaveValue('800');
    expect(screen.getByRole('radio', { name: 'End' })).toBeChecked();
  });

  it('UIC-ASSET-PICKER-1.2 never derives a side below one pixel for a very wide asset', async () => {
    const user = userEvent.setup();
    const banner = {
      ...requireAsset('loaf'),
      id: 'banner',
      name: 'Banner',
      width: 2000,
      height: 10,
    };
    renderPicker({ search: () => Promise.resolve([banner]) });
    await user.click(await within(grid()).findByRole('row', { name: 'Banner' }));
    const width = screen.getByRole('textbox', { name: 'Width' });
    await user.clear(width);
    await user.type(width, '50');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Height' })).toHaveValue('1');
  });

  it('UIC-ASSET-PICKER-1.1 searches again with a new search function', async () => {
    const user = userEvent.setup();
    let resolveFirst: (items: AssetPickerItem[]) => void = () => undefined;
    const first = vi.fn(
      () =>
        new Promise<AssetPickerItem[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const onSelect = vi.fn();
    const { rerender } = render(
      <AssetPicker
        aria-label="Insert an image"
        search={first}
        onSelect={onSelect}
        searchDelay={0}
      />,
    );
    await waitFor(() => expect(first).toHaveBeenCalled());
    const second = vi.fn(searchAssets);
    rerender(
      <AssetPicker
        aria-label="Insert an image"
        search={second}
        onSelect={onSelect}
        searchDelay={0}
      />,
    );
    resolveFirst([]);
    expect(await within(grid()).findByRole('row', { name: 'Loaf' })).toBeVisible();
    expect(second).toHaveBeenCalledWith('', expect.any(AbortSignal));
    await user.type(screen.getByRole('searchbox', { name: 'Search images' }), 'rol');
    expect(await within(grid()).findByRole('row', { name: 'Rolls' })).toBeVisible();
  });

  it('UIC-ASSET-PICKER-1.2 starts the placement again for another asset', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(await within(grid()).findByRole('row', { name: 'Loaf' }));
    await user.type(screen.getByRole('textbox', { name: 'Alternative text' }), ' on a board');
    await user.click(within(grid()).getByRole('row', { name: 'Rolls' }));
    expect(screen.getByRole('textbox', { name: 'Alternative text' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Width' })).toHaveValue('');
  });

  it('UIC-ASSET-PICKER-1.3 offers Cancel only with onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { unmount } = renderPicker();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    unmount();
    renderPicker({ onCancel });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
