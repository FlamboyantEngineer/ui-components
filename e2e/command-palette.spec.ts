import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

/** The open palette's overlay. */
function palette(page: Page): Locator {
  return page.locator('.ui-command-palette');
}

function command(page: Page, name: string | RegExp): Locator {
  return palette(page).getByRole('menuitem', { name });
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Command Palette lab', () => {
  test('UIC-COMMAND-PALETTE-1.3 UIC-COMMAND-PALETTE-1.4 UIC-COMMAND-PALETTE-2.3 opens on Control+K and runs a command by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const opener = section(page, 'Document shortcut').getByRole('button', { name: 'Commands' });
    await opener.focus();
    await page.keyboard.press('Control+k');
    const search = palette(page).getByRole('searchbox', { name: 'Search commands' });
    await expect(search).toBeFocused();
    await expect(palette(page).getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    await page.keyboard.type('fi');
    await expect(palette(page).getByRole('menuitem')).toHaveText([
      /^New file/,
      /^Delete file/,
      /^Share file/,
    ]);
    await expect(command(page, /^New file/)).toHaveAttribute('data-focused', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(command(page, /^Delete file/)).toHaveAttribute('data-focused', 'true');
    await expect(search).toBeFocused();
    await expect(search).toHaveAttribute(
      'aria-activedescendant',
      (await command(page, /^Delete file/).getAttribute('id')) ?? '',
    );
    // The disabled command is passed over, and the highlight wraps to the first.
    await page.keyboard.press('ArrowDown');
    await expect(command(page, /^New file/)).toHaveAttribute('data-focused', 'true');
    await lab.expectAccessible('.ui-command-palette');
    await page.keyboard.press('Enter');
    await expect(palette(page)).toHaveCount(0);
    await expect(output(page, 'Command')).toHaveText('new-file');
    await expect(opener).toBeFocused();
  });

  test('UIC-COMMAND-PALETTE-1.1 UIC-COMMAND-PALETTE-1.3 closes on Escape, Control+K and a press outside', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const opener = section(page, 'Document shortcut').getByRole('button', { name: 'Commands' });
    await opener.click();
    const search = palette(page).getByRole('searchbox');
    await expect(search).toBeFocused();
    await page.keyboard.type('lima');
    await page.keyboard.press('Escape');
    await expect(search).toHaveValue('');
    await expect(palette(page)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(palette(page)).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toHaveCount(1);
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toHaveCount(0);
    await expect(output(page, 'Open')).toHaveText('no');
    await page.keyboard.press('Control+k');
    await page.mouse.click(10, 10);
    await expect(palette(page)).toHaveCount(0);
  });

  test('UIC-COMMAND-PALETTE-1.2 UIC-COMMAND-PALETTE-1.5 covers the viewport on the modal layer at each size', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const widths: number[] = [];
    for (const size of ['sm', 'md', 'lg']) {
      await matrixCell(page, `state=default size=${size}`)
        .getByRole('button', { name: 'Open' })
        .click();
      const overlay = palette(page);
      await expect(overlay).toHaveAttribute('data-size', size);
      await expect(overlay).toHaveAttribute('data-layer', 'modal');
      await expect(overlay).toHaveCSS('position', 'fixed');
      await expect(overlay).toHaveCSS('z-index', '120');
      const viewport = page.viewportSize();
      const box = await overlay.boundingBox();
      expect(box?.width).toBe(viewport?.width);
      expect(box?.height).toBe(viewport?.height);
      await expect(overlay.locator('.ui-menu')).toHaveAttribute('data-size', size);
      widths.push((await overlay.locator('.ui-command-palette__panel').boundingBox())?.width ?? 0);
      await page.keyboard.press('Escape');
      await expect(overlay).toHaveCount(0);
    }
    expect(widths).toEqual([480, 560, 640]);
  });

  test('UIC-COMMAND-PALETTE-2.2 UIC-COMMAND-PALETTE-2.4 UIC-COMMAND-PALETTE-2.5 marks matches and shows the empty states', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const cell = (state: string) =>
      matrixCell(page, `state=${state} size=md`).getByRole('button', { name: 'Open' });
    await cell('typed').click();
    await expect(palette(page).getByRole('searchbox')).toHaveValue('fi');
    await expect(command(page, /^New file/).locator('mark.ui-text-match')).toHaveText('fi');
    await expect(command(page, /^New file/)).toHaveAccessibleName(/^New file/);
    await expect(palette(page).getByRole('group', { name: 'Go to' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await cell('no match').click();
    await expect(palette(page).locator('.ui-command-palette__empty')).toHaveText('No results');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await cell('custom empty').click();
    await expect(palette(page).locator('.ui-command-palette__empty')).toHaveText(
      'No command matches. Try “new”.',
    );
    await lab.expectAccessible('.ui-command-palette');
  });

  test('UIC-COMMAND-PALETTE-2.2 opens on its own chord and filters with a custom test', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    await page.keyboard.press('Control+Shift+P');
    const dialog = palette(page).getByRole('dialog', { name: 'Commands by words' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox', { name: 'Type words in any order' })).toBeFocused();
    await page.keyboard.type('fi ne');
    await expect(palette(page).getByRole('menuitem')).toHaveText([/^New file/]);
    await page.keyboard.press('Enter');
    await expect(output(page, 'Word command')).toHaveText('new-file');
  });

  test('UIC-COMMAND-PALETTE-2.6 shows a loading row while results for the typed text arrive', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('command-palette');
    await section(page, 'Loading results').getByRole('button', { name: 'Search cities' }).click();
    const search = palette(page).getByRole('searchbox', { name: 'Search cities' });
    await expect(search).toBeFocused();
    await expect(palette(page).locator('.ui-command-palette__empty')).toHaveText(
      'Type to search 60 cities.',
    );
    await page.keyboard.type('lima');
    const loading = palette(page).locator('.ui-menu__load-more');
    await expect(loading).toHaveText('Loading');
    await expect(palette(page).locator('.ui-command-palette__empty')).toHaveCount(0);
    await page.clock.runFor(400);
    await expect(loading).toHaveCount(0);
    await expect(palette(page).getByRole('menuitem')).toHaveText([
      'Lima 2',
      'Lima 11',
      'Lima 20',
      'Lima 29',
      'Lima 38',
      'Lima 47',
      'Lima 56',
    ]);
    await command(page, 'Lima 11').click();
    await expect(palette(page)).toHaveCount(0);
    await expect(output(page, 'City')).toHaveText('Lima 11');
  });

  test('UIC-COMMAND-PALETTE-2.1 keeps the palette open for an item that asks to', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    await section(page, 'Composed with JSX')
      .getByRole('button', { name: 'Composed commands' })
      .click();
    await page.keyboard.type('side');
    await expect(command(page, 'Toggle sidebar').locator('mark')).toHaveText('side');
    await page.keyboard.press('Enter');
    await expect(palette(page)).toHaveCount(1);
    await expect(output(page, 'Sidebar')).toHaveText('hidden');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(palette(page)).toHaveCount(0);
  });

  test('UIC-COMMAND-PALETTE-3.1 passes axe in the dark theme, closed and open', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette', { theme: 'dark' });
    await lab.expectAccessible();
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toHaveCount(1);
    await lab.expectAccessible('.ui-command-palette');
    // The highlight wraps to the last command, which scrolls into the panel's view.
    await page.keyboard.press('ArrowUp');
    const last = command(page, /^Refresh/);
    await expect(last).toHaveAttribute('data-focused', 'true');
    await expect(async () => {
      const panel = await palette(page).locator('.ui-command-palette__panel').boundingBox();
      const row = await last.boundingBox();
      expect((row?.y ?? 0) + (row?.height ?? 0)).toBeLessThanOrEqual(
        (panel?.y ?? 0) + (panel?.height ?? 0) + 1,
      );
    }).toPass();
  });
});
