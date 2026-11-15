import { expect, test } from './fixtures.js';

test.describe('Toolbar Row overflow menu', () => {
  test('UIC-TOOLBAR-ROW-2.2 keeps high-priority tools and lists the rest in a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
    const toolbar = (width: string) => page.getByRole('toolbar', { name: `Editing, ${width}` });
    await expect(toolbar('wide').locator('.ui-toolbar-row__item')).toHaveCount(9);
    await expect(toolbar('wide').locator('.ui-toolbar-row__overflow')).toHaveCount(0);
    const narrow = toolbar('narrow');
    await expect(narrow.locator('.ui-toolbar-row__overflow')).toHaveCount(1);
    const kept = await narrow.locator('.ui-toolbar-row__item').allTextContents();
    expect(kept.length).toBeLessThan(9);
    expect(kept).toContain('Save');
    await expect(narrow.locator(':scope > :last-child')).toHaveClass(/ui-toolbar-row__overflow/);
    const box = await narrow.boundingBox();
    const more = narrow.getByRole('button', { name: `${9 - kept.length} more items` });
    const moreBox = await more.boundingBox();
    expect((moreBox?.x ?? 0) + (moreBox?.width ?? 0)).toBeLessThanOrEqual(
      (box?.x ?? 0) + (box?.width ?? 0) + 0.5,
    );
    await narrow.getByRole('button', { name: kept[0] }).focus();
    for (let step = 1; step < kept.length; step += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Code' }).click();
    await expect(page.locator('[data-lab-menu="narrow"] [data-lab-output="last"]')).toHaveText(
      'Code',
    );
  });

  test('UIC-TOOLBAR-ROW-2.3 keeps tool drafts and focus across overflow modes', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
    const demo = page.locator('[data-lab-demo="switching-mode"]');
    const row = demo.locator('.ui-toolbar-row');
    const find = demo.getByRole('textbox', { name: 'Find' });
    await find.fill('draft');
    await find.evaluate((element) => Object.assign(element, { labMarker: true }));
    const toggle = demo.getByRole('button', { name: /^Switch to/ });
    for (const mode of ['menu', 'wrap', 'scroll', 'menu']) {
      await toggle.click();
      await expect(row).toHaveAttribute('data-overflow', mode);
      await expect(find).toHaveValue('draft');
      expect(await find.evaluate((element) => 'labMarker' in element)).toBe(true);
    }
    // A switch that does not take focus away keeps it in the tool.
    await find.focus();
    await toggle.dispatchEvent('click');
    await expect(row).toHaveAttribute('data-overflow', 'wrap');
    await expect(find).toBeFocused();
  });

  test('UIC-TOOLBAR-ROW-2.2 keeps a disabled tool from running in the strip and the menu', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-row');
    const demo = page.locator('[data-lab-demo="disabled-tool"]');
    const toolbar = demo.getByRole('toolbar', { name: 'Formatting with a disabled tool' });
    const last = demo.locator('[data-lab-output="last"]');
    const disable = demo.getByRole('switch', { name: 'Disable Link' });
    await toolbar.locator('.ui-toolbar-row__overflow button').click();
    const link = page.getByRole('menuitem', { name: 'Link' });
    await expect(link).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await disable.press('Space');
    await toolbar.locator('.ui-toolbar-row__overflow button').click();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await expect(last).toHaveText('Link from the menu');

    await demo.getByRole('radio', { name: 'Wide' }).press('Space');
    await expect(toolbar.locator('.ui-toolbar-row__overflow')).toHaveCount(0);
    const button = toolbar.getByRole('button', { name: 'Link' });
    await disable.press('Space');
    await expect(button).toBeDisabled();
    await disable.press('Space');
    await button.click();
    await expect(last).toHaveText('Link from the strip');
    await lab.expectAccessible();
  });
});
