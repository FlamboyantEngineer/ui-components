import { expect, test } from './fixtures.js';

test.describe('Button lab', () => {
  test('UIC-HOOKS-2.3 clears an inactive hook despite a conflicting caller attribute', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    await expect(page.getByRole('button', { name: 'Natural width' })).not.toHaveAttribute(
      'data-full-width',
    );
  });

  test('UIC-BUTTON-1.2 UIC-BUTTON-1.3 draws every variant at four block sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const cells = page
      .locator('[data-lab-family="button-main"]')
      .locator('table[data-lab-matrix="variant size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(9 * 4);
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const box = await page
        .locator('[data-lab-family="button-main"]')
        .locator(`[data-lab-cell="variant=secondary size=${size}"] .ui-button`)
        .boundingBox();
      expect(box?.height).toBe(height);
    }
  });

  test('UIC-BUTTON-1.1 UIC-BUTTON-2.4 activates by keyboard and shows keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const button = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary size=md"] .ui-button');
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toHaveAttribute('data-focus-visible', 'true');
    await button.hover();
    await expect(button).toHaveAttribute('data-hovered', 'true');
  });

  test('UIC-BUTTON-2.1 keeps a focusable disabled button in the tab order', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const disabled = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary state=disabled"] .ui-button');
    const focusable = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary state=focusable disabled"] .ui-button');
    await expect(disabled).toHaveAttribute('disabled', '');
    await expect(focusable).not.toHaveAttribute('disabled');
    await expect(focusable).toHaveAttribute('aria-disabled', 'true');
    const selected = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary state=selected"] .ui-button');
    await selected.focus();
    await page.keyboard.press('Tab');
    await expect(focusable).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-2.1 keeps a focusable disabled menu button shut while its tooltip explains it', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const area = page.locator('[data-lab-family="button-trigger-cases"]');
    const locked = area.getByRole('button', { name: 'Locked commands' });
    const commands = area.getByRole('button', { name: 'Commands', exact: true });
    await commands.focus();
    await page.keyboard.press('Tab');
    await expect(locked).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText('Unavailable while saving');
    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      await locked.focus();
      await page.keyboard.press(key);
    }
    await locked.click({ force: true });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await commands.click();
    await page.getByRole('menuitem', { name: 'Run' }).click();
    await expect(area.locator('[data-lab-output="Runs"]')).toHaveText('1');
  });

  test('UIC-BUTTON-21.7 keeps its menu shut while its action runs, before pending shows', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const area = page.locator('[data-lab-family="button-trigger-cases"]');
    const syncing = area.getByRole('button', { name: 'Sync then choose' });
    await syncing.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(syncing).not.toHaveAttribute('data-pending');
    await syncing.click();
    for (const key of ['Enter', 'Space', 'ArrowDown']) await page.keyboard.press(key);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(syncing).toHaveAttribute('data-pending', 'true');
    await expect(syncing).not.toHaveAttribute('data-pending', { timeout: 5000 });
    await syncing.click();
    await expect(page.getByRole('menu')).toBeVisible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-BUTTON-1.7 shows the hint and shortcut in the tooltip and publishes aria-keyshortcuts in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('button', { theme });
      const cell = (hint: string, state: string) =>
        page
          .locator('[data-lab-family="button-main"]')
          .locator(`[data-lab-cell="hint=${hint} state=${state}"] .ui-button`);
      const both = cell('tooltip and shortcut', 'default');
      await expect(both).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+S');
      await expect(cell('tooltip', 'default')).not.toHaveAttribute('aria-keyshortcuts');
      await cell('shortcut', 'pending').focus();
      await page.keyboard.press('Tab');
      await expect(both).toBeFocused();
      const tooltip = page.getByRole('tooltip', { name: /Save every change/ });
      await expect(tooltip).toBeVisible();
      await expect(tooltip.locator('.ui-shortcut__key')).toHaveText(['Ctrl', 'Shift', 'S']);
      await expect(both).toHaveAccessibleDescription('Save every change Control Shift S');
      await expect(tooltip).toHaveText(/^Save every change Ctrl\+Shift\+S/);
      await lab.expectAccessible();

      await page.keyboard.press('Control+Shift+S');
      await expect(both).toBeFocused();
      await expect(both).not.toHaveAttribute('data-pending');
      const alone = cell('shortcut', 'focusable disabled');
      await alone.focus();
      await expect(page.getByRole('tooltip', { name: 'Control Shift S' })).toBeVisible();
    });
  }

  test('UIC-BUTTON-1.9 draws a link as a button and leaves a disabled one as text', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const link = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary link=enabled"] a.ui-button');
    await expect(link).toHaveAttribute('href', '#reports');
    await expect(link).toHaveAttribute('data-variant', 'primary');
    const disabled = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-cell="variant=primary link=disabled"] .ui-button');
    await expect(disabled).toHaveJSProperty('tagName', 'SPAN');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    const box = await link.boundingBox();
    expect(box?.height).toBe(28);
    await link.focus();
    await expect(link).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#reports$/);
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-2.6 toggles its own state or reports it to its caller', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-demo="toggles"]');
    const grid = demo.getByRole('button', { name: 'Show grid' });
    await expect(grid).toHaveAttribute('aria-pressed', 'true');
    await grid.focus();
    await page.keyboard.press('Space');
    await expect(grid).toHaveAttribute('aria-pressed', 'false');
    await expect(grid).not.toHaveAttribute('data-selected');
    const pin = demo.getByRole('button', { name: 'Pin panel' });
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    await pin.click();
    await expect(pin).toHaveAttribute('aria-pressed', 'true');
    await expect(demo.locator('[data-lab-output="pinned"]')).toHaveText('Pinned: yes');
    await expect(
      page.locator('[data-lab-family="button-main"]').locator('[data-lab-swapped]'),
    ).toHaveClass(/ui-button/);
  });

  test('UIC-BUTTON-1.6 keeps the focused button as its hint comes and goes', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page
      .locator('[data-lab-family="button-main"]')
      .locator('[data-lab-demo="toggles"]');
    const pin = demo.getByRole('button', { name: 'Pin panel' });
    await pin.evaluate((node) => node.setAttribute('data-lab-probe', 'kept'));
    await pin.focus();
    await page.keyboard.press('Space');
    await expect(pin).toHaveAttribute('aria-pressed', 'true');
    await expect(pin).toBeFocused();
    await expect(pin).toHaveAttribute('data-lab-probe', 'kept');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveText('Press again to unpin');
    await page.keyboard.press('Space');
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    await expect(pin).toBeFocused();
    await expect(pin).toHaveAttribute('data-lab-probe', 'kept');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('UIC-BUTTON-1.10 hides a hidden button or link under the reference stylesheet', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page.locator('[data-lab-family="button-main"] [data-lab-demo="hidden"]');
    const buttons = demo.locator('.ui-button');
    await expect(buttons).toHaveCount(3);
    for (const button of await buttons.all()) {
      await expect(button).toBeHidden();
      expect(await button.evaluate((node) => getComputedStyle(node).display)).toBe('none');
    }
    const toggle = demo.getByRole('checkbox', { name: 'Hide the buttons' });
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(buttons.first()).not.toBeFocused();
    await toggle.uncheck();
    for (const button of await buttons.all()) await expect(button).toBeVisible();
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'Save draft' })).toBeFocused();
    expect(
      await demo
        .getByRole('button', { name: 'Full-width action' })
        .evaluate((node) => getComputedStyle(node).display),
    ).toBe('flex');
  });
});
