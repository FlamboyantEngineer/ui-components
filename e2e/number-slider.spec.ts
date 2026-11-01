import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The element has no layout box.');
  return box;
}

/** Presses a thumb at its centre and drags it to a fraction of its track's length. */
async function dragThumb(page: Page, thumb: Locator, track: Locator, fraction: number) {
  await track.scrollIntoViewIfNeeded();
  const from = await boxOf(thumb);
  const rail = await boxOf(track);
  const y = from.y + from.height / 2;
  await page.mouse.move(from.x + from.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width * fraction, y, { steps: 8 });
}

async function numberIn(locator: Locator): Promise<number> {
  return Number(await locator.textContent());
}

test.describe('Number slider lab', () => {
  test('UIC-NUMBER-FIELD-5.1 UIC-NUMBER-FIELD-6.1 UIC-NUMBER-FIELD-6.2 steps with the keyboard and shows keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('number-slider');
    const brightness = field(page, 'brightness');
    const input = brightness.getByRole('slider', { name: 'Brightness' });
    const thumb = brightness.locator('.ui-number-field__thumb');
    await input.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('data-focus-visible', 'true');
    await expect(output(page, 'Brightness')).toHaveText('31');
    await expect(output(page, 'Brightness committed')).toHaveText('31');
    await page.keyboard.press('PageUp');
    await expect(input).toHaveAttribute('aria-valuetext', '41');
    await page.keyboard.press('PageDown');
    await page.keyboard.press('ArrowDown');
    await expect(output(page, 'Brightness')).toHaveText('30');
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(output(page, 'Brightness')).toHaveText('20');
    await page.keyboard.press('End');
    await expect(output(page, 'Brightness')).toHaveText('100');
    await page.keyboard.press('Home');
    await expect(output(page, 'Brightness')).toHaveText('0');
    await expect(output(page, 'Brightness committed')).toHaveText('0');
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-5.1 UIC-NUMBER-FIELD-5.3 drags a thumb and presses the track with the mouse', async ({
    page,
    lab,
  }) => {
    await lab.open('number-slider');
    const brightness = field(page, 'brightness');
    const thumb = brightness.locator('.ui-number-field__thumb');
    const track = brightness.locator('.ui-number-field__track');
    await dragThumb(page, thumb, track, 0.75);
    await expect(thumb).toHaveAttribute('data-dragging', 'true');
    await expect(output(page, 'Brightness committed')).toHaveText('30');
    await expect
      .poll(async () => Math.abs((await numberIn(output(page, 'Brightness'))) - 75))
      .toBeLessThanOrEqual(1);
    await page.mouse.up();
    await expect(thumb).not.toHaveAttribute('data-dragging');
    await expect(output(page, 'Brightness committed')).toHaveText(
      (await output(page, 'Brightness').textContent()) ?? '',
    );
    const rail = await boxOf(track);
    await page.mouse.click(rail.x + rail.width * 0.2, rail.y + rail.height / 2);
    await expect
      .poll(async () => Math.abs((await numberIn(output(page, 'Brightness committed'))) - 20))
      .toBeLessThanOrEqual(1);
    const fill = await boxOf(brightness.locator('.ui-number-field__fill'));
    expect(Math.abs(fill.x - rail.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(fill.width - rail.width * 0.2)).toBeLessThanOrEqual(rail.width * 0.02);
  });

  test('UIC-NUMBER-FIELD-8.1 UIC-NUMBER-FIELD-8.2 UIC-NUMBER-FIELD-8.3 UIC-NUMBER-FIELD-8.4 keeps the range thumbs apart', async ({
    page,
    lab,
  }) => {
    await lab.open('number-slider');
    const range = field(page, 'range');
    const start = range.getByRole('slider', { name: 'Minimum Price' });
    const end = range.getByRole('slider', { name: 'Maximum Price' });
    await expect(range.locator('.ui-number-field__output')).toHaveText(/^€100\s*–\s*€300$/);
    await start.focus();
    await page.keyboard.press('End');
    await expect(output(page, 'Price')).toHaveText('250 to 300');
    await expect(start).toHaveAttribute('aria-valuetext', '€250');
    const [startThumb, endThumb] = [
      range.locator('.ui-number-field__thumb').first(),
      range.locator('.ui-number-field__thumb').last(),
    ];
    const track = range.locator('.ui-number-field__track');
    await dragThumb(page, endThumb, track, 0.1);
    await page.mouse.up();
    await expect(output(page, 'Price')).toHaveText('250 to 300');
    await dragThumb(page, startThumb, track, 0.9);
    await page.mouse.up();
    await expect(output(page, 'Price')).toHaveText('250 to 300');
    await end.focus();
    await page.keyboard.press('End');
    await expect(output(page, 'Price')).toHaveText('250 to 500');
    const fill = await boxOf(range.locator('.ui-number-field__fill'));
    const startBox = await boxOf(startThumb);
    expect(Math.abs(fill.x - (startBox.x + startBox.width / 2))).toBeLessThanOrEqual(1);
  });

  test('UIC-NUMBER-FIELD-5.4 UIC-NUMBER-FIELD-5.5 UIC-NUMBER-FIELD-5.6 lays out marks, outputs, thumb labels and vertical tracks', async ({
    page,
    lab,
  }) => {
    await lab.open('number-slider');
    const marks = field(page, 'marks');
    const track = await boxOf(marks.locator('.ui-number-field__track'));
    const label = await boxOf(marks.locator('.ui-number-field__mark-label', { hasText: '20°' }));
    expect(Math.abs(label.x + label.width / 2 - (track.x + track.width / 3))).toBeLessThanOrEqual(
      1,
    );
    expect(label.y).toBeGreaterThan(track.y + track.height);
    await expect(marks.locator('.ui-number-field__mark').nth(1)).toHaveAttribute(
      'data-in-range',
      'true',
    );
    await expect(marks.locator('.ui-number-field__mark').nth(2)).not.toHaveAttribute(
      'data-in-range',
    );
    const value = await boxOf(marks.locator('.ui-number-field__output'));
    expect(value.x).toBeGreaterThan(track.x + track.width);
    await expect(marks.locator('.ui-number-field__output')).toHaveText('21°C');

    const vertical = field(page, 'vertical');
    const rail = await boxOf(vertical.locator('.ui-number-field__track'));
    expect(rail.height).toBeGreaterThan(rail.width * 10);
    const high = await boxOf(vertical.locator('.ui-number-field__mark-label', { hasText: 'High' }));
    const low = await boxOf(vertical.locator('.ui-number-field__mark-label', { hasText: 'Low' }));
    expect(high.y).toBeLessThan(low.y);
    const thumbLabel = vertical.locator('.ui-number-field__thumb-label');
    await expect(thumbLabel).toHaveCSS('opacity', '0');
    await vertical.getByRole('slider', { name: 'Level' }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(thumbLabel).toHaveText('61');
    await expect(thumbLabel).toHaveCSS('opacity', '1');
    await expect(vertical.locator('.ui-number-field__slider')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    await lab.expectAccessible();
  });

  test('UIC-NUMBER-FIELD-7.1 UIC-NUMBER-FIELD-7.2 restores, undoes, sets the default and blocks an invalid submit', async ({
    page,
    lab,
  }) => {
    await lab.open('number-slider');
    const saved = field(page, 'saved');
    const volume = saved.getByRole('slider', { name: 'Volume' });
    await volume.focus();
    await page.keyboard.press('ArrowRight');
    await expect(saved).toHaveAttribute('data-dirty', 'true');
    await saved.getByRole('button', { name: 'Restore Volume' }).click();
    await expect(volume).toHaveAttribute('aria-valuetext', '40');
    await expect(volume).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(volume).toHaveAttribute('aria-valuetext', '41');
    await saved.locator('.ui-field__label', { hasText: 'Volume' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Set to default' }).click();
    await expect(volume).toHaveAttribute('aria-valuetext', '50');

    await page.getByRole('button', { name: 'Submit' }).click();
    const quiet = field(page, 'quiet');
    const start = quiet.getByRole('slider', { name: 'Minimum Quiet hours' });
    await expect(start).toBeFocused();
    await expect(start).toHaveAttribute('aria-invalid', 'true');
    await expect(quiet.locator('.ui-field__message')).toHaveText(
      'Keep quiet hours to 12 or fewer.',
    );
    await expect(output(page, 'Submitted')).toHaveText('none');
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    await expect(start).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Submitted')).toHaveText('volume=50 quiet-from=10 quiet-to=22');
  });
});

test('UIC-NUMBER-FIELD-8.3 shows the exported helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('number-slider');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(
    call('keepThumbsApart([40, 45], [30, 45], { distance: 10, minValue: 0, maxValue: 100 })'),
  ).toHaveText('[35,45]');
});

test('UIC-NUMBER-FIELD-5.2 keeps the held value on the grid as the bounds change', async ({
  page,
  lab,
}) => {
  await lab.open('number-slider');
  const share = field(page, 'normalized');
  const start = share.getByRole('slider', { name: 'Minimum Share' });
  await start.focus();
  await page.keyboard.press('End');
  await expect(output(page, 'Share')).toHaveText('0.2 to 0.3');
  await page.getByRole('button', { name: 'Narrow to 0.25' }).click();
  await expect(output(page, 'Share')).toHaveText('0.2 to 0.2');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call('snapToStep(0.1 + 0.2, { minValue: 0, maxValue: 1, step: 0.1 })')).toHaveText(
    '0.3',
  );
});

