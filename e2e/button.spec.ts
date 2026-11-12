import { controlHeight, expect, familySelector, matrix, matrixCell, test } from './fixtures.js';

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
    const cells = matrix(page, 'button-main').locator(
      'table[data-lab-matrix="variant size"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(9 * 4);
    for (const [size, height] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const box = await matrixCell(page, `variant=secondary size=${size}`, {
        family: 'button-main',
      })
        .locator(`.ui-button`)
        .boundingBox();
      expect(box?.height).toBe(height);
    }
  });

  test('UIC-BUTTON-1.1 UIC-BUTTON-2.4 activates by keyboard and shows keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const button = matrixCell(page, 'variant=primary size=md', { family: 'button-main' }).locator(
      '.ui-button',
    );
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
    const disabled = matrixCell(page, 'variant=primary state=disabled', {
      family: 'button-main',
    }).locator('.ui-button');
    const focusable = matrixCell(page, 'variant=primary state=focusable disabled', {
      family: 'button-main',
    }).locator('.ui-button');
    await expect(disabled).toHaveAttribute('disabled', '');
    await expect(focusable).not.toHaveAttribute('disabled');
    await expect(focusable).toHaveAttribute('aria-disabled', 'true');
    const selected = matrixCell(page, 'variant=primary state=selected', {
      family: 'button-main',
    }).locator('.ui-button');
    await selected.focus();
    await page.keyboard.press('Tab');
    await expect(focusable).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-2.1 sends on the first press once enabled after a press while disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page.locator('[data-lab-demo="enabled-later"]');
    const send = demo.getByRole('button', { name: 'Send' });
    await send.scrollIntoViewIfNeeded();
    const box = await send.boundingBox();
    if (!box) throw new Error('Send not rendered');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(demo.locator('[data-lab-output="sent"]')).toHaveText('Sent: 0');
    // The pointer stays on Send while the keyboard ticks the box.
    await demo.getByRole('checkbox', { name: 'I have read the notes' }).focus();
    await page.keyboard.press('Space');
    await page.mouse.down();
    await page.mouse.up();
    await expect(demo.locator('[data-lab-output="sent"]')).toHaveText('Sent: 1');
  });

  test('UIC-BUTTON-1.6 explains a disabled command on the first physical hover', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const area = matrix(page, 'button-trigger-cases');
    const locked = area.getByRole('button', { name: 'Locked commands' });
    await locked.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Unavailable while saving');
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    const bounds = await locked.boundingBox();
    if (!bounds) throw new Error('The disabled command must remain visible.');
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect(locked).toBeFocused();
    for (const key of ['Enter', 'Space', 'ArrowDown']) await page.keyboard.press(key);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(area.locator('[data-lab-output="Runs"]')).toHaveText('0');
  });

  test('UIC-BUTTON-2.1 keeps a focusable disabled menu button shut while its tooltip explains it', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const area = matrix(page, 'button-trigger-cases');
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
    const area = matrix(page, 'button-trigger-cases');
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
        matrixCell(page, `hint=${hint} state=${state}`, { family: 'button-main' }).locator(
          `.ui-button`,
        );
      const both = cell('tooltip and shortcut', 'default');
      await expect(both).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+S');
      await expect(cell('tooltip', 'default')).not.toHaveAttribute('aria-keyshortcuts');
      // A focus that scrolls the page closes the tooltip it opens (React Aria closes tooltips on
      // scroll), so bring both buttons into view before moving focus between them.
      await both.scrollIntoViewIfNeeded();
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
    const link = matrixCell(page, 'variant=primary link=enabled', {
      family: 'button-main',
    }).locator('a.ui-button');
    await expect(link).toHaveAttribute('href', '#reports');
    await expect(link).toHaveAttribute('data-variant', 'primary');
    const disabled = matrixCell(page, 'variant=primary link=disabled', {
      family: 'button-main',
    }).locator('.ui-button');
    await expect(disabled).toHaveJSProperty('tagName', 'SPAN');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    const box = await link.boundingBox();
    expect(box?.height).toBe(await controlHeight(page, 'md'));
    await link.focus();
    await expect(link).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#reports$/);
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-1.9 UIC-BUTTON-1.5 underlines a link variant only as asked and grows its icons with its size', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const link = (name: string) => page.locator(`[data-lab-link="${name}"]`);
    const decoration = (locator: ReturnType<typeof link>) =>
      locator.evaluate((node) => getComputedStyle(node).textDecorationLine);
    const plain = link('internal-none-md');
    await plain.hover();
    expect(await decoration(plain)).toBe('none');
    await plain.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(plain).toHaveAttribute('data-focus-visible', 'true');
    expect(await decoration(plain)).toBe('none');
    expect(await plain.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe('none');
    const hover = link('internal-hover-md');
    expect(await decoration(hover)).toBe('none');
    await hover.hover();
    expect(await decoration(hover)).toBe('underline');
    expect(await decoration(link('internal-always-md'))).toBe('underline');
    const widths: number[] = [];
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      const external = link(`new tab-none-${size}`);
      const glyph = await external.locator('.ui-button__end-icon').boundingBox();
      const label = await external.locator('.ui-button__label').boundingBox();
      const start = await link(`custom icon-none-${size}`)
        .locator('.ui-button__start-icon')
        .boundingBox();
      if (!glyph || !label || !start) throw new Error('no layout');
      expect(start.width).toBe(glyph.width);
      expect(Math.abs(glyph.y + glyph.height / 2 - (label.y + label.height / 2))).toBeLessThan(2);
      widths.push(glyph.width);
    }
    expect(widths).toEqual([12, 14, 16, 20]);
  });

  test('UIC-BUTTON-2.6 toggles its own state or reports it to its caller', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = matrix(page, 'button-main').locator('[data-lab-demo="toggles"]');
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
    await expect(matrix(page, 'button-main').locator('[data-lab-swapped]')).toHaveClass(
      /ui-button/,
    );
  });

  test('UIC-BUTTON-1.6 keeps the focused button as its hint comes and goes', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = matrix(page, 'button-main').locator('[data-lab-demo="toggles"]');
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
    const demo = page.locator(`${familySelector('button-main')} [data-lab-demo="hidden"]`);
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
