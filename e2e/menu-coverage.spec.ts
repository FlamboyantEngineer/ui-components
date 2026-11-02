import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box;
}

test.describe('Menu lab coverage', () => {
  test('UIC-MENU-1.4 UIC-MENU-1.1 link items route through the provider and rich labels take typeahead text', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Links and rich labels');
    await area.getByRole('button', { name: 'Go to' }).click();
    const menu = page.getByRole('menu', { name: 'Go to' });
    await expect(menu).toBeVisible();
    await page.keyboard.type('s');
    await expect(menu.getByRole('menuitem', { name: /Starred crates/ })).toBeFocused();
    // Typeahead joins keys typed within a second.
    await page.waitForTimeout(1100);
    await page.keyboard.type('r');
    await expect(menu.getByRole('menuitem', { name: 'Ripe this week' })).toBeFocused();
    await menu.getByRole('menuitem', { name: 'Plums page' }).click();
    await expect(output(page, 'Route')).toHaveText('/orchard/plums');
    await expect(menu).toHaveCount(0);
  });

  test('UIC-MENU-5.1 UIC-MENU-3.3 custom empty state and an uncontrolled preselection', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    await section(page, 'Custom empty filtered state')
      .getByRole('button', { name: 'Find a crate' })
      .click();
    await page.keyboard.type('mango');
    await expect(page.locator('[data-lab-empty]')).toHaveText(
      'No crate holds that fruit. Try another spelling.',
    );
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    const options = page.getByRole('menu', { name: 'View options' });
    await expect(options.getByRole('menuitemcheckbox', { name: 'Wrap lines' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(options.getByRole('menuitemcheckbox', { name: 'Show ruler' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await options.getByRole('menuitemcheckbox', { name: 'Show minimap' }).click();
    await expect(output(page, 'Checked')).toHaveText('wrap, ruler, minimap');
  });

  test('UIC-MENU-4.1 controlled and initially open triggers report open changes', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Controlled and initially open triggers');
    await area.getByRole('button', { name: 'Open from the host' }).click();
    const controlled = page.getByRole('menu', { name: 'Controlled fruit' });
    await expect(controlled).toBeVisible();
    await expect(output(page, 'Controlled open')).toHaveText('true');
    await page.keyboard.press('Escape');
    await expect(controlled).toHaveCount(0);
    await expect(output(page, 'Controlled changes')).toHaveText('open, closed');

    await area.getByRole('button', { name: 'Add the menu' }).click();
    await expect(page.getByRole('menu', { name: 'Fruit on mount' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Fruit on mount' })).toHaveCount(0);
    await expect(output(page, 'Mount changes')).toHaveText('closed');
  });

  test('UIC-MENU-4.3 the popover takes its placement, offsets and flipping', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const area = section(page, 'Popover position');
    const trigger = area.getByRole('button', { name: 'Placed fruit' });
    const popover = page.locator('[data-lab-popover="tuned"]');
    await page.evaluate(() => (document.body.style.paddingBottom = '100vh'));
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', /^top/);
    let anchor = await boxOf(trigger);
    let box = await boxOf(popover);
    expect(anchor.y - (box.y + box.height)).toBeCloseTo(12, -0.5);
    expect(box.x - anchor.x).toBeCloseTo(16, -0.5);
    await page.keyboard.press('Escape');

    // Near the top of the window the menu flips below the trigger.
    await trigger.evaluate((element) => {
      const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      element.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -(header + 8));
    });
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', /^bottom/);
    anchor = await boxOf(trigger);
    box = await boxOf(popover);
    expect(box.y - (anchor.y + anchor.height)).toBeCloseTo(12, -0.5);
    await page.keyboard.press('Escape');

    await area.getByText('Flip when it does not fit').click();
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', /^top/);
    await page.keyboard.press('Escape');
  });

  test('UIC-MENU-6.1 resolveActionIcon keeps, replaces and removes built-in icons', async ({
    page,
    lab,
  }) => {
    await lab.open('menu');
    const menu = page.getByRole('menu', { name: 'Crate actions' });
    const icon = (name: string) =>
      menu.getByRole('menuitem', { name }).locator('.ui-menu-item__icon');
    await expect(icon('Copy')).toHaveCount(1);
    await expect(icon('Rename')).toHaveCount(1);
    await expect(icon('Remove')).toHaveCount(0);
    await expect(icon('Restore')).toHaveCount(1);
    await expect(output(page, 'action-icons')).toHaveText(
      "copy: built-inrename: the host'sremove: removed by the hostrestore: built-in",
    );
  });
});
