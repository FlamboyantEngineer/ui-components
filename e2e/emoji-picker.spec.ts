import { expect, test, type LabFixture } from './fixtures.js';
import type { Page } from '@playwright/test';

async function openPopover(page: Page, lab: LabFixture, theme?: string) {
  await lab.open('emoji-picker', theme ? { theme } : {});
  await page.locator('[data-lab-trigger]').click();
  const picker = page.locator('[data-lab-picker="popover"]');
  await expect(picker.getByRole('grid')).toBeVisible();
  return picker;
}

test.describe('Emoji Picker lab', () => {
  test('UIC-EMOJI-PICKER-1.1 UIC-EMOJI-PICKER-2.4 shows the loading, failed and loaded states', async ({
    page,
    lab,
  }) => {
    test.slow(); // axe walks several hundred emoji cells
    await lab.open('emoji-picker');
    const loading = page.locator('[data-lab-cell="state=loading skin tones=shown"]');
    await expect(loading.locator('.ui-emoji-picker')).toHaveAttribute('data-loading', 'true');
    await expect(loading.getByRole('status')).toHaveText('Loading');
    const failed = page.locator('[data-lab-cell="state=failed skin tones=shown"]');
    await expect(failed.getByRole('status')).toHaveText('Emoji could not be loaded.');
    const loaded = page.locator('[data-lab-cell="state=loaded skin tones=shown"]');
    await expect(loaded.getByRole('grid', { name: 'Smileys & Emotion' })).toBeVisible();
    await expect(loaded.getByRole('radio', { name: 'Medium', exact: true })).toBeChecked();
    const hidden = page.locator('[data-lab-cell="state=loaded skin tones=hidden"]');
    await expect(hidden.getByRole('radiogroup')).toHaveCount(0);
    const box = await loaded.locator('.ui-emoji-picker').boundingBox();
    expect(box?.width).toBe(320);
    await lab.expectAccessible();
  });

  test('UIC-EMOJI-PICKER-3.1 UIC-EMOJI-PICKER-2.1 UIC-EMOJI-PICKER-1.4 searches, chooses and returns focus', async ({
    page,
    lab,
  }) => {
    const picker = await openPopover(page, lab);
    const search = picker.getByRole('searchbox', { name: 'Search emoji' });
    await expect(search).toBeFocused();
    await page.keyboard.type('apple');
    await expect(page.locator('[data-lab-output="search"]')).toHaveText('apple');
    const results = picker.getByRole('grid', { name: 'Search results' });
    await expect(results.getByRole('row').first()).toHaveAccessibleName('red apple');
    await page.keyboard.press('ArrowDown');
    await expect(results.getByRole('row').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(picker).toHaveCount(0);
    await expect(page.locator('[data-lab-output="choice"]')).toHaveText('🍎 red apple (default)');
    await expect(page.locator('[data-lab-output="recent"]')).toHaveText('🍎 👍 :ship_it: 🎉');
    await expect(page.locator('[data-lab-trigger]')).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(picker.getByRole('grid', { name: 'Recently used' })).toBeVisible();
    await expect(picker.getByRole('row').first()).toHaveAccessibleName('red apple');
    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);
    await expect(page.locator('[data-lab-trigger]')).toBeFocused();
  });

  test('UIC-EMOJI-PICKER-1.3 UIC-EMOJI-PICKER-1.2 moves through the grid in two dimensions', async ({
    page,
    lab,
  }) => {
    const picker = await openPopover(page, lab);
    await picker.getByRole('tab', { name: 'Smileys & Emotion' }).click();
    const grid = picker.getByRole('grid', { name: 'Smileys & Emotion' });
    const rows = grid.getByRole('row');
    await rows.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(8)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(rows.nth(9)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(rows.nth(1)).toBeFocused();
    await expect(picker.locator('.ui-emoji-picker__preview-label')).toHaveText(
      'grinning face with big eyes',
    );
    await page.keyboard.press('End');
    await expect(rows.last()).toBeFocused();
    const cell = await rows.first().boundingBox();
    expect(Math.round(cell?.width ?? 0)).toBe(Math.round(cell?.height ?? 0));
  });

  test('UIC-EMOJI-PICKER-2.4 applies the chosen skin tone and reports it', async ({
    page,
    lab,
  }) => {
    const picker = await openPopover(page, lab);
    await picker.getByRole('radio', { name: 'Dark', exact: true }).click({ force: true });
    await expect(page.locator('[data-lab-output="tone"]')).toHaveText('dark');
    await picker.getByRole('tab', { name: 'People & Body' }).click();
    const wave = picker.getByRole('row', { name: 'waving hand' });
    await expect(wave).toHaveText('👋🏿');
    await wave.click();
    await expect(page.locator('[data-lab-output="choice"]')).toHaveText('👋🏿 waving hand (dark)');
  });

  test('UIC-EMOJI-PICKER-2.3 UIC-EMOJI-PICKER-1.3 shows custom emoji and caller-drawn glyphs', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const picker = page.locator('[data-lab-picker="custom"]');
    const custom = picker.getByRole('grid', { name: 'Custom' });
    await expect(custom.getByRole('row')).toHaveCount(3);
    await expect(custom.getByRole('row').nth(1)).toHaveAccessibleName(':plus_one:');
    const image = custom.locator('.ui-emoji-picker__image').first();
    expect((await image.boundingBox())?.width).toBe(22);
    await picker.getByRole('tab', { name: 'Flags' }).click();
    await expect(picker.getByRole('row', { name: 'flag: Japan' })).toHaveText('JP');
    await picker.getByRole('searchbox').fill(':plus_one:');
    await expect(picker.getByRole('grid', { name: 'Search results' })).toBeVisible();
    await expect(picker.getByRole('row').first()).toHaveAccessibleName(':plus_one:');
  });

  test('UIC-EMOJI-PICKER-3.2 passes axe in the dark theme with the popover open', async ({
    page,
    lab,
  }) => {
    test.slow(); // axe walks several hundred emoji cells
    await openPopover(page, lab, 'dark');
    await lab.expectAccessible('.ui-emoji-picker__popover');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });
});
