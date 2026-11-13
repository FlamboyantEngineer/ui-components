import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { Table, type TableProps } from './table.js';

interface Colour {
  id: string;
  name: string;
  hex: string;
}

const colours: Colour[] = [
  { id: 'red', name: 'Red', hex: '#f00' },
  { id: 'blue', name: 'Blue', hex: '#00f' },
];

function renderColours(storage: UiStorage, props: Partial<TableProps<Colour>> = {}) {
  return render(
    <UiProvider storage={storage}>
      <Table
        aria-label="Colours"
        rows={colours}
        columns={[
          {
            id: 'name',
            header: 'Name',
            width: 120,
            minWidth: 100,
            maxWidth: 150,
            allowsResizing: true,
          },
          { id: 'hex', header: 'Hex' },
        ]}
        selectionMode="multiple"
        {...props}
      />
    </UiProvider>,
  );
}

const nameHeader = () => screen.getByRole('columnheader', { name: /^Name/ });

/** The column tracks a static table draws (UIC-TABLE-4.6): selection, Name, then Hex. */
const tracks = (index = 0) =>
  screen.getAllByRole('grid')[index]?.style.getPropertyValue('--ui-table-columns');

async function resizeName(keys: string) {
  const user = userEvent.setup({ delay: null });
  nameHeader().focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('slider', { name: /^Resize Name/ })).toHaveFocus();
  await user.keyboard(`{Enter}${keys}{Enter}`);
}

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table column widths', { timeout: 15_000 }, () => {
  it('UIC-TABLE-4.2 resizes by keyboard and reports the widths once at the end', async () => {
    const onColumnWidthsChange = vi.fn();
    renderColours(createMemoryStorage(), { onColumnWidthsChange });
    await resizeName('{ArrowRight}');
    expect(tracks()).toBe('44px 130px minmax(75px, 1fr)');
    expect(onColumnWidthsChange).toHaveBeenCalledTimes(1);
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ name: 130, hex: '1fr' });
  });

  it('UIC-TABLE-4.2 keeps a keyboard resize inside the column bounds', async () => {
    renderColours(createMemoryStorage());
    await resizeName('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(tracks()).toBe('44px 150px minmax(75px, 1fr)');
  });

  it('UIC-TABLE-4.2 resizes to a value assistive technology sets on the slider and reports it once', () => {
    const onColumnWidthsChange = vi.fn();
    renderColours(createMemoryStorage(), { onColumnWidthsChange });
    const slider = screen.getByRole('slider', { name: /^Resize Name/ });
    // eslint-disable-next-line testing-library/prefer-user-event -- a touch screen reader sets the value without key events, which user-event cannot do
    fireEvent.change(slider, { target: { value: '140' } });
    expect(tracks()).toBe('44px 140px minmax(75px, 1fr)');
    expect(onColumnWidthsChange).toHaveBeenCalledTimes(1);
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ name: 140, hex: '1fr' });
    // eslint-disable-next-line testing-library/prefer-user-event -- as above
    fireEvent.change(slider, { target: { value: '400' } });
    expect(tracks()).toBe('44px 150px minmax(75px, 1fr)');
  });

  it('UIC-TABLE-4.3 persists resized widths under the key and restores them on mount', async () => {
    const storage = createMemoryStorage();
    const view = renderColours(storage, { persistKey: 'colours.widths' });
    await resizeName('{ArrowLeft}');
    expect(JSON.parse(storage.getItem('colours.widths') ?? '{}')).toMatchObject({ name: 110 });
    view.unmount();
    renderColours(storage, { persistKey: 'colours.widths' });
    expect(tracks()).toBe('44px 110px minmax(75px, 1fr)');
  });

  it('UIC-TABLE-4.3 stores only the widths the reader set, so a later declared width shows', async () => {
    const storage = createMemoryStorage();
    const onColumnWidthsChange = vi.fn();
    const view = renderColours(storage, { persistKey: 'colours.widths', onColumnWidthsChange });
    await resizeName('{ArrowLeft}');
    expect(JSON.parse(storage.getItem('colours.widths') ?? '{}')).toEqual({ name: 110 });
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ name: 110, hex: '1fr' });
    view.unmount();
    renderColours(storage, {
      persistKey: 'colours.widths',
      columns: [
        { id: 'name', header: 'Name', width: 120, allowsResizing: true },
        { id: 'hex', header: 'Hex', width: 90 },
      ],
    });
    expect(tracks()).toBe('44px 110px 90px');
  });

  it('UIC-TABLE-4.3 ignores unusable stored widths', () => {
    const storage = createMemoryStorage();
    storage.setItem('colours.widths', JSON.stringify({ name: 'wide', hex: 0, other: 90 }));
    renderColours(storage, { persistKey: 'colours.widths' });
    expect(tracks()).toBe('44px 120px minmax(75px, 1fr)');
    storage.setItem('broken', '{not json');
    renderColours(storage, { persistKey: 'broken' });
    expect(tracks(1)).toBe('44px 120px minmax(75px, 1fr)');
  });
});
