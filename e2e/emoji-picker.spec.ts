import { expect, test, type LabFixture, matrixCell } from './fixtures.js';
import type { Page } from '@playwright/test';

async function openPopover(page: Page, lab: LabFixture, theme?: string) {
  await lab.open('emoji-picker', theme ? { theme } : {});
  await page.locator('[data-lab-trigger]').click();
  const picker = page.locator('[data-lab-picker="popover"]');
  await expect(picker.getByRole('grid')).toBeVisible();
  return picker;
}

test.describe('Emoji Picker lab', () => {
  test('UIC-EMOJI-PICKER-1.2 keeps the category browsed when recent and custom tabs arrive', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const demo = page.locator('[data-lab-demo="arriving"]');
    const smileys = demo.getByRole('tab', { name: 'Smileys & Emotion' });
    await expect(smileys).toHaveAttribute('aria-selected', 'true');
    const grid = demo.getByRole('grid', { name: 'Smileys & Emotion' });
    const first = grid.getByRole('row').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(demo.getByRole('tab', { name: 'Recently used' })).toBeVisible();
    await expect(smileys).toHaveAttribute('aria-selected', 'true');
    await expect(first).toBeFocused();
    await demo.getByRole('button', { name: 'Load custom emoji' }).click();
    await expect(demo.getByRole('tab', { name: 'Custom' })).toBeVisible();
    await expect(smileys).toHaveAttribute('aria-selected', 'true');
    await lab.expectAccessible('[data-lab-demo="arriving"]');
  });

  test('UIC-EMOJI-PICKER-1.6 renders the emoji in view of a virtualized grid and reaches the last', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const demo = page.locator('[data-lab-demo="virtualized"]');
    const grid = demo.getByRole('grid', { name: 'Smileys & Emotion' });
    await expect(grid).toHaveAttribute('data-virtualized', 'true');
    const count = Number(await grid.getAttribute('aria-rowcount'));
    const shown = await grid.getByRole('row').count();
    expect(shown).toBeGreaterThan(8);
    expect(shown).toBeLessThan(count || 400);
    const box = await grid.getByRole('row').first().boundingBox();
    expect(box && Math.round(box.width)).toBe(Math.round(box?.height ?? 0));
    await grid.getByRole('row').first().focus();
    await page.keyboard.press('End');
    const focused = grid.locator('[role="row"]:focus');
    await expect(focused).toBeVisible();
    await expect(grid.getByRole('row').first()).not.toBeFocused();
    await demo.getByRole('searchbox').focus();
    await page.keyboard.press('ArrowDown');
    await expect(grid.locator('[role="row"]:focus')).toHaveAttribute('aria-rowindex', '1');
    await lab.expectAccessible('[data-lab-demo="virtualized"]');
  });

  test('UIC-EMOJI-PICKER-1.1 UIC-EMOJI-PICKER-2.4 shows the loading, failed and loaded states', async ({
    page,
    lab,
  }) => {
    test.slow(); // axe walks several hundred emoji cells
    await lab.open('emoji-picker');
    const loading = matrixCell(page, 'state=loading skin tones=shown');
    await expect(loading.locator('.ui-emoji-picker')).toHaveAttribute('data-loading', 'true');
    await expect(loading.getByRole('status')).toHaveText('Loading');
    const failed = matrixCell(page, 'state=failed skin tones=shown');
    await expect(failed.getByRole('status')).toHaveText('Emoji could not be loaded.');
    // The custom emoji are not shown, so Enter chooses none of them.
    await failed.getByRole('searchbox').fill('ship');
    await page.keyboard.press('Enter');
    await expect(failed.getByRole('status')).toHaveText('Emoji could not be loaded.');
    await expect(failed.getByRole('searchbox')).toHaveValue('ship');
    await failed.getByRole('searchbox').fill('');
    const loaded = matrixCell(page, 'state=loaded skin tones=shown');
    await expect(loaded.getByRole('grid', { name: 'Smileys & Emotion' })).toBeVisible();
    await expect(loaded.getByRole('radio', { name: 'Medium', exact: true })).toBeChecked();
    const hidden = matrixCell(page, 'state=loaded skin tones=hidden');
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

  test('UIC-EMOJI-PICKER-1.4 keeps a modal around the picker open on a choice', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    await page.getByRole('button', { name: 'Choose a status emoji' }).click();
    const modal = page.getByRole('dialog', { name: 'Status emoji' });
    const picker = modal.locator('[data-lab-picker="modal"]');
    await picker.getByRole('row', { name: 'grinning face' }).first().click();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Chosen: 😀');
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

  test('UIC-EMOJI-PICKER-4.4 names and finds emoji in the language of the locale', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const french = page.locator('[data-lab-picker="fr-FR"]');
    const smileys = french.getByRole('grid', { name: 'Smileys & Emotion' });
    await expect(smileys.getByRole('row').first()).toHaveAccessibleName('visage rieur');
    await french.getByRole('searchbox').fill('pomme');
    await expect(
      french
        .getByRole('grid', { name: 'Search results' })
        .getByRole('row', { name: 'pomme rouge' }),
    ).toBeVisible();
    const japanese = page.locator('[data-lab-picker="ja-JP"]');
    await expect(
      japanese.getByRole('grid', { name: 'Smileys & Emotion' }).getByRole('row').first(),
    ).toHaveAccessibleName('にっこり笑う');
  });

  test('UIC-EMOJI-PICKER-5.2 UIC-EMOJI-PICKER-5.3 UIC-EMOJI-PICKER-5.4 offers the chosen categories and emoji', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const picker = page.locator('[data-lab-picker="offered"]');
    await expect(picker.getByRole('tab')).toHaveText([
      /Food & Drink$/,
      /Animals & Nature$/,
      /Smileys & Emotion$/,
    ]);
    await expect(picker.getByRole('grid', { name: 'Food & Drink' })).toBeVisible();
    await expect(picker.getByRole('row', { name: 'red apple' })).toBeVisible();
    await expect(picker.getByRole('row', { name: 'hamburger' })).toHaveCount(0);
    const search = picker.getByRole('searchbox');
    await search.fill('melting');
    await expect(picker.getByRole('status')).toHaveText('No results');
    await search.fill('smiling face with tear');
    await expect(picker.getByRole('row').first()).toHaveAccessibleName('smiling face with tear');
    await search.fill('rocket');
    await expect(picker.getByRole('status')).toHaveText('No results');
  });

  test('UIC-EMOJI-PICKER-5.1 leaves out the emoji and flags the platform cannot draw', async ({
    page,
    lab,
  }) => {
    // A platform whose canvas draws Emoji 13.1 at most, and country flags as letters.
    await page.addInitScript(() => {
      const unsupported = (glyph: string) =>
        (glyph.codePointAt(0) ?? 0) >= 0x1fae0 ||
        glyph === '\u{1F642}\u200D\u2194\uFE0F' ||
        /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(glyph);
      function FakeCanvas() {
        const context = {
          font: '',
          textBaseline: '',
          fillStyle: '',
          glyph: '',
          clearRect() {},
          fillText(glyph: string) {
            context.glyph = glyph;
          },
          getImageData() {
            if (!unsupported(context.glyph))
              return { data: Uint8ClampedArray.from([9, 9, 9, 255]) };
            const red = context.fillStyle === '#ff0000';
            return { data: Uint8ClampedArray.from([red ? 255 : 0, 0, red ? 0 : 255, 255]) };
          },
          measureText: () => ({ width: 16 }),
        };
        return { getContext: () => context };
      }
      Object.defineProperty(window, 'OffscreenCanvas', { value: FakeCanvas });
    });
    const picker = await openPopover(page, lab);
    await picker.getByRole('tab', { name: 'Flags' }).click();
    const flags = picker.getByRole('grid', { name: 'Flags' });
    await expect(flags.getByRole('row', { name: 'chequered flag' })).toBeVisible();
    await expect(flags.getByRole('row', { name: 'flag: Japan' })).toHaveCount(0);
    await picker.getByRole('searchbox').fill('melting');
    await expect(picker.getByRole('status')).toHaveText('No results');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);

    const drawn = page.locator('[data-lab-picker="custom"]');
    await drawn.getByRole('tab', { name: 'Flags' }).click();
    await expect(drawn.getByRole('row', { name: 'flag: Japan' })).toHaveText('JP');
  });

  test('UIC-EMOJI-PICKER-5.1 keeps the emoji a colour emoji font draws', async ({ page, lab }) => {
    const picker = await openPopover(page, lab);
    await picker.getByRole('tab', { name: 'Flags' }).click();
    await expect(picker.getByRole('row', { name: 'flag: Japan' })).toBeVisible();
    await picker.getByRole('searchbox').fill('melting');
    await expect(picker.getByRole('row', { name: 'melting face' })).toBeVisible();
  });

  test('UIC-EMOJI-PICKER-6.1 UIC-EMOJI-PICKER-6.2 works in a layout the page composes', async ({
    page,
    lab,
  }) => {
    await lab.open('emoji-picker');
    const picker = page.locator('[data-lab-picker="parts"]');
    const tones = picker.locator('.ui-emoji-picker__skin-tones');
    const search = picker.locator('.ui-emoji-picker__search');
    expect((await tones.boundingBox())?.y).toBeLessThan((await search.boundingBox())?.y ?? 0);
    await expect(picker.locator('.ui-emoji-picker__footer')).toHaveCount(0);
    await tones.getByRole('radio', { name: 'Dark', exact: true }).click({ force: true });
    await picker.getByRole('tab', { name: 'People & Body' }).click();
    await picker.getByRole('row', { name: 'waving hand' }).hover();
    await expect(picker.locator('[data-lab-output="active"]')).toHaveText('👋🏿 waving hand (dark)');
    await picker.getByRole('searchbox').fill('banana');
    await expect(picker.getByRole('grid', { name: 'Search results' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(picker.getByRole('row', { name: 'banana' })).toBeFocused();
    await expect(picker.locator('[data-lab-output="active"]')).toHaveText('🍌 banana (default)');
  });

  test('UIC-EMOJI-PICKER-5.1 shows every emoji when the browser denies canvas readback', async ({
    page,
    lab,
  }) => {
    await page.addInitScript(() => {
      OffscreenCanvasRenderingContext2D.prototype.getImageData = () => {
        throw new DOMException(
          'The canvas has been tainted by cross-origin data.',
          'SecurityError',
        );
      };
    });
    await lab.open('emoji-picker');
    const loaded = matrixCell(page, 'state=loaded skin tones=shown');
    await expect(loaded.getByRole('grid', { name: 'Smileys & Emotion' })).toBeVisible();
  });
});
