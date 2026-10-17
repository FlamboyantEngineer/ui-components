import { expect, test } from './fixtures.js';

test.describe('Loading Overlay lab', () => {
  test('UIC-LOADING-OVERLAY-1.1 UIC-LOADING-OVERLAY-1.2 UIC-LOADING-OVERLAY-1.4 draws status cards with one bar each', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const cells = page.locator('table[data-lab-matrix="extras progress"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2);
    const measured = page.locator('[data-lab-cell="extras=hint and step progress=determinate"]');
    const status = measured.getByRole('status');
    await expect(status).toContainText('Loading report');
    await expect(status.getByRole('progressbar')).toHaveCount(1);
    await expect(status.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    await expect(measured.locator('.ui-loading-card__value')).toHaveText('42%');
    await expect(measured.locator('.ui-loading-card__step')).toHaveText('6 of 9');
    const plain = page.locator('[data-lab-cell="extras=label only progress=indeterminate"]');
    await expect(plain.locator('.ui-loading-card__value')).toHaveCount(0);
    await expect(plain.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  test('UIC-LOADING-OVERLAY-1.5 keeps a cut hint whole in a tooltip', async ({ page, lab }) => {
    await lab.open('loading-overlay');
    const hint = page.locator(
      '[data-lab-cell="extras=hint and step progress=determinate"] .ui-loading-card__hint',
    );
    expect(await hint.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await hint.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Measuring the layout of every page in the quarterly report',
    );
  });

  test('UIC-LOADING-OVERLAY-2.1 UIC-LOADING-OVERLAY-2.2 covers its bounded surface', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    for (const presentation of ['card', 'scrim']) {
      const cell = page.locator(
        `[data-lab-cell="presentation=${presentation} progress=indeterminate"]`,
      );
      const surface = await cell.locator('[data-lab-surface]').boundingBox();
      const overlay = await cell.locator('.ui-loading-overlay').boundingBox();
      expect(overlay).toEqual(surface);
    }
    const scrim = page.locator('[data-lab-cell="presentation=scrim progress=determinate"]');
    await expect(scrim.locator('.ui-loading-overlay')).toHaveAttribute('aria-hidden', 'true');
    await expect(scrim.getByRole('status')).toHaveCount(0);
    const card = page.locator('[data-lab-cell="presentation=card progress=determinate"]');
    await expect(card.getByRole('status')).toBeVisible();
  });

  test('UIC-LOADING-OVERLAY-3.1 blocks a form while loading and releases it after', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="region"]');
    const region = demo.locator('.ui-loading-region');
    const input = demo.getByRole('textbox', { name: 'City' });
    const toggle = demo.getByRole('button', { name: 'Start loading' });
    await toggle.click();
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(demo.getByRole('status')).toContainText('Saving city');
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute('inert', '');
    expect(
      await input.evaluate((node: HTMLElement) => {
        node.focus();
        return document.activeElement === node;
      }),
    ).toBe(false);
    const overlay = await region.locator('.ui-loading-overlay').boundingBox();
    const content = await region.locator('.ui-loading-region__content').boundingBox();
    expect(overlay).toEqual(content);
    await demo.getByRole('button', { name: 'Stop loading' }).click();
    await expect(region).not.toHaveAttribute('aria-busy');
    await input.focus();
    await expect(input).toBeFocused();
    await lab.expectAccessible();
  });
});
