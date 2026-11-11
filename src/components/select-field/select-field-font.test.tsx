import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectField, type SelectFieldOption } from './select-field.js';

const styles: SelectFieldOption[] = [
  { id: 'body', label: 'Body' },
  { id: 'heading', label: 'Heading' },
];

/** A canvas whose text is 7 pixels a character, or 9 in a bold font. */
function stubCanvas() {
  const context = {
    font: '',
    measureText(text: string) {
      return { width: text.length * (context.font.includes('700') ? 9 : 7) };
    },
  };
  vi.stubGlobal(
    'OffscreenCanvas',
    vi.fn(function () {
      return { getContext: () => context };
    }),
  );
  return context;
}

function addSheet(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css;
  document.head.append(sheet);
  return sheet;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
});

describe('SelectField label font', () => {
  it('UIC-SELECT-FIELD-2.2 measures its labels in the font of the value label, not the trigger', async () => {
    stubCanvas();
    addSheet('.ui-select-field__value-label { font-weight: 700; }');
    const { container } = render(<SelectField label="Style" options={styles} placeholder="Pick" />);
    const select = () => container.querySelector<HTMLElement>('.ui-select-field__select');
    // "Heading" is seven characters at 9 pixels each in bold.
    await waitFor(() =>
      expect(select()?.style.getPropertyValue('--ui-select-field-label-width')).toBe('63px'),
    );
  });

  it('UIC-SELECT-FIELD-2.2 measures again when a new choice is drawn in another font', async () => {
    stubCanvas();
    addSheet('.heavy .ui-select-field__value-label { font-weight: 700; }');
    const { container, rerender } = render(
      <SelectField label="Style" options={styles} placeholder="Pick" value="body" />,
    );
    const select = () => container.querySelector<HTMLElement>('.ui-select-field__select');
    await waitFor(() =>
      expect(select()?.style.getPropertyValue('--ui-select-field-label-width')).toBe('49px'),
    );
    rerender(
      <SelectField
        label="Style"
        options={styles}
        placeholder="Pick"
        value="heading"
        className="heavy"
      />,
    );
    await waitFor(() =>
      expect(select()?.style.getPropertyValue('--ui-select-field-label-width')).toBe('63px'),
    );
  });
});
