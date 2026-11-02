import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function cell(page: Page, state: string, value: string): Locator {
  return matrixCell(page, `state=${state} value=${value}`).locator(`.ui-switch`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not rendered');
  return rect;
}

test.describe('Switch lab', () => {
  test('UIC-SWITCH-1.1 draws a track whose thumb slides to the end when on', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    const offTrack = await box(cell(page, 'resting', 'off').locator('.ui-switch__track'));
    expect(offTrack.width).toBe(30);
    expect(offTrack.height).toBe(18);
    const offThumb = await box(cell(page, 'resting', 'off').locator('.ui-switch__thumb'));
    const onTrack = await box(cell(page, 'resting', 'on').locator('.ui-switch__track'));
    const onThumb = await box(cell(page, 'resting', 'on').locator('.ui-switch__thumb'));
    expect(onThumb.x - onTrack.x - (offThumb.x - offTrack.x)).toBe(12);
    await expect(cell(page, 'resting', 'on').getByRole('switch')).toBeChecked();
    await expect(page.getByRole('switch', { name: 'Show the grid' })).toBeChecked();
    await lab.expectAccessible();
  });

  test('UIC-SWITCH-1.2 flips from the label and Space, and not while locked', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    await page.getByText('Bluetooth', { exact: true }).click();
    await expect(output(page, 'Settings')).toHaveText('Wi-Fi on, Bluetooth on');
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('switch', { name: 'Wi-Fi' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(output(page, 'Settings')).toHaveText('Wi-Fi off, Bluetooth on');
    const locked = cell(page, 'read-only', 'on');
    await locked.locator('.ui-switch__label').click();
    await expect(locked.getByRole('switch')).toBeChecked();
    await expect(cell(page, 'disabled', 'off').getByRole('switch')).toBeDisabled();
  });

  test('UIC-SWITCH-1.3 rings the track on keyboard focus and submits its value', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    const wifi = page.locator('[data-lab-field="wifi"]');
    await wifi.getByRole('switch').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(wifi).toHaveAttribute('data-focus-visible', 'true');
    await expect(wifi.locator('.ui-switch__track')).toHaveCSS('outline-style', 'solid');
    await page.getByText('Push', { exact: true }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(output(page, 'Submitted')).toHaveText('email, push');
  });

  test('UIC-SWITCH-1.4 sizes the track and thumb as a Boolean Field switch does', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    const tracks = { xs: [22, 12, 6], sm: [26, 14, 8], md: [30, 18, 10], lg: [34, 20, 12] };
    /** The track and thumb of the bare switch and of the field's, in each size and value. */
    const measure = async () => {
      const result: number[][] = [];
      for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
        for (const value of ['off', 'on', 'unset']) {
          const scope = matrixCell(page, `size=${size} value=${value}`);
          for (const owner of [':scope > .ui-switch', '.ui-boolean-field .ui-switch']) {
            const control = scope.locator(owner);
            const track = await box(control.locator('.ui-switch__track'));
            const thumb = await box(control.locator('.ui-switch__thumb'));
            expect([track.width, track.height, thumb.width]).toEqual(tracks[size]);
            result.push([thumb.x - track.x, thumb.y - track.y]);
          }
        }
      }
      return result;
    };
    const pairs = (all: number[][]) => all.filter((_, index) => index % 2 === 0);
    const ltr = await measure();
    // The field's switch sits exactly where the bare one does inside its track.
    expect(pairs(ltr)).toEqual(ltr.filter((_, index) => index % 2 === 1));
    // A larger root font leaves the geometry alone, and right to left mirrors it the same way.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
      document.documentElement.dir = 'rtl';
    });
    const rtl = await measure();
    expect(pairs(rtl)).toEqual(rtl.filter((_, index) => index % 2 === 1));
    await expect(
      matrixCell(page, 'size=xs value=unset').locator(':scope > .ui-switch'),
    ).toHaveAttribute('data-indeterminate', 'true');
  });

  test('UIC-SWITCH-1.1 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('switch', { theme: 'dark' });
    await expect(cell(page, 'resting', 'on').locator('.ui-switch__track')).toHaveCSS(
      'background-color',
      'rgb(31, 111, 235)',
    );
    await lab.expectAccessible();
  });

  test('UIC-SWITCH-1.1 keeps its thumb circular during mouse presses and the slide', async ({
    page,
    lab,
  }) => {
    await lab.open('switch');
    const root = page.locator('[data-lab-field="bluetooth"]');
    const track = root.locator('.ui-switch__track');
    await track.scrollIntoViewIfNeeded();
    await track.hover();
    await page.mouse.down();
    await expect(root).toHaveAttribute('data-pressed', 'true');
    const thumb = root.locator('.ui-switch__thumb');
    const pressed = await box(thumb);
    expect(pressed.width).toBe(pressed.height);
    await page.mouse.up();
    await expect(root.getByRole('switch')).toBeChecked();
    const frames = await thumb.evaluate(async (element) => {
      const samples = [];
      for (let frame = 0; frame < 16; frame += 1) {
        await new Promise(requestAnimationFrame);
        const bounds = element.getBoundingClientRect();
        samples.push({ width: bounds.width, height: bounds.height });
      }
      return samples;
    });
    expect(frames.every(({ width, height }) => width === height)).toBe(true);
  });

  test('UIC-SWITCH-1.1 draws a label of zero and is named by it', async ({ page, lab }) => {
    await lab.open('switch');
    const field = page.locator('[data-lab-field="zero"]');
    await expect(field.locator('.ui-switch__label')).toHaveText('0');
    await expect(field.getByRole('switch', { name: '0', exact: true })).toHaveCount(1);
  });
});
