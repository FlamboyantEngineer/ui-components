import { expect, test, matrixCell } from './fixtures.js';

test.describe('Disclosure lab', () => {
  test('UIC-DISCLOSURE-1.1 UIC-DISCLOSURE-1.4 UIC-DISCLOSURE-4.1 draws titled triggers with the indicator at either end', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const cells = page.locator('table[data-lab-matrix="indicator state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 3);
    for (const indicator of ['start', 'end']) {
      const cell = matrixCell(page, `indicator=${indicator} state=collapsed`);
      const heading = cell.getByRole('heading', { level: 3, name: 'Opening hours' });
      const trigger = heading.getByRole('button', { name: 'Opening hours' });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-indicator-position', indicator);
      const glyph = await trigger.locator('.ui-disclosure__indicator').boundingBox();
      const title = await trigger.locator('.ui-disclosure__title').boundingBox();
      const triggerBox = await trigger.boundingBox();
      if (indicator === 'start') {
        expect(glyph?.x ?? 0).toBeLessThan(title?.x ?? 0);
      } else {
        expect(glyph?.x ?? 0).toBeGreaterThan((title?.x ?? 0) + (title?.width ?? 0));
        // The end indicator sits at the trigger's far edge.
        expect((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0) - (glyph?.x ?? 0)).toBeLessThan(30);
      }
    }
    const expanded = matrixCell(page, 'indicator=end state=expanded');
    await expect(expanded.getByRole('group', { name: 'Opening hours' })).toBeVisible();
    await expect(expanded.locator('.ui-disclosure__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-up',
    );
    await lab.expectAccessible();
  });

  test('UIC-DISCLOSURE-1.2 opens and closes the panel with its measured height', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const cell = matrixCell(page, 'indicator=start state=collapsed');
    const trigger = cell.getByRole('button', { name: 'Opening hours' });
    const panel = cell.locator('.ui-disclosure__panel');
    await expect(panel).toHaveAttribute('hidden', 'until-found');
    await expect(panel).not.toBeVisible();
    await trigger.click();
    await expect(cell.locator('.ui-disclosure')).toHaveAttribute('data-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('--disclosure-panel-height', 'auto');
    await expect(cell.locator('.ui-disclosure__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );
    await trigger.click();
    await expect(panel).toHaveAttribute('hidden', 'until-found');
    expect((await panel.evaluate((node) => node.getBoundingClientRect().height)) ?? 1).toBe(0);
  });

  test('UIC-DISCLOSURE-3.1 UIC-DISCLOSURE-4.2 moves through an accordion by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="accordion"]');
    const button = (name: string) => demo.getByRole('button', { name });
    await button('When is the market open?').focus();
    await page.keyboard.press('ArrowDown');
    await expect(button('Is there parking?')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(button('Is there parking?')).toHaveAttribute('aria-expanded', 'true');
    await expect(button('When is the market open?')).toHaveAttribute('aria-expanded', 'false');
    await expect(demo.getByRole('group', { name: 'Is there parking?' })).toBeVisible();
    await page.keyboard.press('End');
    await expect(button('Can I bring a dog?')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(button('When is the market open?')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(button('Can I bring a dog?')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(button('Can I bring a dog?')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Home');
    await expect(button('When is the market open?')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(button('Is there parking?')).toBeFocused();
    await expect(button('Can I rent a stall?')).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-DISCLOSURE-1.6 UIC-DISCLOSURE-3.3 refuses disabled triggers and groups', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const cell = matrixCell(page, 'indicator=start state=disabled');
    const trigger = cell.getByRole('button', { name: 'Opening hours' });
    await expect(trigger).toBeDisabled();
    await expect(cell.locator('.ui-disclosure')).toHaveAttribute('data-disabled', 'true');
    await trigger.click({ force: true });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const group = page.locator('[data-lab-demo="disabled-group"] .ui-disclosure-group');
    await expect(group).toHaveAttribute('data-disabled', 'true');
    await expect(group.getByRole('button')).toHaveCount(2);
    for (const button of await group.getByRole('button').all()) await expect(button).toBeDisabled();
    await expect(group.getByRole('group', { name: 'Winter opening' })).toBeVisible();
  });

  test('UIC-DISCLOSURE-3.2 controls several open disclosures by their keys', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="multiple"]');
    const output = demo.locator('[data-lab-output="keys"]');
    await expect(output).toHaveText('apples');
    await demo.getByRole('button', { name: 'Pears' }).click();
    await expect(output).toHaveText('apples, pears');
    await expect(demo.getByRole('button', { name: 'Apples' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await demo.getByRole('button', { name: 'Expand all' }).click();
    await expect(demo.getByRole('group')).toHaveCount(3);
    await demo.getByRole('button', { name: 'Collapse all' }).click();
    await expect(output).toHaveText('none');
    await expect(demo.getByRole('group')).toHaveCount(0);
  });

  test('UIC-DISCLOSURE-2.1 UIC-DISCLOSURE-2.2 keeps a header action beside the trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="header"]');
    const trigger = demo.getByRole('button', { name: 'Delivery address' });
    const edit = demo.getByRole('button', { name: 'Edit address' });
    const triggerBox = await trigger.boundingBox();
    const editBox = await edit.boundingBox();
    expect(editBox?.x ?? 0).toBeGreaterThanOrEqual((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0));
    expect(Math.abs((editBox?.y ?? 0) - (triggerBox?.y ?? 0))).toBeLessThan(10);
    await edit.click();
    await expect(demo.locator('[data-lab-output="edits"]')).toHaveText('1');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByRole('region', { name: 'Delivery address' })).toHaveText(
      '12 Harbour Road, Porto',
    );
    await lab.expectAccessible();
  });

  test('UIC-DISCLOSURE-1.3 follows a controlled state', async ({ page, lab }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="controlled"]');
    const trigger = demo.getByRole('button', { name: 'Lemon cake' });
    await demo.getByRole('button', { name: 'Show recipe' }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByRole('listitem')).toHaveCount(3);
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(demo.getByRole('button', { name: 'Show recipe' })).toBeVisible();
  });

  test('UIC-DISCLOSURE-1.5 steps heading levels down through nested panels', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="nested"]');
    await expect(demo.getByRole('heading', { level: 3, name: 'Garden' })).toBeVisible();
    await expect(demo.getByRole('heading', { level: 4, name: 'Orchard' })).toBeVisible();
    await expect(demo.getByRole('heading', { level: 5, name: 'Apples' })).toBeVisible();
    await expect(demo.getByRole('heading', { level: 4, name: 'Pond' })).toBeVisible();
    await expect(demo.getByRole('heading', { level: 2, name: 'Greenhouse' })).toBeVisible();
    await expect(demo.getByRole('heading', { level: 3, name: 'Seedlings' })).toBeVisible();
    // The inner group's arrows stay inside it.
    await demo.getByRole('button', { name: 'Apples' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(demo.getByRole('button', { name: 'Pears' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(demo.getByRole('button', { name: 'Apples' })).toBeFocused();
  });

  test("UIC-DISCLOSURE-3.1 UIC-EXPAND-TOGGLE-1.7 keeps a panel's disclosures and toggles its own", async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="nested-content"]');
    const delivery = demo.getByRole('button', { name: 'Delivery', exact: true });
    const advanced = demo.getByRole('button', { name: 'Advanced delivery' });
    await advanced.click();
    await expect(advanced).toHaveAttribute('aria-expanded', 'true');
    await expect(delivery).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByText('Leave with a neighbour.')).toBeVisible();
    const toggle = demo.getByRole('button', { name: 'Sections in Getting started' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(demo.getByRole('button', { name: 'Contents' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await lab.expectAccessible('[data-lab-section="Nested content"]');
  });

  test('UIC-DISCLOSURE-4.3 opens a collapsed panel that find in page matches', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="find"]');
    const panel = demo.locator('.ui-disclosure__panel');
    await expect(panel).toHaveAttribute('hidden', 'until-found');
    await expect(panel).toHaveText('Three jars of orange marmalade.');
    // Playwright cannot drive the browser's find bar; it fires `beforematch` on the match's panel.
    await panel.dispatchEvent('beforematch');
    await expect(demo.getByRole('button', { name: 'Pantry' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(panel).toBeVisible();
  });

  test('UIC-DISCLOSURE-1.7 UIC-DISCLOSURE-2.1 renders caller roots with their state and focuses the trigger by ref', async ({
    page,
    lab,
  }) => {
    await lab.open('disclosure');
    const demo = page.locator('[data-lab-demo="rendered-roots"]');
    const output = (name: string) => demo.locator(`[data-lab-output="${name}"]`);
    await expect(demo.locator('[data-lab-rendered="group"]')).toHaveClass(/ui-disclosure-group/);
    await expect(demo.locator('[data-lab-rendered="route"]')).toHaveClass(/ui-disclosure/);
    await expect(output('route-state')).toHaveText(
      'Expanded: true · disabled: false · focus within: false',
    );
    await expect(output('packing-state')).toHaveText('Expanded: false · disabled: false');

    const field = demo.getByRole('textbox', { name: 'Starting point' });
    await field.fill('Village green');
    const route = demo.getByRole('button', { name: 'Route', exact: true });
    await route.click();
    await expect(output('route-state')).toHaveText(/^Expanded: false/);
    await route.click();
    await expect(field).toHaveValue('Village green');

    await demo.getByRole('button', { name: 'Focus the packing trigger' }).click();
    const packing = demo.getByRole('button', { name: 'Packing', exact: true });
    await expect(packing).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(output('packing-state')).toHaveText('Expanded: true · disabled: false');
    const panel = demo.getByRole('region', { name: 'Packing' });
    await expect(panel).toHaveAttribute('data-lab-rendered', 'packing-panel');
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('textbox', { name: 'Things to bring' })).toBeFocused();
    await expect(output('panel-state')).toHaveText('Panel focus within: true');
    await expect(output('packing-state')).toHaveText('Expanded: true · disabled: false');

    await demo.getByRole('switch', { name: 'Disable the group' }).press('Space');
    await expect(output('group-state')).toHaveText('Group disabled: true');
    await expect(output('route-state')).toHaveText(/disabled: true/);
    await expect(packing).toBeDisabled();
    await lab.expectAccessible('[data-lab-demo="rendered-roots"]');
  });
});
