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

  test('UIC-COMMAND-PALETTE-1.1 fades out over a quarter second with focus already back on the page', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    // Plays animations at a quarter speed, so the 250ms fade lasts a second of wall time and the
    // checks below run while it plays; its own duration stays 250ms.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.25 });
    const opener = section(page, 'Document shortcut').getByRole('button', { name: 'Commands' });
    for (const how of ['Escape', 'outside', 'command'] as const) {
      await opener.click();
      const search = palette(page).getByRole('searchbox');
      await expect(search).toBeFocused();
      if (how === 'Escape') await page.keyboard.press('Escape');
      else if (how === 'outside') await page.mouse.click(10, 10);
      else {
        await page.keyboard.type('fi');
        await expect(command(page, /^New file/)).toHaveAttribute('data-focused', 'true');
        await page.keyboard.press('Enter');
      }
      const closed = await page.evaluate(() => performance.now());
      // Focus is back at once, and the leaving palette takes no press or key.
      await expect(opener, how).toBeFocused({ timeout: 150 });
      const overlay = page.locator('[data-lab-palette="global"]');
      await expect(overlay).toHaveAttribute('data-exiting', 'true');
      await expect(overlay).toHaveCSS('pointer-events', 'none');
      expect(await overlay.evaluate((node) => (node as HTMLElement).inert)).toBe(true);
      // One fade of a quarter second, running now.
      const fade = await overlay.evaluate((node) =>
        node.getAnimations().map((animation) => ({
          name: (animation as CSSAnimation).animationName,
          duration: animation.effect?.getTiming().duration,
          state: animation.playState,
        })),
      );
      expect(fade).toEqual([{ name: 'ref-command-palette-out', duration: 250, state: 'running' }]);
      await expect(overlay).toHaveCount(0, { timeout: 4000 });
      const gone = await page.evaluate(() => performance.now());
      // The overlay leaves when its fade ends (a second at quarter speed), not on a longer timer.
      expect(gone - closed).toBeGreaterThan(800);
      expect(gone - closed).toBeLessThan(2500);
      await expect(opener).toBeFocused();
    }

    // Under reduced motion the palette leaves at once.
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await opener.click();
    await expect(palette(page).getByRole('searchbox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-lab-palette="global"]')).toHaveCount(0, { timeout: 150 });
    await expect(opener).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
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

  test('UIC-COMMAND-PALETTE-2.6 starts from the default text when reopened while closing', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const slow = page.locator('[data-lab-palette="slow-exit"]');
    await page.keyboard.press('Control+Shift+O');
    const search = slow.getByRole('searchbox');
    await expect(search).toHaveValue('fi');
    await page.keyboard.press('Control+A');
    await page.keyboard.type('zzz');
    await page.keyboard.press('Control+Shift+O');
    await expect(slow).toHaveAttribute('data-exiting', 'true');
    await page.keyboard.press('Control+Shift+O');
    await expect(search).toHaveValue('fi');
    await expect(search).toBeFocused();
    await expect(slow.getByRole('menuitem').first()).toBeVisible();
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

  test('UIC-COMMAND-PALETTE-1.3 opens one palette per press and leaves the chord to another modal', async ({
    page,
    lab,
  }) => {
    await lab.open('command-palette');
    const owners = section(page, 'Several palettes and modals');
    await owners.getByRole('button', { name: 'Add a pane palette' }).click();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Pane commands' })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await owners.getByRole('button', { name: 'Remove the pane palette' }).click();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await owners.getByRole('button', { name: 'Settings' }).click();
    const name = page.getByRole('textbox', { name: 'Display name' });
    await name.focus();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await expect(name).toBeFocused();
  });
});

test('UIC-COMMAND-PALETTE-1.1 UIC-COMMAND-PALETTE-1.4 opens on mount with defaultOpen, closes and reopens by its chord', async ({
  page,
  lab,
}) => {
  await lab.open('command-palette');
  const demo = page.locator('[data-lab-demo="mounted-open"]');
  const dialog = page.locator('[data-lab-palette="mounted-open"]');
  await expect(dialog).toHaveCount(0);
  const mount = demo.getByRole('button', { name: 'Mount the palette open' });
  await mount.click();
  const search = page.getByRole('searchbox');
  await expect(search).toBeFocused();
  await expect(demo.locator('[data-lab-output="palette"]')).toHaveText('open');
  await page.keyboard.type('timer');
  await expect(page.getByRole('menuitem')).toHaveText(['Start a timer']);
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(demo.locator('[data-lab-output="palette"]')).toHaveText('closed');
  await expect(mount).toBeFocused();

  await page.keyboard.press('ControlOrMeta+Shift+L');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await page.keyboard.type('scale');
  await page.keyboard.press('Enter');
  await expect(demo.locator('[data-lab-output="ran"]')).toHaveText('scale');
  await expect(demo.locator('[data-lab-output="palette"]')).toHaveText('closed');
});
