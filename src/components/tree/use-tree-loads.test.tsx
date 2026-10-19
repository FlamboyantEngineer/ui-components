import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tree } from './tree.js';

interface Place {
  id: string;
  name: string;
  isLazy?: boolean;
  children?: Place[];
}

const START: Place[] = [
  { id: 'europe', name: 'Europe', isLazy: true },
  { id: 'asia', name: 'Asia', isLazy: true },
];

/** Reports every observed loading sentinel as in view at once: jsdom has no layout. */
class VisibleObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
}

function Places({ onLoad }: { onLoad: (place: Place) => Promise<Place[]> }) {
  const [places, setPlaces] = useState(START);
  return (
    <Tree
      aria-label="Places"
      items={places}
      getTextValue={(place) => place.name}
      hasChildItems={(place) => place.isLazy ?? false}
      onLoadChildren={async (place) => {
        const children = await onLoad(place);
        setPlaces((current) =>
          current.map((entry) => (entry.id === place.id ? { ...entry, children } : entry)),
        );
      }}
    />
  );
}

const row = (label: string) => screen.getByRole('row', { name: label });

describe('Tree loading children', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', VisibleObserver));
  afterEach(() => vi.unstubAllGlobals());

  it('UIC-TREE-2.4 asks for an opened branch’s children and shows them once loaded', async () => {
    let resolve: (children: Place[]) => void = () => {};
    const onLoad = vi.fn(() => new Promise<Place[]>((done) => (resolve = done)));
    render(<Places onLoad={onLoad} />);
    expect(onLoad).not.toHaveBeenCalled();
    await userEvent.click(within(row('Europe')).getByRole('button', { name: 'Expand Europe' }));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 'europe' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Loading');
    await act(async () => resolve([{ id: 'lisbon', name: 'Lisbon' }]));
    expect(row('Lisbon')).toHaveAttribute('aria-level', '2');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('UIC-TREE-2.4 shows why a load failed in the row and retries on request', async () => {
    const onLoad = vi
      .fn<(place: Place) => Promise<Place[]>>()
      .mockRejectedValueOnce(new Error('The atlas is offline.'))
      .mockResolvedValueOnce([{ id: 'hanoi', name: 'Hanoi' }]);
    const { container } = render(<Places onLoad={onLoad} />);
    await userEvent.click(within(row('Asia')).getByRole('button', { name: 'Expand Asia' }));
    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('The atlas is offline.');
    expect(error.closest('.ui-tree__load-error')).toBe(error);
    expect(row('Asia')).toContainElement(error);
    expectHooksMatchSpec(container, 'TREE', { slots: ['load-error'] });
    expect(onLoad).toHaveBeenCalledTimes(1);

    await userEvent.click(within(row('Asia')).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('row', { name: 'Hanoi' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });
});