test('UIC-NUMBER-FIELD-8.5 UIC-NUMBER-FIELD-5.4 types a range and a slider value into inputs', async ({
  page,
  lab,
}) => {
  await lab.open('number-slider');
  const age = field(page, 'range-field');
  await expect(age.getByRole('slider')).toHaveCount(0);
  const start = age.getByRole('textbox', { name: 'Minimum Age' });
  const end = age.getByRole('textbox', { name: 'Maximum Age' });
  await start.fill('90');
  await start.press('Enter');
  await expect(output(page, 'Age')).toHaveText('79 to 80');
  await end.focus();
  await page.keyboard.press('ArrowUp');
  await expect(output(page, 'Age')).toHaveText('79 to 81');
  const startBox = await boxOf(start);
  const endBox = await boxOf(end);
  expect(startBox.x + startBox.width).toBeLessThan(endBox.x);
  expect(Math.abs(startBox.y - endBox.y)).toBeLessThan(1);

  const opacity = field(page, 'slider-input');
  const typed = opacity.getByRole('textbox', { name: 'Opacity' });
  await typed.fill('25');
  await typed.press('Enter');
  await expect(opacity.getByRole('slider', { name: 'Opacity' })).toHaveValue('25');
  const inputBox = await boxOf(typed);
  const track = await boxOf(opacity.locator('.ui-number-field__track'));
  expect(inputBox.x + inputBox.width).toBeLessThan(track.x);
  expect(track.width).toBeGreaterThan(80);
});
