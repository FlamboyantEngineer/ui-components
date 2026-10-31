import { expect, test, matrixCell } from './fixtures.js';

const regionsCell = (navigation: string, panels: string) =>
  `[data-lab-cell="navigation=${navigation} panels=${panels}"] .ui-app-frame`;

test.describe('App Frame lab', () => {
  test('UIC-APP-FRAME-1.1 UIC-APP-FRAME-1.4 renders the present regions as plain containers when embedded', async ({
    page,
    lab,
  }) => {
    await lab.open('app-frame');
    const all = page.locator(regionsCell('rail', 'all'));
    await expect(all).toHaveAttribute('data-embedded', 'true');
    await expect(all).toHaveAttribute('role', 'group');
    const slots = await all.evaluate((frame) =>
      [...frame.querySelectorAll('[class*="ui-app-frame__"]')].map((node) =>
        node.className.replace(/^.*ui-app-frame__([a-z-]+).*$/, '$1'),
      ),
    );
    expect(slots).toEqual([
      'skip-link',
      'top-bar',
      'navigation',
      'start-panel',
      'main',
      'bottom-panel',
      'end-panel',
      'status-bar',
    ]);
    await expect(all.locator('main, header, footer, aside')).toHaveCount(0);
    const none = page.locator(regionsCell('none', 'none'));
    await expect(none.locator('.ui-app-frame__navigation')).toHaveCount(0);
    await expect(none.locator('.ui-app-frame__end-panel')).toHaveCount(0);
    // The stylesheet lays the regions out: the end panel sits at the inline end of the main region.
    const main = await all.locator('.ui-app-frame__main').boundingBox();
    const end = await all.locator('.ui-app-frame__end-panel').boundingBox();
    expect(end && main && end.x >= main.x + main.width - 1).toBe(true);
  });

  test('UIC-APP-FRAME-1.3 UIC-APP-FRAME-3.1 reveals the skip link and moves focus to the main region', async ({
    page,
    lab,
  }) => {
    await lab.open('app-frame');
    const frame = page.locator('[data-lab-demo="workspace"] .ui-app-frame');
    const link = frame.getByRole('link', { name: 'Skip to main content' });
    const address = page.url();
    await link.focus();
    await expect(link.locator('..')).toHaveAttribute('data-focus-within', 'true');
    expect(await link.boundingBox()).not.toBeNull();
    await page.keyboard.press('Enter');
    await expect(frame.locator('.ui-app-frame__main')).toBeFocused();
    expect(page.url()).toBe(address);
  });

  test('UIC-APP-FRAME-1.5 UIC-APP-FRAME-2.1 UIC-APP-FRAME-2.3 lets a page fill the band and a panel', async ({
    page,
    lab,
  }) => {
    await lab.open('app-frame');
    const frame = page.locator('[data-lab-demo="workspace"] .ui-app-frame');
    const band = frame.getByRole('group', { name: 'Kitchen controls' });
    await expect(band.locator('.ui-app-frame-band__leading')).toHaveText('Kitchen');
    await expect(band.getByRole('group', { name: 'Actions' })).toHaveText('Share');
    await expect(band.getByRole('status')).toHaveText('Saved');
    await frame.getByRole('link', { name: 'Pantry' }).click();
    await expect(band.locator('.ui-app-frame-band__leading')).toHaveText('Pantry');
    await expect(band.getByRole('status')).toHaveText('');
    await band.getByRole('button', { name: 'Add jar' }).click();
    await expect(frame.locator('[data-lab-jars]')).toHaveText('4 jars on the shelf.');
    await expect(band.getByRole('status')).toHaveText('Unsaved changes');
    await expect(frame.locator('.ui-app-frame__end-panel')).toContainText('4 jars');
    await frame.getByRole('link', { name: 'Team' }).click();
    await expect(band.locator('.ui-app-frame-band__leading')).toHaveText('Kitchen');
    await expect(band.getByRole('button', { name: 'Share' })).toBeVisible();
    await expect(frame.locator('.ui-app-frame__end-panel')).toHaveText(
      'Pick a page to see its details.',
    );
  });

  test('UIC-APP-FRAME-2.2 scrolls the tools of a narrow band instead of wrapping them', async ({
    page,
    lab,
  }) => {
    await lab.open('app-frame');
    const narrow = matrixCell(page, 'width=narrow').locator('.ui-app-frame-band');
    const toolbar = narrow.getByRole('toolbar', { name: 'Tools' });
    const rows = await toolbar
      .getByRole('button')
      .evaluateAll(
        (buttons) => new Set(buttons.map((button) => button.getBoundingClientRect().y)).size,
      );
    expect(rows).toBe(1);
    const scroller = narrow.locator('.ui-app-frame-band__tools');
    await expect(scroller).toHaveAttribute('data-overflow-end', 'true');
    await narrow.getByRole('button', { name: 'Scroll forward' }).click();
    await expect(scroller).toHaveAttribute('data-overflow-start', 'true');
    const wide = matrixCell(page, 'width=wide').locator('.ui-app-frame-band__tools');
    await expect(wide).not.toHaveAttribute('data-overflow-end');
    await toolbar.getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(toolbar.getByRole('button', { name: 'Redo' })).toBeFocused();
  });

  test('UIC-APP-FRAME-3.1 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('app-frame');
    await expect(page.locator('#lab-root .ui-app-frame').first()).toBeAttached();
    await lab.expectAccessible();
    await lab.open('app-frame', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
