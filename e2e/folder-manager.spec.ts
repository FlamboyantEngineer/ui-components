import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function managed(page: Page): Locator {
  return page.locator('[data-lab-manager="managed"]');
}

function row(scope: Locator, name: string): Locator {
  return scope.getByRole('row', { name, exact: true });
}

async function rowNames(scope: Locator): Promise<Array<string | null>> {
  return scope
    .getByRole('row')
    .evaluateAll((rows) => rows.map((element) => element.getAttribute('aria-label')));
}

test.describe('Folder Manager lab', () => {
  test('UIC-FOLDER-MANAGER-1.1 keeps folder keys apart from the root row', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = page.locator('[data-lab-manager="keys"]');
    const output = page.locator('[data-lab-output="Selected key"]');
    expect(await rowNames(manager)).toEqual([
      'All folders',
      'Root cellar',
      'Draft notes',
      'Shelf 7 (number key)',
      'Shelf 7 (text key)',
    ]);
    await expect(row(manager, 'Draft notes')).toHaveAttribute('aria-selected', 'true');
    await row(manager, 'Root cellar').click();
    await expect(output).toHaveText('string root');
    await row(manager, 'Shelf 7 (number key)').click();
    await expect(output).toHaveText('number 7');
    await row(manager, 'Shelf 7 (text key)').click();
    await expect(output).toHaveText('string 7');
    await row(manager, 'All folders').click();
    await expect(output).toHaveText('none');
  });

  test('UIC-FOLDER-MANAGER-1.1 UIC-FOLDER-MANAGER-1.3 shows the folders and selects one at a time', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = managed(page);
    expect(await rowNames(manager)).toEqual([
      'Fruit',
      'Citrus',
      'Lemons',
      'Berries',
      'Vegetables',
      'Herbs',
    ]);
    await expect(row(manager, 'Fruit')).toHaveAttribute('aria-selected', 'true');
    await row(manager, 'Berries').click();
    await expect(page.locator('[data-lab-output="Selected"]')).toHaveText('berries');
    await page.keyboard.press('ArrowDown');
    await expect(row(manager, 'Vegetables')).toHaveAttribute('aria-selected', 'true');
    const indent = async (name: string) => (await row(manager, name).boundingBox())?.x ?? 0;
    const citrus = row(manager, 'Citrus').locator('.ui-tree__label');
    const lemons = row(manager, 'Lemons').locator('.ui-tree__label');
    expect((await lemons.boundingBox())?.x ?? 0).toBeGreaterThan(
      (await citrus.boundingBox())?.x ?? 0,
    );
    expect(await indent('Citrus')).toBe(await indent('Fruit'));
    await lab.expectAccessible();
  });

  test('UIC-FOLDER-MANAGER-2.1 UIC-FOLDER-MANAGER-2.2 creates a folder from a draft row', async ({
    page,
    lab,
  }) => {
    // The lab answers after 300 ms; a paused clock keeps the pending state observable under load.
    await page.clock.install();
    await lab.open('folder-manager');
    const manager = managed(page);
    await row(manager, 'Vegetables').click();
    await manager.getByRole('button', { name: 'New folder' }).click();
    const input = manager.getByRole('textbox', { name: 'New folder name' });
    await expect(input).toBeFocused();
    await expect(
      manager.getByRole('row').filter({ has: page.getByRole('textbox') }),
    ).toHaveAttribute('aria-level', '2');
    await page.clock.pauseAt(Date.now() + 1000);
    await page.keyboard.type('Leeks');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(300);
    await expect(row(manager, 'Leeks')).toBeFocused();
    await expect(row(manager, 'Leeks')).toHaveAttribute('aria-selected', 'true');
    await expect(manager.getByRole('row', { name: 'Leeks' })).toHaveCount(1);
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('created Leeks');
  });

  test('UIC-FOLDER-MANAGER-2.3 UIC-FOLDER-MANAGER-2.4 renames in place, keeping keys in the field and a refused name', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = managed(page);
    await row(manager, 'Herbs').click();
    await page.keyboard.press('F2');
    const input = manager.getByRole('textbox', { name: 'Rename Herbs' });
    await expect(input).toBeFocused();
    await page.keyboard.type('Taken');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Home');
    await expect(input).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(manager.getByRole('alert')).toHaveText('A folder named Taken already exists.');
    await expect(input).toHaveValue('Taken');
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS('border-top-color', 'rgb(207, 34, 46)');
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Spices');
    await page.keyboard.press('Enter');
    await expect(row(manager, 'Spices')).toBeFocused();
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText('renamed herbs to Spices');
    await expect(manager.getByRole('alert')).toHaveCount(0);
  });

  test('UIC-FOLDER-MANAGER-2.6 refuses a folder with subfolders and deletes an empty one', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = managed(page);
    const remove = manager.getByRole('button', { name: 'Delete' });
    await expect(remove).toHaveAttribute('aria-disabled', 'true');
    await remove.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveText('Empty the folder first.');
    await row(manager, 'Lemons').click();
    await page.keyboard.press('Delete');
    await expect(row(manager, 'Lemons')).toHaveCount(0);
    await expect(row(manager, 'Citrus')).toBeFocused();
    await expect(page.locator('[data-lab-output="Selected"]')).toHaveText('citrus');
  });

  test('UIC-FOLDER-MANAGER-2.5 selects nothing from a closed panel when its delete settles', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('folder-manager');
    const demo = page.locator('[data-lab-demo="closing"]');
    const manager = demo.getByRole('treegrid', { name: 'Panel folders' });
    await row(manager, 'Lemons').click();
    await expect(demo.locator('[data-lab-output="Panel selection"]')).toHaveText('lemons');
    await page.keyboard.press('Delete');
    await demo.getByRole('button', { name: 'Close panel' }).click();
    await page.clock.runFor(1600);
    await expect(demo.locator('[data-lab-output="Panel action"]')).toHaveText('deleted lemons');
    await expect(demo.locator('[data-lab-output="Panel selection"]')).toHaveText('lemons');
    await demo.getByRole('button', { name: 'Open panel' }).click();
    await expect(row(manager, 'Lemons')).toHaveCount(0);
    await expect(demo.locator('[data-lab-output="Panel selection"]')).toHaveText('lemons');
  });

  test('UIC-FOLDER-MANAGER-2.8 opens Rename and Delete from the context menu', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = managed(page);
    await row(manager, 'Vegetables').click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText(['Rename', 'Delete']);
    await expect(page.locator('[data-lab-output="Selected"]')).toHaveText('vegetables');
    await menu.getByRole('menuitem', { name: 'Rename' }).click();
    await expect(manager.getByRole('textbox', { name: 'Rename Vegetables' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(row(manager, 'Vegetables')).toBeFocused();
  });

  test('UIC-FOLDER-MANAGER-3.1 moves folders with Alt+Arrow keys and by dragging', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = managed(page);
    await row(manager, 'Herbs').click();
    await page.keyboard.press('Alt+ArrowUp');
    expect(await rowNames(manager)).toEqual([
      'Fruit',
      'Citrus',
      'Lemons',
      'Berries',
      'Herbs',
      'Vegetables',
    ]);
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText(
      'moved herbs before vegetables',
    );
    await expect(row(manager, 'Herbs')).toBeFocused();
    await row(manager, 'Vegetables').dragTo(row(manager, 'Fruit'), {
      targetPosition: { x: 40, y: 2 },
    });
    await expect(page.locator('[data-lab-output="Action"]')).toHaveText(
      'moved vegetables before fruit',
    );
    expect((await rowNames(manager))[0]).toBe('Vegetables');
  });

  test('UIC-FOLDER-MANAGER-1.3 picks a folder in a modal for the host to apply', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    await page.getByRole('button', { name: 'Choose folder' }).click();
    const dialog = page.getByRole('dialog', { name: 'Choose a folder' });
    await expect(row(dialog, 'No folder')).toHaveAttribute('aria-selected', 'true');
    await expect(dialog.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await row(dialog, 'Citrus').click();
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-lab-output="Chosen"]')).toHaveText('citrus');
  });

  test('UIC-FOLDER-MANAGER-6.1 UIC-FOLDER-MANAGER-6.2 UIC-FOLDER-MANAGER-6.3 selects several folders, moves and deletes them together', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = page.locator('[data-lab-manager="multiple"]');
    await expect(row(manager, 'Citrus')).toHaveAttribute('aria-selected', 'true');
    await expect(row(manager, 'Herbs')).toHaveAttribute('aria-selected', 'true');
    await row(manager, 'Berries').click({ modifiers: ['ControlOrMeta'] });
    await expect(page.locator('[data-lab-output="Selection"]')).toHaveText(
      'citrus, herbs, berries',
    );
    await expect(manager.getByRole('button', { name: 'Rename' })).toBeDisabled();
    await row(manager, 'Herbs').click({ button: 'right' });
    const menu = page.getByRole('menu');
    await menu.getByRole('menuitem', { name: 'Move to' }).click();
    const places = page.getByRole('menu').last();
    await expect(places.getByRole('menuitem')).toHaveText(['Top level', 'Fruit', 'Vegetables']);
    await places.getByRole('menuitem', { name: 'Vegetables' }).click();
    await expect
      .poll(() => rowNames(manager))
      .toEqual(['Fruit', 'Vegetables', 'Citrus', 'Lemons', 'Berries', 'Herbs']);
    await lab.expectAccessible();
    await row(manager, 'Citrus').click();
    await row(manager, 'Herbs').click({ modifiers: ['Shift'] });
    await expect(page.locator('[data-lab-output="Selection"]')).toHaveText(
      'citrus, lemons, berries, herbs',
    );
    await page.keyboard.press('Delete');
    await expect(page.locator('[data-lab-output="Bulk action"]')).toHaveText('deleted herbs');
    await expect.poll(() => rowNames(manager)).toEqual(['Fruit', 'Vegetables']);
    await expect(page.locator('[data-lab-output="Selection"]')).toHaveText('vegetables');
  });

  test('UIC-FOLDER-MANAGER-6.2 refuses a delete while a selected nested folder is locked', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = page.locator('[data-lab-manager="locked"]');
    await expect(manager.getByRole('button', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await row(manager, 'Lemons').focus();
    await page.keyboard.press('Delete');
    await expect(manager.getByRole('alert')).toHaveText('Lemons are locked.');
    await expect(page.locator('[data-lab-output="Locked action"]')).toHaveText('none');
    expect(await rowNames(manager)).toContain('Fruit');
  });

  test('UIC-FOLDER-MANAGER-5.1 loads subfolders on demand and retries a failed load', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('folder-manager');
    const manager = page.locator('[data-lab-manager="lazy"]');
    await expect(row(manager, 'Pantry')).toHaveAttribute('aria-expanded', 'false');
    await page.clock.pauseAt(Date.now() + 1000);
    await manager.getByRole('button', { name: 'Expand Pantry' }).click();
    await expect(manager.locator('.ui-tree__loader')).toHaveText('Loading');
    await page.clock.runFor(300);
    await expect(manager.getByRole('row', { name: /^Shelf/ })).toHaveCount(3);
    await expect(row(manager, 'Pantry')).toHaveAttribute('aria-expanded', 'true');
    await manager.getByRole('button', { name: 'Expand Cellar' }).click();
    await page.clock.runFor(300);
    const error = row(manager, 'Cellar').getByRole('alert');
    await expect(error).toHaveText(/The cellar is locked\./);
    await error.getByRole('button', { name: 'Retry' }).click();
    await page.clock.runFor(300);
    await expect(manager.getByRole('row', { name: /^Shelf/ })).toHaveCount(6);
    await expect(manager.getByRole('alert')).toHaveCount(0);
    // Axe runs on timers, so the clock runs again for it.
    await page.clock.resume();
    await lab.expectAccessible();
  });

  test('UIC-FOLDER-MANAGER-7.1 filters the folders and marks the matches', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const manager = page.locator('[data-lab-manager="filter"]');
    const search = manager.getByRole('searchbox', { name: 'Filter orchard folders' });
    await search.fill('late plu');
    expect(await rowNames(manager)).toEqual([
      'North orchard',
      'Plums',
      'Late plums',
      'South orchard',
      'Plums',
      'Late plums',
      'East orchard',
      'Plums',
      'Late plums',
      'West orchard',
      'Plums',
      'Late plums',
    ]);
    await expect(manager.locator('mark').first()).toHaveText('Plu');
    await lab.expectAccessible();
    await search.fill('quince');
    await expect(manager.locator('.ui-tree__empty')).toHaveText('No results');
    await search.fill('');
    await expect(manager.getByRole('row')).toHaveCount(4 + 16 + 32);
  });

  test('UIC-FOLDER-MANAGER-8.1 renders only the rows in view of a large tree', async ({
    page,
    lab,
  }) => {
    await lab.open('folder-manager');
    const tree = page.getByRole('treegrid', { name: 'Warehouse folders' });
    await expect(tree).toHaveAttribute('data-virtualized', 'true');
    expect(await tree.getByRole('row').count()).toBeLessThan(60);
    await tree.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await tree.scrollIntoViewIfNeeded();
    await expect(tree.getByRole('row', { name: 'Bin 2000' })).toBeInViewport();
    expect(await tree.getByRole('row').count()).toBeLessThan(60);
  });

  test('UIC-FOLDER-MANAGER-1.1 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('folder-manager', { theme: 'dark' });
    await managed(page).getByRole('button', { name: 'New folder' }).click();
    await expect(managed(page).getByRole('textbox')).toBeFocused();
    await lab.expectAccessible();
  });
});
