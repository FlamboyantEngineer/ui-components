import type { Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

function host(page: Page) {
  return page.getByRole('group', { name: 'Host sequence', exact: true });
}

function log(page: Page) {
  return page.locator('[data-lab-output="sequence-host-log"]');
}

test('UIC-STATE-MACHINE-VIEW-5.1 UIC-STATE-MACHINE-VIEW-5.2 activates, selects and roves through enabled states', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = host(page);
  const build = scope.getByRole('button', { name: 'Build', exact: true });
  await build.click();
  await build.click();
  await expect(log(page)).toHaveText(/^activate string:build \(mouse\) \| activate string:build/);
  await page.getByRole('button', { name: 'Decline selection' }).click();
  await scope.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(log(page)).toContainText('select string:verify declined');
  await expect(build).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Toggle Build disabled' }).click();
  await scope.getByRole('button', { name: 'Intake', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(scope.getByRole('button', { name: 'Verify', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(scope.getByRole('button', { name: 'Release', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(scope.getByRole('button', { name: 'Intake', exact: true })).toBeFocused();
  await expect(build).toBeDisabled();
});

test('UIC-STATE-MACHINE-VIEW-5.4 opens host menus from pointer and keyboard requests', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = host(page);
  const check = scope.getByRole('button', { name: 'Check', exact: true });
  await check.click({ button: 'right' });
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(log(page)).toContainText('menu string:check (mouse)');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();

  await scope.locator('.ui-state-machine-view__viewport').evaluate((viewport) => {
    viewport.scrollLeft = viewport.scrollWidth;
  });
  const release = scope.getByRole('button', { name: 'Release', exact: true });
  await release.focus();
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(log(page)).toContainText('menu string:release (keyboard)');
  const anchor = requireDefined(await release.boundingBox());
  const box = requireDefined(await menu.boundingBox());
  expect(Math.abs(box.y - (anchor.y + anchor.height))).toBeLessThan(24);
  await page.keyboard.press('Escape');

  await scope.getByRole('button', { name: 'Accept', exact: true }).click({ button: 'right' });
  await expect(log(page)).toContainText('menu transition string:accept (mouse)');
  await expect(log(page)).not.toContainText('menu background');
});

test('UIC-STATE-MACHINE-VIEW-6.2 UIC-STATE-MACHINE-VIEW-6.3 shows counts inline and hints outside the clipped row', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const toolbar = page.getByRole('group', { name: 'Toolbar sequence', exact: true });
  const verify = toolbar.getByRole('button', { name: 'Verify', exact: true });
  await expect(verify.locator('.ui-state-machine-view__count')).toHaveText('9+');
  const label = requireDefined(
    await verify.locator('.ui-state-machine-view__state-label').boundingBox(),
  );
  const count = requireDefined(await verify.locator('.ui-state-machine-view__count').boundingBox());
  expect(Math.abs(count.y + count.height / 2 - (label.y + label.height / 2))).toBeLessThan(4);
  // The first state needs no scrolling, which would close its hint.
  const intake = toolbar.getByRole('button', { name: 'Intake', exact: true });
  await intake.focus();
  // A hint opens on keyboard focus: arrive at the state by key.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  const tooltip = page.getByRole('tooltip').filter({ hasText: 'Intake: complete' });
  await expect(tooltip).toBeVisible();
  const row = requireDefined(await intake.boundingBox());
  await expect(async () =>
    expect(requireDefined(await tooltip.boundingBox()).y).toBeGreaterThan(row.y + row.height - 1),
  ).toPass();
  await expect(intake).toHaveAccessibleDescription('Initial state. Complete. Intake: complete');
  await expect(verify).toHaveAccessibleDescription(/Failed\. 12 items Verify: error/);
});

test('UIC-STATE-MACHINE-VIEW-6.4 replaces data in place and empties into a focusable note', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = host(page);
  await page.getByRole('button', { name: 'Replace data' }).click();
  await page.getByRole('button', { name: 'Replace data' }).click();
  const note = scope.getByRole('note', { name: 'Workflow states' });
  await expect(note).toHaveAccessibleDescription('Right-click to add states to the workflow.');
  await note.focus();
  await page.keyboard.press('Shift+F10');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(log(page)).toContainText('menu background (keyboard)');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Replace data' }).click();
  await expect(scope.getByRole('button', { name: 'Intake', exact: true })).toBeVisible();
  await lab.expectAccessible('[data-lab-demo="sequence-host"]');
});
