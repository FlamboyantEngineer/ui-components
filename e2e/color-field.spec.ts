import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell, controlHeight } from './fixtures.js';

function cell(page: Page, state: string, layout = 'label-control'): Locator {
  return matrixCell(page, `state=${state} layout=${layout}`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Color Field lab', () => {
  test('UIC-COLOR-FIELD-1.2 shows a swatch and the colour text for each state and format', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const trigger = cell(page, 'resting').locator('.ui-color-field__trigger');
    await expect(trigger).toHaveAccessibleName('Accent #336699');
    expect((await trigger.boundingBox())?.height).toBe(await controlHeight(page, 'md'));
    await expect(cell(page, 'resting').locator('.ui-color-swatch')).toHaveCSS(
      'background-color',
      'rgb(51, 102, 153)',
    );
    await expect(cell(page, 'required').locator('.ui-color-field__value')).toHaveText('No color');
    await expect(
      field(page, 'placeholder').locator('.ui-color-field__trigger'),
    ).toHaveAccessibleName('Border Same as the text');
    const readOnly = cell(page, 'read-only').locator('.ui-color-field__trigger');
    await expect(readOnly).toBeEnabled();
    await readOnly.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(cell(page, 'disabled').locator('.ui-color-field__trigger')).toBeDisabled();
    await expect(matrixCell(page, 'format=rgb').locator('.ui-color-field__value')).toHaveText(
      'rgb(51, 102, 153)',
    );
    await expect(matrixCell(page, 'format=hsb').locator('.ui-color-field__value')).toHaveText(
      'hsb(210, 66.67%, 60%)',
    );
    await lab.expectAccessible();
  });

  test('UIC-COLOR-FIELD-1.3 UIC-COLOR-FIELD-2.1 picks in the popover and commits on close', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const picking = field(page, 'picking');
    const trigger = picking.locator('.ui-color-field__trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Marker' });
    await expect(dialog).toBeVisible();
    const popover = page.locator('.ui-color-field__popover');
    await expect(popover).toHaveAttribute('data-placement', 'bottom');
    const box = await popover.boundingBox();
    const anchor = await trigger.boundingBox();
    expect(box?.y).toBeGreaterThan((anchor?.y ?? 0) + (anchor?.height ?? 0));
    expect((await page.locator('.ui-color-field__area').boundingBox())?.width).toBe(192);
    await lab.expectAccessible('.ui-color-field__popover');

    await dialog.getByRole('slider', { name: 'Hue' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(output(page, 'Changed')).toHaveText(/^#[0-9a-f]{6}$/);
    await expect(output(page, 'Committed')).toHaveText('none');
    const hex = dialog.getByRole('textbox', { name: 'Hex color' });
    await hex.fill('#FF8800');
    await hex.press('Enter');
    await expect(output(page, 'Changed')).toHaveText('#ff8800');
    await expect(hex).toBeFocused();
    await expect(hex).toHaveValue('#FF8800');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(output(page, 'Committed')).toHaveText('#ff8800');
    await expect(trigger).toHaveAccessibleName('Marker #FF8800');

    await trigger.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    await trigger.press('Enter');
    await expect(popover).toHaveAttribute('data-placement', 'top');
    const flipped = await popover.boundingBox();
    const movedAnchor = await trigger.boundingBox();
    if (!flipped || !movedAnchor) throw new Error('picker or trigger not rendered');
    expect(flipped.y + flipped.height).toBeLessThan(movedAnchor.y);
    await page.keyboard.press('Escape');
  });

  test('UIC-COLOR-FIELD-2.2 clears an optional colour and keeps a required one', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const trigger = field(page, 'picking').locator('.ui-color-field__trigger');
    await trigger.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear' }).click();
    await expect(output(page, 'Committed')).toHaveText('empty');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toHaveAccessibleName('Marker No color');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(trigger).toHaveAccessibleName('Marker #2E8B57');
    await page.keyboard.press('Backspace');
    await expect(trigger).toHaveAccessibleName('Marker No color');

    const required = field(page, 'required').locator('.ui-color-field__trigger');
    await required.focus();
    await page.keyboard.press('Delete');
    await expect(required).toHaveAccessibleName('Highlight #FFD700');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Clear' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('UIC-COLOR-FIELD-2.3 restores, undoes and sets the default from the field menu', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const dirty = field(page, 'dirty');
    const trigger = dirty.locator('.ui-color-field__trigger');
    await dirty.getByRole('button', { name: 'Theme actions' }).click();
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(trigger).toHaveAccessibleName('Theme #000000');
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await dirty.getByRole('button', { name: 'Restore Theme' }).click();
    await expect(trigger).toHaveAccessibleName('Theme #336699');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(trigger).toHaveAccessibleName('Theme #000000');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Saved')).toHaveText('#000000');
  });

  test('UIC-COLOR-FIELD-3.1 UIC-COLOR-FIELD-3.2 UIC-COLOR-FIELD-3.3 switches formats and edits channels', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    await expect(matrixCell(page, 'format=hexa').locator('.ui-color-field__value')).toHaveText(
      '#336699BF',
    );
    const formats = field(page, 'formats');
    const trigger = formats.locator('.ui-color-field__trigger');
    await expect(trigger).toHaveAccessibleName('Overlay rgba(51, 102, 153, 0.5)');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Overlay' });
    await expect(dialog.getByRole('radio', { name: 'RGBA' })).toBeChecked();
    const channels = dialog.locator('.ui-color-field__channel');
    await expect(channels).toHaveCount(4);
    const boxes = await channels.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().top),
    );
    expect(new Set(boxes).size).toBe(1);
    await expect(dialog.getByRole('slider', { name: 'Alpha' })).toBeVisible();
    await lab.expectAccessible('.ui-color-field__popover');
    const red = dialog.getByRole('textbox', { name: 'Red' });
    await red.fill('255');
    await red.press('Enter');
    await expect(trigger).toHaveAccessibleName('Overlay rgba(255, 102, 153, 0.5)');
    await dialog.getByRole('radio', { name: 'HSLA' }).click();
    await expect(output(page, 'Format')).toHaveText('hsla');
    await expect(dialog.getByRole('textbox', { name: 'Lightness' })).toBeVisible();
    await dialog.getByRole('radio', { name: 'HEX', exact: true }).click();
    await expect(dialog.getByRole('slider', { name: 'Alpha' })).toHaveCount(0);
    await expect(dialog.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#FF6699');
    await page.keyboard.press('Escape');
    await expect(output(page, 'Format committed')).toHaveText('#ff669980');
    await expect(trigger).toHaveAccessibleName('Overlay #FF6699');
  });

  test('UIC-COLOR-FIELD-3.4 stores the value in its value format', async ({ page, lab }) => {
    await lab.open('color-field');
    const trigger = field(page, 'value-format').locator('.ui-color-field__trigger');
    await expect(trigger).toHaveAccessibleName('Ink hsl(210, 50%, 40%)');
    await trigger.click();
    const hue = page.getByRole('dialog').getByRole('textbox', { name: 'Hue' });
    await hue.fill('0');
    await hue.press('Enter');
    await page.keyboard.press('Escape');
    await expect(output(page, 'Format committed')).toHaveText('rgb(153, 51, 51)');
  });

  test('UIC-COLOR-FIELD-1.3 UIC-COLOR-FIELD-4.1 UIC-COLOR-FIELD-4.2 picks a preset swatch and samples the screen', async ({
    page,
    lab,
  }) => {
    await page.addInitScript(() => {
      Object.assign(window, {
        EyeDropper: function EyeDropper() {
          return { open: () => Promise.resolve({ sRGBHex: '#e69500' }) };
        },
      });
    });
    await lab.open('color-field');
    const trigger = field(page, 'presets').locator('.ui-color-field__trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Label colour' });
    await expect(dialog).toBeVisible();
    const swatches = dialog.getByRole('listbox', { name: 'Color swatches' });
    const clear = dialog.getByRole('button', { name: 'Clear', exact: true });
    const eyeDropper = dialog.getByRole('button', { name: 'Pick a color from the screen' });
    const clearBox = await clear.boundingBox();
    const eyeBox = await eyeDropper.boundingBox();
    const swatchBox = await swatches.boundingBox();
    const popover = await page.locator('.ui-color-field__popover').boundingBox();
    if (!clearBox || !eyeBox || !swatchBox || !popover)
      throw new Error('picker footer not rendered');
    expect(Math.abs(clearBox.y - eyeBox.y)).toBeLessThan(1);
    expect(clearBox.y).toBeGreaterThan(swatchBox.y + swatchBox.height);
    expect(clearBox.y + clearBox.height).toBeLessThan(popover.y + popover.height);
    expect(eyeBox.y + eyeBox.height).toBeLessThan(popover.y + popover.height);
    await clear.focus();
    await page.keyboard.press('Tab');
    await expect(eyeDropper).toBeFocused();
    await expect(swatches.getByRole('option').nth(3)).toHaveAttribute('aria-selected', 'true');
    await swatches.getByRole('option').nth(3).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAccessibleName('Label colour #7B4FA0');
    await expect(dialog).toBeVisible();
    await eyeDropper.click();
    await expect(trigger).toHaveAccessibleName('Label colour #E69500');
    await lab.expectAccessible('.ui-color-field__popover');
    await page.keyboard.press('Escape');
    await expect(output(page, 'Preset committed')).toHaveText('#e69500');
  });

  test('UIC-COLOR-FIELD-4.1 picks either place of a colour listed twice', async ({ page, lab }) => {
    await lab.open('color-field');
    const trigger = field(page, 'presets').locator('.ui-color-field__trigger');
    await trigger.click();
    const swatches = page
      .getByRole('dialog', { name: 'Label colour' })
      .getByRole('listbox', { name: 'Color swatches' });
    const options = swatches.getByRole('option');
    await expect(options).toHaveCount(7);
    await options.nth(6).click();
    await expect(trigger).toHaveAccessibleName('Label colour #CC3300');
    await expect(options.nth(6)).toHaveAttribute('aria-selected', 'true');
    await options.nth(2).click();
    await options.nth(0).click();
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('UIC-COLOR-FIELD-4.2 discards a screen sample once its picker closes', async ({
    page,
    lab,
  }) => {
    await page.addInitScript(() => {
      const samples: Array<(hex: string) => void> = [];
      Object.assign(window, {
        labSamples: samples,
        EyeDropper: function EyeDropper() {
          return {
            open: () => new Promise((resolve) => samples.push((hex) => resolve({ sRGBHex: hex }))),
          };
        },
      });
    });
    await lab.open('color-field');
    const trigger = field(page, 'presets').locator('.ui-color-field__trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Label colour' });
    await dialog.getByRole('button', { name: 'Pick a color from the screen' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.evaluate(() => {
      const { labSamples } = window as unknown as { labSamples: Array<(hex: string) => void> };
      labSamples[0]?.('#ff0000');
    });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAccessibleName('Label colour #336699');
    await page.keyboard.press('Escape');
    // Nothing changed, so closing the picker commits nothing.
    await expect(output(page, 'Preset committed')).toHaveText('none');
  });

  test('UIC-COLOR-FIELD-4.3 types a colour into the closed field', async ({ page, lab }) => {
    await lab.open('color-field');
    const typing = field(page, 'typing');
    const input = typing.getByRole('textbox', { name: 'Text colour' });
    await expect(input).toHaveValue('#2E8B57');
    const button = typing.getByRole('button', { name: 'Text colour picker' });
    const frame = await typing.locator('.ui-color-field__group').boundingBox();
    expect(frame?.height).toBe(await controlHeight(page, 'md'));
    expect((await button.boundingBox())?.y).toBeGreaterThanOrEqual(frame?.y ?? 0);
    await input.fill('hsl(0, 100%, 50%)');
    await input.press('Enter');
    await expect(output(page, 'Typed committed')).toHaveText('#ff0000');
    await expect(input).toHaveValue('#FF0000');
    await expect(input).toBeFocused();
    await input.fill('nonsense');
    await input.press('Tab');
    await expect(input).toHaveValue('#FF0000');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(input).toHaveValue('#2E8B57');
    await button.click();
    await expect(page.getByRole('dialog', { name: 'Text colour' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-FIELD-1.11 UIC-COLOR-FIELD-4.3 keeps a typed colour uncommitted until focus leaves the field', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const typing = field(page, 'typing');
    const input = typing.getByRole('textbox', { name: 'Text colour' });
    await input.fill('#ff0000');
    // Leaving the input for the swatch button applies the text; the field stays dirty.
    await page.keyboard.press('Shift+Tab');
    await expect(typing.getByRole('button', { name: 'Text colour picker' })).toBeFocused();
    await expect(input).toHaveValue('#FF0000');
    await expect(typing).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(typing.getByRole('button', { name: 'Restore Text colour' })).toBeFocused();
    await expect(output(page, 'Typed committed')).toHaveText('none');
    await page.keyboard.press('Tab');
    await expect(output(page, 'Typed committed')).toHaveText('#ff0000');
    await expect(typing).not.toHaveAttribute('data-dirty');
    await expect(typing).not.toHaveAttribute('data-focused');
  });

  test('UIC-COLOR-FIELD-4.3 leaves Enter and Escape during a composition to the input method', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const input = field(page, 'typing').getByRole('textbox', { name: 'Text colour' });
    await input.fill('rgb(12');
    await input.dispatchEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true });
    await expect(input).toHaveValue('rgb(12');
    await input.fill('rgb(12, 0, 0)');
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true });
    await expect(output(page, 'Typed committed')).toHaveText('none');
    await input.press('Enter');
    await expect(output(page, 'Typed committed')).toHaveText('#0c0000');
  });

  test('UIC-COLOR-FIELD-2.4 submits each named colour once in its stored format', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Form')).toHaveText('brand=#336699 highlight=#e69500');
  });

  test('UIC-COLOR-FIELD-1.3 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('color-field', { theme: 'dark' });
    await field(page, 'picking').locator('.ui-color-field__trigger').click();
    await expect(page.locator('.ui-color-field__popover')).toHaveCSS(
      'background-color',
      'rgb(33, 40, 48)',
    );
    await lab.expectAccessible('.ui-color-field__popover');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });

  test('UIC-COLOR-FIELD-4.3 makes a typed colour the value before it commits', async ({
    page,
    lab,
  }) => {
    await lab.open('color-field');
    const input = field(page, 'typing').getByRole('textbox', { name: 'Text colour' });
    await input.fill('#aabbcc');
    await expect(output(page, 'Typed value')).toHaveText('#aabbcc');
    await expect(output(page, 'Typed committed')).toHaveText('none');
    await expect(input).toHaveValue('#aabbcc');
    await input.press('Escape');
    await expect(output(page, 'Typed value')).toHaveText('#2e8b57');
    await expect(input).toHaveValue('#2E8B57');
  });

  test('UIC-COLOR-FIELD-2.4 reports a stored value that is no colour', async ({ page, lab }) => {
    await lab.open('color-field');
    const unreadable = field(page, 'unreadable');
    await expect(unreadable).toHaveAttribute('data-validation', 'invalid');
    await expect(unreadable).toContainText('Enter a color, such as #3366ff.');
  });
});
