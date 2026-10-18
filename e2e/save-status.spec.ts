import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-save-status`;

test.describe('Save Status lab', () => {
  test('UIC-SAVE-STATUS-1.1 UIC-SAVE-STATUS-1.3 words every phase and offers retry', async ({
    page,
    lab,
  }) => {
    await lab.open('save-status');
    for (const [phase, text] of [
      ['idle', ''],
      ['dirty', 'Unsaved changes'],
      ['saving', 'Saving…'],
      ['saved', 'Saved'],
      ['error', 'Not saved'],
      ['offline', 'Offline'],
    ] as const) {
      const status = page.locator(cell(`phase=${phase} retry=retry`));
      await expect(status).toHaveAttribute('data-phase', phase);
      await expect(status.getByRole('status')).toHaveText(text);
      await expect(status.getByRole('button', { name: 'Retry' })).toHaveCount(
        phase === 'error' ? 1 : 0,
      );
    }
    await expect(page.locator(cell('phase=error retry=no retry')).getByRole('button')).toHaveCount(
      0,
    );
  });

  test('UIC-SAVE-STATUS-1.5 cuts a long label and shows it whole on hover', async ({
    page,
    lab,
  }) => {
    await lab.open('save-status');
    const label = page.locator(`${cell('width=140px')} .ui-save-status__label`);
    expect(await label.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await page.mouse.move(5, 5);
    await label.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Not saved: the server is busy, try again in a minute',
    );
    const wide = page.locator(`${cell('width=wide')} .ui-save-status__label`);
    expect(await wide.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(false);
  });

  test('UIC-SAVE-STATUS-1.2 UIC-SAVE-STATUS-1.4 runs an autosave with a fading saved label', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('save-status');
    const demo = page.locator('[data-lab-demo="autosave"]');
    const status = demo.locator('.ui-save-status');
    const region = status.getByRole('status');
    await demo.getByRole('textbox', { name: 'Notes' }).fill('Grocery list: apples');
    await expect(region).toHaveText('Unsaved changes');
    await page.clock.runFor(1000);
    await expect(region).toHaveText('Saving…');
    await page.clock.runFor(800);
    await expect(region).toHaveText('Saved');
    await page.clock.runFor(2000);
    await expect(status).toHaveAttribute('data-exiting', 'true');
    await page.clock.runFor(500);
    await expect(region).toHaveText('');
    await expect(status).toHaveAttribute('data-phase', 'saved');
    await expect(status).not.toHaveAttribute('data-exiting');
  });

  test('UIC-SAVE-STATUS-1.3 retries a failed save', async ({ page, lab }) => {
    await page.clock.install();
    await lab.open('save-status');
    const demo = page.locator('[data-lab-demo="autosave"]');
    const region = demo.getByRole('status');
    const input = demo.getByRole('textbox', { name: 'Notes' });
    for (const text of ['a', 'b', 'c']) {
      await input.fill(text);
      await page.clock.runFor(1800);
    }
    await expect(region).toHaveText('Not saved: the connection dropped');
    await demo.getByRole('button', { name: 'Retry' }).click();
    await expect(region).toHaveText('Saving…');
    await page.clock.runFor(800);
    await expect(region).toHaveText('Saved');
  });

  test('UIC-SAVE-STATUS-1.2 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('save-status');
    await expect(page.locator('#lab-root .ui-save-status').first()).toBeAttached();
    await lab.expectAccessible();
    await lab.open('save-status', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
