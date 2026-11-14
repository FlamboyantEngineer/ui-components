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

  it('UIC-ASSET-PICKER-1.2 returns the chosen asset without placement policy', async () => {
    const user = userEvent.setup();
    const { onSelect, container } = renderPicker();
    const insert = screen.getByRole('button', { name: 'Insert' });
    expect(insert).toBeDisabled();
    await user.click(await within(grid()).findByRole('row', { name: 'Loaf' }));
    await user.click(insert);
    expect(onSelect).toHaveBeenCalledWith(assets[0]);
    expect(screen.queryByRole('textbox', { name: 'Alternative text' })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'ASSET-PICKER', {
      slots: ['search', 'results', 'item', 'thumbnail', 'name', 'actions'],
    });
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
