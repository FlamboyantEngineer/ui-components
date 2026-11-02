import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function stateOf(scope: Locator, name: string): Locator {
  return scope.getByRole('group', { name, exact: true });
}

test.describe('State Machine View lab', () => {
  test('UIC-STATE-MACHINE-VIEW-1.1 UIC-STATE-MACHINE-VIEW-1.2 draws every state', async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const cell = (state: string, orientation: string) =>
      matrixCell(page, `state=${state} orientation=${orientation}`);
    const resting = cell('resting', 'horizontal');
    await expect(resting.locator('.ui-state-machine-view__initial-marker')).toHaveCount(1);
    await expect(resting.locator('.ui-diagram-canvas__edge')).toHaveCount(4);
    await expect(stateOf(resting, 'Closed')).toHaveAccessibleDescription(
      'Initial state. Leads to Open (open), Locked (lock). Comes from Open (close), Locked (unlock).',
    );
    await expect(
      stateOf(cell('current', 'vertical'), 'Open').locator('.ui-state-machine-view__state'),
    ).toHaveAttribute('data-current', 'true');
    await expect(
      cell('editing', 'horizontal').getByRole('button', { name: 'Open, new transition' }),
    ).toBeVisible();
    const closed = await stateOf(cell('resting', 'vertical'), 'Closed').boundingBox();
    const open = await stateOf(cell('resting', 'vertical'), 'Open').boundingBox();
    expect(requireDefined(open).y).toBeGreaterThan(
      requireDefined(closed).y + requireDefined(closed).height,
    );
    await lab.expectAccessible();
  });

  test('UIC-STATE-MACHINE-VIEW-1.2 moves the current state', async ({ page, lab }) => {
    await lab.open('state-machine-view');
    const orders = field(page, 'orders');
    const current = (name: string) =>
      stateOf(orders, name).locator('.ui-state-machine-view__state');
    await expect(current('Placed')).toHaveAttribute('data-current', 'true');
    await expect(
      stateOf(orders, 'Delivered').locator('.ui-state-machine-view__state'),
    ).toHaveAttribute('data-final', 'true');
    await page.getByRole('button', { name: 'pay', exact: true }).click();
    await expect(output(page, 'current')).toHaveText('paid');
    await expect(current('Paid')).toHaveAttribute('data-current', 'true');
    await expect(current('Placed')).not.toHaveAttribute('data-current');
    await stateOf(orders, 'Paid').focus();
    await page.keyboard.press('ArrowRight');
    await expect(stateOf(orders, 'Packed')).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-STATE-MACHINE-VIEW-3.2 adds a transition, moves and removes a state in edit mode', async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const door = field(page, 'door');
    await door.getByRole('button', { name: 'Locked, new transition' }).focus();
    await page.keyboard.press('Enter');
    await stateOf(door, 'Open').focus();
    await page.keyboard.press('Enter');
    await expect(output(page, 'transitions')).toContainText('locked→open');
    await expect(
      door.locator('.ui-diagram-canvas__edge-label', { hasText: 'step 5' }),
    ).toBeVisible();
    const before = await stateOf(door, 'Locked').boundingBox();
    await stateOf(door, 'Locked').focus();
    await page.keyboard.press('Shift+ArrowDown');
    await expect
      .poll(async () => requireDefined(await stateOf(door, 'Locked').boundingBox()).y)
      .toBeGreaterThan(requireDefined(before).y);
    await page.keyboard.press('Delete');
    await expect(output(page, 'states')).toHaveText('Closed, Open');
    await expect(output(page, 'transitions')).toHaveText('closed→open, open→closed');
    await lab.expectAccessible();
  });

  test('UIC-STATE-MACHINE-VIEW-3.3 keeps a state apart from a transition with the same id', async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const door = field(page, 'door');
    await stateOf(door, 'Open').click();
    await expect(stateOf(door, 'Open')).toHaveAttribute('data-selected', 'true');
    await expect(
      door.locator('.ui-diagram-canvas__edge-label', { hasText: /^open$/ }),
    ).not.toHaveAttribute('data-selected');
    await page.keyboard.press('Delete');
    await expect(output(page, 'states')).toHaveText('Closed, Locked');
    await expect(output(page, 'transitions')).toHaveText('closed→locked, locked→closed');
    await lab.expectAccessible();
  });

  test('UIC-STATE-MACHINE-VIEW-1.2 reads the state status in the outline', async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const orders = field(page, 'orders');
    await orders.getByRole('radio', { name: 'Outline' }).click();
    const entry = (name: string) =>
      orders
        .locator('.ui-diagram-canvas__outline-item')
        .filter({ has: page.locator('.ui-diagram-canvas__outline-label', { hasText: name }) })
        .first();
    await expect(entry('Placed')).toHaveAccessibleDescription('Current state. Initial state.');
    await expect(entry('Delivered')).toHaveAccessibleDescription('Final state.');
    await page.getByRole('button', { name: 'pay', exact: true }).click();
    await expect(entry('Paid')).toHaveAccessibleDescription('Current state.');
    await expect(entry('Placed')).toHaveAccessibleDescription('Initial state.');
    await lab.expectAccessible();
  });

  test('UIC-STATE-MACHINE-VIEW-1.2 starts at the initial state given and in the view given', async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const outline = field(page, 'kettle-outline');
    const canvas = field(page, 'kettle-canvas');
    await expect(outline.getByRole('radio', { name: 'Outline' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Diagram' })).toBeChecked();
    const entry = (name: string) =>
      outline
        .locator('.ui-diagram-canvas__outline-item')
        .filter({ has: page.locator('.ui-diagram-canvas__outline-label', { hasText: name }) })
        .first();
    await expect(entry('Cold')).toHaveAccessibleDescription(/^Initial state\./);
    await expect(entry('Heating')).toHaveAccessibleDescription(/^Current state\./);
    await expect(entry('Done')).toHaveAccessibleDescription(/^Final state\./);
    await expect(
      stateOf(canvas, 'Cold').locator('.ui-state-machine-view__initial-marker'),
    ).toHaveCount(1);
    await expect(canvas.locator('.ui-state-machine-view__initial-marker')).toHaveCount(1);
    await expect(
      stateOf(canvas, 'Heating').locator('.ui-state-machine-view__state'),
    ).toHaveAttribute('data-current', 'true');
    await outline.getByRole('radio', { name: 'Diagram' }).click();
    await expect(
      stateOf(outline, 'Cold').locator('.ui-state-machine-view__initial-marker'),
    ).toHaveCount(1);
    await canvas.getByRole('radio', { name: 'Outline' }).click();
    await expect(canvas.locator('.ui-diagram-canvas__outline-item')).toHaveCount(3);
    await lab.expectAccessible();
  });
});
