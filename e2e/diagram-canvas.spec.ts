import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function plant(page: Page): Locator {
  return page.locator('[data-lab-field="plant"]');
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function part(page: Page, name: string): Locator {
  return plant(page).getByRole('group', { name, exact: true });
}

async function centreOf(locator: Locator) {
  const box = requireDefined(await locator.boundingBox());
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Scrolls the plant's viewport into view and returns its box. */
async function viewportBox(page: Page) {
  const viewport = plant(page).locator('.ui-diagram-canvas__viewport');
  await viewport.scrollIntoViewIfNeeded();
  return requireDefined(await viewport.boundingBox());
}

test.describe('Diagram Canvas lab', () => {
  test('UIC-DIAGRAM-CANVAS-5.1 UIC-DIAGRAM-CANVAS-5.2 cancels a pending connection when editing ends', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const edges = plant(page).locator('.ui-diagram-canvas__edge');
    const before = await edges.count();
    await plant(page).getByRole('button', { name: 'Pump, outlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
    await page.getByRole('checkbox', { name: 'Editing enabled' }).uncheck();
    await expect(plant(page)).not.toHaveAttribute('data-connecting');
    await expect(plant(page).locator('.ui-diagram-canvas__connection-preview')).toHaveCount(0);
    await part(page, 'Filter').focus();
    await page.keyboard.press('Enter');
    await expect(edges).toHaveCount(before);
    await page.getByRole('checkbox', { name: 'Editing enabled' }).check();
    await plant(page).getByRole('button', { name: 'Filter, inlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
    await expect(edges).toHaveCount(before);
    await page.keyboard.press('Escape');
    await expect(plant(page)).not.toHaveAttribute('data-connecting');
  });

  test('UIC-DIAGRAM-CANVAS-5.2 gives up a pending connection when the outline is shown or its part goes', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const edges = plant(page).locator('.ui-diagram-canvas__edge');
    const before = await edges.count();
    await plant(page).getByRole('button', { name: 'Pump, outlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
    await plant(page).getByRole('radio', { name: 'Outline' }).click();
    await expect(plant(page)).not.toHaveAttribute('data-connecting');
    await plant(page).getByRole('radio', { name: 'Diagram' }).click();
    await expect(plant(page)).not.toHaveAttribute('data-connecting');
    await part(page, 'Filter').focus();
    await page.keyboard.press('Enter');
    await expect(edges).toHaveCount(before);
    await plant(page).getByRole('button', { name: 'Pump, outlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
    await part(page, 'Pump').focus();
    await page.keyboard.press('Delete');
    await expect(part(page, 'Pump')).toHaveCount(0);
    await expect(plant(page)).not.toHaveAttribute('data-connecting');
    await expect(plant(page).locator('.ui-diagram-canvas__status')).toHaveText(
      'Connection cancelled',
    );
    await plant(page).getByRole('button', { name: 'Filter, outlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
  });

  test('UIC-DIAGRAM-CANVAS-1.1 UIC-DIAGRAM-CANVAS-6.1 UIC-DIAGRAM-CANVAS-6.4 draws every state', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const cell = (state: string, routing: string) =>
      matrixCell(page, `state=${state} routing=${routing}`);
    const resting = cell('resting', 'bezier');
    await expect(resting.getByRole('group', { name: 'Filter' })).toHaveAccessibleDescription(
      'Comes from Inlet (feed).',
    );
    await expect(resting.locator('.ui-diagram-canvas__edge')).toHaveCount(2);
    await expect(
      cell('selected', 'straight').getByRole('group', { name: 'Filter' }),
    ).toHaveAttribute('data-selected', 'true');
    await expect(
      cell('editing', 'orthogonal').getByRole('button', { name: 'Inlet, out' }),
    ).toBeVisible();
    await expect(cell('empty', 'bezier').getByText('No nodes')).toBeVisible();
    await expect(cell('outline', 'bezier').getByRole('list', { name: 'Outline' })).toContainText(
      'Leads to',
    );
    await expect(resting.locator('.ui-diagram-canvas__viewport')).toHaveCSS('overflow', 'hidden');
    await lab.expectAccessible();
  });

  test('UIC-DIAGRAM-CANVAS-3.1 UIC-DIAGRAM-CANVAS-3.2 UIC-DIAGRAM-CANVAS-3.3 pans, zooms and fits', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const box = await viewportBox(page);
    const content = plant(page).locator('.ui-diagram-canvas__content');
    await expect(output(page, 'zoom')).toHaveText('100%');
    const before = await content.evaluate((node) => node.style.transform);
    await page.mouse.move(box.x + 40, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + 60, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => content.evaluate((node) => node.style.transform)).not.toBe(before);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -300);
    await page.keyboard.up('Control');
    await expect(output(page, 'zoom')).toHaveText('200%');
    await plant(page).getByRole('button', { name: 'Zoom out' }).click();
    await expect(output(page, 'zoom')).toHaveText('150%');
    await plant(page).getByRole('button', { name: 'Fit to view' }).click();
    await expect(output(page, 'zoom')).toHaveText('100%');
    await part(page, 'Pump').focus();
    await page.keyboard.press('-');
    await expect(output(page, 'zoom')).toHaveText('75%');
  });

  test('UIC-DIAGRAM-CANVAS-3.5 centres the view from the minimap', async ({ page, lab }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const minimap = plant(page).locator('.ui-diagram-canvas__minimap');
    await expect(minimap.locator('.ui-diagram-canvas__minimap-node')).toHaveCount(5);
    const content = plant(page).locator('.ui-diagram-canvas__content');
    const before = await content.evaluate((node) => node.style.transform);
    const box = requireDefined(await minimap.boundingBox());
    await page.mouse.click(box.x + 8, box.y + 8);
    await expect.poll(() => content.evaluate((node) => node.style.transform)).not.toBe(before);
    await expect(output(page, 'zoom')).toHaveText('100%');
  });

  test('UIC-DIAGRAM-CANVAS-4.1 UIC-DIAGRAM-CANVAS-4.2 selects by click, Shift-click and marquee', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const box = await viewportBox(page);
    await part(page, 'Pump').click();
    await expect(output(page, 'selection')).toHaveText('pump');
    await part(page, 'Filter').click({ modifiers: ['ControlOrMeta'] });
    await expect(output(page, 'selection')).toHaveText('pump, filter');
    const source = await centreOf(part(page, 'Source tank'));
    const pump = await centreOf(part(page, 'Pump'));
    await page.keyboard.down('Shift');
    await page.mouse.move(source.x - 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(pump.x, pump.y + 60, { steps: 5 });
    await expect(plant(page).locator('.ui-diagram-canvas__marquee')).toBeVisible();
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await expect(output(page, 'selection')).toHaveText('source, pump');
    await page.mouse.click(box.x + 20, box.y + box.height - 20);
    await expect(output(page, 'selection')).toHaveText('none');
  });

  test('UIC-DIAGRAM-CANVAS-4.3 UIC-DIAGRAM-CANVAS-4.4 moves parts by pointer and keyboard on the grid', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const pump = part(page, 'Pump');
    const start = await centreOf(pump);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 20, start.y + 12, { steps: 4 });
    await expect(pump).toHaveAttribute('data-moving', 'true');
    await page.mouse.move(start.x + 33, start.y + 26, { steps: 4 });
    await page.mouse.up();
    await expect(output(page, 'nodes')).toContainText('Pump 270,150;');
    await expect(pump).not.toHaveAttribute('data-moving');
    await pump.focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(output(page, 'nodes')).toContainText('Pump 260,100;');
    await expect(plant(page).locator('.ui-diagram-canvas__status')).toHaveText('Pump moved');
  });

  test('UIC-DIAGRAM-CANVAS-4.3 discards a move when the dragged parts are removed mid-drag', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const pump = part(page, 'Pump');
    await pump.click();
    await part(page, 'Filter').click({ modifiers: ['ControlOrMeta'] });
    const before = await output(page, 'nodes').textContent();
    await page.getByRole('button', { name: 'Remove selected in 2 seconds' }).click();
    const start = await centreOf(pump);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 40, start.y + 30, { steps: 4 });
    await expect(pump).toHaveAttribute('data-moving', 'true');
    await expect(pump).toHaveCount(0, { timeout: 5000 });
    await expect(plant(page).locator('[data-moving]')).toHaveCount(0);
    await page.mouse.up();
    const kept = (before ?? '').split('; ').filter((entry) => !/^(Pump|Filter) /.test(entry));
    await expect(output(page, 'nodes')).toHaveText(kept.join('; '));
  });

  test('UIC-DIAGRAM-CANVAS-4.3 leaves presses and text selection to controls inside nodes', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const notes = page.locator('[data-lab-field="notes"]');
    await notes.scrollIntoViewIfNeeded();
    const positions = output(page, 'note-nodes');
    await expect(positions).toHaveText('Intake 20,20; Outlet 320,60');
    await notes.getByRole('button', { name: 'Flag Intake' }).click();
    await expect(output(page, 'flagged')).toHaveText('Intake');

    const field = notes.getByRole('textbox', { name: 'Intake note' });
    const box = requireDefined(await field.boundingBox());
    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 74, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    const selected = await field.evaluate(
      (input: HTMLInputElement) => (input.selectionEnd ?? 0) - (input.selectionStart ?? 0),
    );
    expect(selected).toBeGreaterThan(0);
    await expect(positions).toHaveText('Intake 20,20; Outlet 320,60');

    const title = notes.getByText('Intake', { exact: true });
    const start = await centreOf(title);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 40, start.y + 20, { steps: 4 });
    await page.mouse.up();
    await expect(positions).not.toHaveText('Intake 20,20; Outlet 320,60');
    await expect(positions).toContainText('Outlet 320,60');
  });

  test('UIC-DIAGRAM-CANVAS-5.1 UIC-DIAGRAM-CANVAS-5.2 connects ports by drag and by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    await viewportBox(page);
    const outlet = plant(page).getByRole('button', { name: 'Source tank, outlet' });
    const from = await centreOf(outlet);
    const to = await centreOf(part(page, 'Filter'));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await expect(plant(page).locator('.ui-diagram-canvas__connection-preview')).toHaveCount(1);
    await expect(plant(page)).toHaveAttribute('data-connecting', 'true');
    await page.mouse.up();
    await expect(output(page, 'edges')).toContainText('source→filter');
    await plant(page).getByRole('button', { name: 'Bypass valve, outlet' }).focus();
    await page.keyboard.press('Enter');
    await expect(plant(page).locator('.ui-diagram-canvas__status')).toContainText(
      'Connecting from Bypass valve, outlet.',
    );
    await part(page, 'Filter').focus();
    await page.keyboard.press('Enter');
    await expect(output(page, 'edges')).toContainText('bypass→filter');
    await expect(plant(page).locator('.ui-diagram-canvas__status')).toHaveText(
      'Connected Bypass valve to Filter',
    );
  });

  test('UIC-DIAGRAM-CANVAS-5.3 adds parts from the palette by press and by drag', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const box = await viewportBox(page);
    await plant(page).getByRole('button', { name: 'Pump', exact: true }).click();
    await expect(output(page, 'nodes')).toContainText('Pump 1');
    await plant(page)
      .getByRole('button', { name: 'Tank', exact: true })
      .dragTo(plant(page).locator('.ui-diagram-canvas__viewport'), {
        targetPosition: { x: 100, y: box.height - 60 },
      });
    await expect(output(page, 'nodes')).toContainText('Tank 2');
    await expect(part(page, 'Tank 2')).toBeVisible();
  });

  test('UIC-DIAGRAM-CANVAS-6.3 UIC-DIAGRAM-CANVAS-6.4 moves between connected modules and reads the outline', async ({
    page,
    lab,
  }) => {
    await lab.open('diagram-canvas');
    const modules = page.locator('[data-lab-field="modules"]');
    await modules.getByRole('group', { name: 'Reader' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(modules.getByRole('group', { name: 'Parser' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(modules.getByRole('group', { name: 'Checker' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(output(page, 'module')).toHaveText('checker');
    await modules.getByRole('radio', { name: 'Outline' }).click();
    const outline = modules.getByRole('list', { name: 'Outline' });
    await outline.getByRole('button', { name: 'Report' }).first().click();
    await expect(outline.locator('.ui-diagram-canvas__outline-item').last()).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-DIAGRAM-CANVAS-1.4 passes axe in the dark theme', async ({ page, lab }) => {
    await lab.open('diagram-canvas', { theme: 'dark' });
    await part(page, 'Pump').click();
    await lab.expectAccessible();
  });
});
