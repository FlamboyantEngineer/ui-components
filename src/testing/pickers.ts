import { within } from '@testing-library/dom';
import { findPopup } from './popups.js';
import type { NameMatch, TestUser } from './test-user.js';

export interface ComboboxPick {
  /** The text typed into the input, after clearing it. */
  text: string;
  /** The option to press; defaults to `text`. */
  option?: NameMatch | undefined;
}

const LISTBOX_TRIGGER = '[aria-haspopup="listbox"]:is(button, [role="button"])';
const ISO_DATE = /^(\d{4,})-(\d{2})-(\d{2})$/;

async function pressOption(user: TestUser, trigger: Element, option: NameMatch) {
  const listbox = await findPopup(trigger, 'listbox');
  await user.click(await within(listbox).findByRole('option', { name: option }));
}

/**
 * Opens the list of a `SelectField` or `Combobox` from its button and presses the option named
 * `option`. `field` is the field's root or the button itself. A multiple selection stays open.
 */
export async function selectOption(user: TestUser, field: Element, option: NameMatch) {
  const trigger = field.matches(LISTBOX_TRIGGER) ? field : field.querySelector(LISTBOX_TRIGGER);
  if (!trigger) throw new Error('No button that opens a list box is rendered in the field.');
  await user.click(trigger);
  await pressOption(user, field.querySelector('[role="combobox"]') ?? trigger, option);
}

/** Clears a combobox input, types `pick.text` and presses the suggested option. */
export async function pickComboboxOption(user: TestUser, input: Element, pick: ComboboxPick) {
  await user.clear(input);
  await user.type(input, pick.text);
  await pressOption(user, input, pick.option ?? pick.text);
}

/**
 * Types an ISO 8601 date (`2026-05-14`) into the year, month and day segments of a date field, in
 * the order the locale draws them. `field` holds one run of segments: the field's root, or one input
 * (`ui-date-time-field__input`) of a range.
 */
export async function pickDate(user: TestUser, field: Element, isoDate: string) {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`${isoDate} is not an ISO 8601 date (YYYY-MM-DD).`);
  const [, year = '', month = '', day = ''] = match;
  const parts: Record<string, string> = { year, month: String(+month), day: String(+day) };
  const segments = [
    ...field.querySelectorAll<HTMLElement>('[role="spinbutton"][data-type]'),
  ].filter((segment) => (segment.dataset.type ?? '') in parts);
  if (segments.length === 0) throw new Error('No year, month or day segment is rendered.');
  for (const segment of segments) {
    await user.click(segment);
    await user.keyboard(parts[segment.dataset.type ?? ''] ?? '');
  }
}
