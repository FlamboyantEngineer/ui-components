import type { Locator } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('element has no box');
  return rect;
}

test.describe('Visually Hidden lab', () => {
  test('UIC-VISUALLY-HIDDEN-1.1 UIC-VISUALLY-HIDDEN-1.2 hides content in a div or a span without taking space', async ({
    page,
    lab,
  }) => {
    await lab.open('visually-hidden');
    for (const elementType of ['div', 'span']) {
      const cell = matrixCell(page, `elementType=${elementType} isFocusable=false`);
      const hidden = cell.locator('.ui-visually-hidden');
      expect(await hidden.evaluate((node) => node.tagName.toLowerCase())).toBe(elementType);
      await expect(hidden).toHaveText('per kilogram');
      const rect = await box(hidden);
      expect(rect.width).toBeLessThanOrEqual(1);
      expect(rect.height).toBeLessThanOrEqual(1);
      expect(await cell.ariaSnapshot()).toContain('Apples, 4 € per kilogram');
    }
    const plainCell = await box(matrixCell(page, 'elementType=span isFocusable=false'));
    const focusCell = await box(matrixCell(page, 'elementType=span isFocusable=true'));
    expect(Math.abs(plainCell.height - focusCell.height)).toBeLessThanOrEqual(1);
  });

  test('UIC-VISUALLY-HIDDEN-2.1 names icon-only buttons and reads values with their context', async ({
    page,
    lab,
  }) => {
    await lab.open('visually-hidden');
    const buttons = page.locator('[data-lab-demo="icon-buttons"]');
    for (const name of ['Edit Lemon tart', 'Duplicate Plum crumble', 'Delete Pear galette']) {
      await expect(buttons.getByRole('button', { name, exact: true })).toBeVisible();
    }
    const label = await box(
      buttons.getByRole('button', { name: 'Edit Lemon tart' }).locator('.ui-visually-hidden'),
    );
    expect(label.width).toBeLessThanOrEqual(1);
    const ratings = await page.locator('[data-lab-demo="ratings"]').ariaSnapshot();
    expect(ratings).toContain('4 out of 5 stars');
    expect(ratings).not.toContain('★');
  });

  test('UIC-VISUALLY-HIDDEN-2.2 shows the skip link while it has focus and follows it with Enter', async ({
    page,
    lab,
  }) => {
    await lab.open('visually-hidden');
    const demo = page.locator('[data-lab-demo="skip"]');
    const wrapper = demo.locator('.ui-visually-hidden');
    const skip = demo.getByRole('link', { name: 'Skip to recipes' });
    expect((await box(wrapper)).width).toBeLessThanOrEqual(1);
    await expect(wrapper).not.toHaveAttribute('data-focus-within');

    await demo.getByRole('button', { name: 'Recipe menu' }).focus();
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await expect(wrapper).toHaveAttribute('data-focus-within', 'true');
    await expect.poll(async () => (await box(wrapper)).width).toBeGreaterThan(60);
    expect((await box(skip)).height).toBeGreaterThan(10);

    await page.keyboard.press('Enter');
    await expect(page.locator('#lab-recipes')).toBeFocused();
    await expect(page).toHaveURL(/#lab-recipes$/);
    await expect(wrapper).not.toHaveAttribute('data-focus-within');
    await expect.poll(async () => (await box(wrapper)).width).toBeLessThanOrEqual(1);

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: 'Drinks' })).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-VISUALLY-HIDDEN-2.2 reveals focusable matrix content only while focused', async ({
    page,
    lab,
  }) => {
    await lab.open('visually-hidden');
    const cell = matrixCell(page, 'elementType=div isFocusable=true');
    const hidden = cell.locator('.ui-visually-hidden');
    await cell.getByRole('link', { name: 'Price notes' }).focus();
    await expect(hidden).toHaveAttribute('data-focus-within', 'true');
    await expect.poll(async () => (await box(hidden)).width).toBeGreaterThan(20);
    await page.keyboard.press('Tab');
    await expect(hidden).not.toHaveAttribute('data-focus-within');
    await expect.poll(async () => (await box(hidden)).width).toBeLessThanOrEqual(1);
  });

  test('UIC-VISUALLY-HIDDEN-1.4 hides the text of library components through the hook', async ({
    page,
    lab,
  }) => {
    await lab.open('visually-hidden');
    const demo = page.locator('[data-lab-demo="components"]');
    for (const slot of [
      '.ui-badge__accessible-label',
      '.ui-shortcut__text',
      '.ui-copy-button__status',
    ]) {
      const hidden = demo.locator(slot);
      await expect(hidden).toHaveClass(/\bui-visually-hidden\b/);
      const rect = await box(hidden);
      expect(rect.width).toBeLessThanOrEqual(1);
      expect(rect.height).toBeLessThanOrEqual(1);
    }
  });
});
