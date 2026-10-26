import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** Each lab's field frame: the box a value is typed or picked in, and what takes focus in it. */
const frames: { lab: string; frame: string; focus?: string }[] = [
  { lab: 'field', frame: '.ui-field__control > input' },
  { lab: 'text-field', frame: '.ui-text-field__input:not(.ui-text-field__group *)' },
  { lab: 'text-field', frame: '.ui-text-field__group' },
  { lab: 'search-field', frame: ".ui-search-field:not([data-label-layout='label-control'])" },
  { lab: 'number-field', frame: '.ui-number-field__group' },
  { lab: 'select-field', frame: '.ui-select-field__trigger' },
  { lab: 'combobox', frame: '.ui-combobox__field' },
  { lab: 'color-field', frame: '.ui-color-field__trigger:not(.ui-color-field__group *)' },
  { lab: 'color-field', frame: '.ui-color-field__group' },
  { lab: 'date-time-field', frame: '.ui-date-time-field__group', focus: '[role="spinbutton"]' },
  { lab: 'relative-date-field', frame: '.ui-relative-date-field__trigger' },
  { lab: 'tags-input', frame: '.ui-tags-input__group' },
  { lab: 'pin-input', frame: '.ui-pin-input__cell' },
  { lab: 'rich-text-editor', frame: '.ui-rich-text-editor__frame', focus: '[contenteditable]' },
  { lab: 'code-editor', frame: ".ui-code-editor[data-variant='surface']", focus: 'textarea' },
  { lab: 'message-composer', frame: '.ui-message-composer', focus: '[contenteditable], textarea' },
  { lab: 'find-bar', frame: '.ui-find-bar__replacement' },
  { lab: 'formula-bar', frame: '.ui-formula-bar__reference' },
  { lab: 'signature-pad', frame: '.ui-signature-pad__input' },
  { lab: 'property-panel', frame: '.ui-property-strip-cell > input' },
  { lab: 'table', frame: '.ui-table__filter' },
  { lab: 'emoji-picker', frame: '.ui-emoji-picker__search' },
];

interface FrameStyle {
  background: string;
  borderColor: string;
  borderStyle: string;
  outline: string;
  /** The opacity the frame is drawn with, through every ancestor. */
  opacity: number;
}

for (const { lab: name, frame, focus } of frames) {
  test(`UIC-LABS-3.8 ${name} ${frame} draws from the field frame tokens`, async ({ page, lab }) => {
    await lab.open(name);
    const result = await page.evaluate(
      ({ frame, focus }) => {
        const tokens = document.createElement('div');
        tokens.style.cssText =
          'background: var(--ref-field-fill); color: var(--ref-field-fill-inactive); border: 1px solid var(--ref-field-border); outline: var(--ref-focus-ring-thin);';
        document.body.append(tokens);
        const resolved = getComputedStyle(tokens);
        const expected = {
          fill: resolved.backgroundColor,
          inactive: resolved.color,
          border: resolved.borderTopColor,
          ring: `${resolved.outlineStyle} ${resolved.outlineWidth} ${resolved.outlineColor}`,
        };
        tokens.remove();

        const isDisabled = (element: Element) => element.closest('[data-disabled]') !== null;
        const isReadOnly = (element: Element) => element.closest('[data-readonly]') !== null;
        const isMarked = (element: Element) =>
          element.closest(
            "[data-validation='invalid'], [data-validation='warning'], [data-invalid], [data-dirty], [data-pending]",
          ) !== null;
        const style = (element: Element | undefined): FrameStyle | null => {
          if (!element) return null;
          const computed = getComputedStyle(element);
          let opacity = 1;
          for (let node: Element | null = element; node; node = node.parentElement)
            opacity *= Number(getComputedStyle(node).opacity);
          return {
            background: computed.backgroundColor,
            borderColor: computed.borderTopColor,
            borderStyle: computed.borderTopStyle,
            outline: `${computed.outlineStyle} ${computed.outlineWidth} ${computed.outlineColor}`,
            opacity,
          };
        };
        const all = [...document.querySelectorAll(frame)];
        const enabled = all.find(
          (element) => !isDisabled(element) && !isReadOnly(element) && !isMarked(element),
        );
        const disabled = all.find(isDisabled);
        const readOnly = all.find((element) => isReadOnly(element) && !isDisabled(element));
        enabled?.setAttribute('data-frame-probe', '');
        const target = enabled?.matches(focus) ? enabled : enabled?.querySelector(focus);
        return {
          expected,
          enabled: style(enabled),
          disabled: style(disabled),
          readOnly: style(readOnly),
          hasFocusTarget: target != null,
        };
      },
      { frame, focus: focus ?? 'input, textarea, button' },
    );
    const { expected } = result;
    expect(result.enabled, 'an enabled frame').not.toBeNull();
    expect(result.enabled).toMatchObject({
      background: expected.fill,
      borderColor: expected.border,
      borderStyle: 'solid',
      opacity: 1,
    });
    if (result.disabled)
      expect(result.disabled).toMatchObject({ background: expected.inactive, opacity: 1 });
    if (result.readOnly)
      expect(result.readOnly).toMatchObject({
        background: expected.inactive,
        borderStyle: 'dashed',
      });

    expect(result.hasFocusTarget, 'something to focus in the frame').toBe(true);
    const probe = page.locator('[data-frame-probe]').first();
    await page.keyboard.press('Shift');
    await probe.evaluate((element, focus) => {
      const target = element.matches(focus) ? element : element.querySelector(focus);
      (target as HTMLElement).focus();
    }, focus ?? 'input, textarea, button');
    await expect(probe).toHaveCSS('border-top-color', await focusColour(page));
    expect(
      await probe.evaluate((element) => {
        const computed = getComputedStyle(element);
        return `${computed.outlineStyle} ${computed.outlineWidth} ${computed.outlineColor}`;
      }),
    ).toBe(expected.ring);
  });
}

async function focusColour(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = 'var(--ref-focus)';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
}
