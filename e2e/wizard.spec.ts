import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-wizard`;

test.describe('Wizard lab', () => {
  test('UIC-WIZARD-1.1 UIC-WIZARD-1.3 UIC-WIZARD-1.4 shows each step with its buttons and layout', async ({
    page,
    lab,
  }) => {
    await lab.open('wizard');
    const buttons = (id: string) =>
      page
        .locator(`${cell(id)} .ui-wizard__action`)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-action')));
    expect(await buttons('step=one orientation=horizontal')).toEqual(['cancel', 'next']);
    expect(await buttons('step=two orientation=horizontal')).toEqual([
      'cancel',
      'back',
      'skip',
      'next',
    ]);
    expect(await buttons('step=three orientation=horizontal')).toEqual([
      'cancel',
      'back',
      'finish',
    ]);
    const horizontal = page.locator(cell('step=two orientation=horizontal'));
    await expect(horizontal.getByRole('heading', { name: 'Map columns' })).toBeVisible();
    await expect(horizontal.locator('.ui-steps__item').nth(0)).toHaveAttribute(
      'data-status',
      'complete',
    );
    const stepsBox = async (id: string) =>
      requireDefined(await page.locator(`${cell(id)} .ui-wizard__steps`).boundingBox());
    const formBox = async (id: string) =>
      requireDefined(await page.locator(`${cell(id)} .ui-wizard__form`).boundingBox());
    const above = 'step=two orientation=horizontal';
    expect((await formBox(above)).y).toBeGreaterThan((await stepsBox(above)).y);
    const beside = 'step=two orientation=vertical';
    expect((await formBox(beside)).x).toBeGreaterThan((await stepsBox(beside)).x);
  });

  test('UIC-WIZARD-2.2 UIC-WIZARD-2.3 UIC-WIZARD-3.1 checks fields, then the async check, then moves focus', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('wizard');
    const demo = page.locator('[data-lab-demo="inline"]');
    const next = demo.getByRole('button', { name: 'Next' });
    const name = demo.getByRole('textbox', { name: 'Project name' });
    await next.click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await name.fill('Apollo');
    // Hold the pretend server's 600 ms check until the pending state has been seen.
    await page.clock.pauseAt(Date.now() + 1000);
    await next.click();
    await expect(next).toHaveAttribute('data-pending', 'true');
    await expect(demo.locator('.ui-wizard')).toHaveAttribute('data-pending', 'true');
    await page.clock.runFor(700);
    await expect(demo.getByRole('alert')).toHaveText('“Apollo” is taken.');
    await expect(demo.locator('.ui-steps__item').first()).toHaveAttribute('data-status', 'error');
    await name.fill('Hermes');
    await name.press('Enter');
    await page.clock.runFor(700);
    await expect(demo.getByRole('heading', { name: 'Members' })).toBeFocused();
    await expect(demo.getByRole('alert')).toHaveCount(0);
  });

  test('UIC-WIZARD-2.1 UIC-WIZARD-2.4 UIC-WIZARD-2.5 skips, goes back and finishes', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('wizard');
    const demo = page.locator('[data-lab-demo="inline"]');
    await demo.getByRole('textbox', { name: 'Project name' }).fill('Hermes');
    await demo.getByRole('button', { name: 'Next' }).click();
    await page.clock.runFor(700);
    await demo.getByRole('button', { name: 'Skip' }).click();
    await expect(demo.getByRole('heading', { name: 'Review' })).toBeFocused();
    const items = demo.locator('.ui-steps__item');
    await expect(items.nth(1)).toHaveAttribute('data-status', 'skipped');
    await expect(demo.locator('dd').first()).toHaveText('Hermes');
    await demo.getByRole('button', { name: 'Details Completed Name the project' }).click();
    await expect(demo.getByRole('heading', { name: 'Details' })).toBeFocused();
    await expect(demo.getByRole('textbox', { name: 'Project name' })).toHaveValue('Hermes');
    await demo.getByRole('button', { name: 'Next' }).click();
    await page.clock.runFor(700);
    await demo.getByRole('button', { name: 'Back' }).click();
    await expect(demo.getByRole('heading', { name: 'Details' })).toBeFocused();
    await demo.getByRole('button', { name: 'Next' }).click();
    await page.clock.runFor(700);
    await demo.getByRole('textbox', { name: 'Email addresses' }).fill('ana@example.com');
    await demo.getByRole('button', { name: 'Next' }).click();
    await expect(items.nth(1)).toHaveAttribute('data-status', 'complete');
    await demo.getByRole('button', { name: 'Create project' }).click();
    await expect(demo.getByRole('button', { name: 'Create project' })).toHaveAttribute(
      'data-pending',
      'true',
    );
    await page.clock.runFor(700);
    await expect(demo.locator('[data-lab-result]')).toHaveText('Created Hermes');
  });

  test('UIC-WIZARD-2.6 sends nothing once the panel closes during the check', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('wizard');
    const demo = page.locator('[data-lab-demo="closing"]');
    const log = demo.locator('[data-lab-log]');
    await demo.getByRole('button', { name: 'Send' }).click();
    await page.clock.runFor(500);
    await demo.getByRole('button', { name: 'Close panel' }).click();
    await page.clock.runFor(2000);
    await expect(log).toHaveText('Check aborted');
    await demo.getByRole('button', { name: 'Open panel' }).click();
    await demo.getByRole('button', { name: 'Send' }).click();
    await page.clock.runFor(2000);
    await expect(log).toHaveText('Check aborted · Report sent');
  });

  test('UIC-WIZARD-2.6 aborts the check of a record the reader switched away from', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('wizard');
    const demo = page.locator('[data-lab-demo="records"]');
    const log = demo.locator('[data-lab-log]');
    await demo.getByRole('button', { name: 'Save' }).click();
    await page.clock.runFor(500);
    await demo.getByRole('radio', { name: 'South office' }).click();
    await page.clock.runFor(2000);
    await expect(log).toHaveText('North office check aborted');
    await demo.getByRole('button', { name: 'Save' }).click();
    await page.clock.runFor(2000);
    await expect(log).toHaveText('North office check aborted · South office saved');
  });

  test('UIC-WIZARD-3.2 runs inside a modal', async ({ page, lab }) => {
    await page.clock.install();
    await lab.open('wizard');
    const demo = page.locator('[data-lab-demo="modal"]');
    await demo.getByRole('button', { name: 'New project' }).click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    await expect(dialog.locator('.ui-modal__footer')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await demo.getByRole('button', { name: 'New project' }).click();
    await dialog.getByRole('textbox', { name: 'Project name' }).fill('Hermes');
    await dialog.getByRole('button', { name: 'Next' }).click();
    await page.clock.runFor(700);
    await expect(dialog.getByRole('heading', { name: 'Members' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Details Completed Name the project' }),
    ).toBeFocused();
    await dialog.getByRole('button', { name: 'Skip' }).click();
    await dialog.getByRole('button', { name: 'Create project' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(demo.locator('[data-lab-result]')).toHaveText('Created Hermes');
  });

  test('passes axe in both themes, with a modal open', async ({ page, lab }) => {
    await lab.open('wizard');
    await lab.expectAccessible();
    await page
      .locator('[data-lab-demo="modal"]')
      .getByRole('button', { name: 'New project' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.ui-modal[data-entering]')).toHaveCount(0);
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');
    await lab.open('wizard', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
