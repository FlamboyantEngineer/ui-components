import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type Ref, useState } from 'react';
import { expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { Combobox, ComboboxContent, ComboboxInput } from './index.js';

const loadCities = vi.fn(async () => [{ id: 2, label: 'Oslo' }]);

function Cities({
  frameRef,
  popupRef,
}: {
  frameRef: Ref<HTMLDivElement>;
  popupRef: Ref<HTMLElement>;
}) {
  const [value, setValue] = useState<Key[]>([1]);
  return (
    <Combobox
      name="city"
      label="Cities"
      selectionMode="multiple"
      value={value}
      onChange={setValue}
      defaultItems={[{ id: 1, label: 'Lima' }]}
      loadItems={loadCities}
      searchDelay={0}
    >
      <ComboboxInput ref={frameRef} className="city-entry" />
      <ComboboxContent ref={popupRef} placement="bottom start" className="city-popup" />
    </Combobox>
  );
}

it('UIC-COMBOBOX-7.1 composes a controlled multiple field with async options, chips and form values', async () => {
  const user = userEvent.setup();
  const frameRef = vi.fn();
  const popupRef = vi.fn();
  const onSubmit = vi.fn((event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget).getAll('city');
  });
  render(
    <form onSubmit={onSubmit}>
      <Cities frameRef={frameRef} popupRef={popupRef} />
      <button type="submit">Save</button>
    </form>,
  );
  const input = screen.getByRole('combobox', { name: 'Cities' });
  expect(input.closest('.city-entry')).toHaveClass('ui-combobox__field');
  expect(frameRef).toHaveBeenLastCalledWith(input.closest('.city-entry'));
  await user.type(input, 'Os');
  const oslo = await screen.findByRole('option', { name: 'Oslo' });
  expect(oslo.closest('.city-popup')).toHaveClass('ui-combobox__popover');
  expect(popupRef).toHaveBeenLastCalledWith(oslo.closest('.city-popup'));
  await user.click(oslo);
  await user.keyboard('{Escape}');
  expect(await screen.findByRole('button', { name: /Remove.*Oslo/ })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: /Remove.*Lima/ }));
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(onSubmit).toHaveReturnedWith(['2']));
});
