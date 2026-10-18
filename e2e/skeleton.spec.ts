import { expect, test } from './fixtures.js';

test.describe('Skeleton lab', () => {
  test('UIC-SKELETON-1.1 UIC-SKELETON-1.2 draws hidden placeholders in each shape', async ({
    page,
    lab,
  }) => {
    await lab.open('skeleton');
    const cells = page.locator('table[data-lab-matrix="shape animation"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2);
    const box = (shape: string) =>
      page.locator(`[data-lab-cell="shape=${shape} animation=still"] .ui-skeleton`).boundingBox();
    const [text, rectangle, circle] = await Promise.all([
      box('text'),
      box('rectangle'),
      box('circle'),
    ]);
    expect(rectangle?.width).toBe(200);
    expect(rectangle?.height).toBe(48);
    expect(text?.width).toBe(200);
    expect(text?.height ?? 0).toBeLessThan(16);
    expect([circle?.width, circle?.height]).toEqual([40, 40]);
    const radius = await page
      .locator('[data-lab-cell="shape=circle animation=still"] .ui-skeleton')
      .evaluate((node) => getComputedStyle(node).borderRadius);
    expect(radius).toBe('50%');
    await expect(page.locator('[data-lab-section="Shapes"] .ui-skeleton').first()).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await lab.expectAccessible();
  });

  test('UIC-SKELETON-1.3 animates only placeholders that allow it', async ({ page, lab }) => {
    await lab.open('skeleton');
    const animation = (value: string) =>
      page
        .locator(`[data-lab-cell="shape=rectangle animation=${value}"] .ui-skeleton`)
        .evaluate((node) => getComputedStyle(node).animationName);
    expect(await animation('animated')).toBe('ref-skeleton-pulse');
    expect(await animation('still')).toBe('none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(async () => expect(await animation('animated')).toBe('none')).toPass();
  });

  test('UIC-SKELETON-3.1 draws text lines with a shorter last line, animated or still', async ({
    page,
    lab,
  }) => {
    await lab.open('skeleton');
    const lines = page.locator(
      '[data-lab-cell="animation=animated lines=5"] .ui-skeleton-text__line',
    );
    await expect(lines).toHaveCount(5);
    const first = await lines.first().boundingBox();
    const last = await lines.last().boundingBox();
    expect(first?.width).toBe(200);
    expect(last?.width).toBe(120);
    expect(last?.y ?? 0).toBeGreaterThan(first?.y ?? 0);
    const single = page.locator(
      '[data-lab-cell="animation=animated lines=1"] .ui-skeleton-text__line',
    );
    expect((await single.boundingBox())?.width).toBe(200);
    const still = page.locator('[data-lab-cell="animation=still lines=3"] .ui-skeleton-text__line');
    await expect(still).toHaveCount(3);
    await expect(still.first()).not.toHaveAttribute('data-animated');
    expect(await still.first().evaluate((node) => getComputedStyle(node).animationName)).toBe(
      'none',
    );
  });

  test('UIC-SKELETON-2.1 UIC-SKELETON-2.2 UIC-SKELETON-4.1 covers content while loading and reveals it intact', async ({
    page,
    lab,
  }) => {
    await lab.open('skeleton');
    const demo = page.locator('[data-lab-demo="profile"]');
    const toggle = demo.getByRole('button', { name: 'Finish loading' });
    const avatar = demo.locator('.ui-skeleton[data-shape="circle"]');
    await expect(avatar).toHaveAttribute('aria-busy', 'true');
    await expect(demo.getByRole('img', { name: 'Maria Santos' })).toHaveCount(0);
    await expect(demo.getByRole('textbox', { name: 'Note' })).toHaveCount(0);
    const covered = await avatar.boundingBox();
    const content = await avatar.locator('.ui-skeleton__content').boundingBox();
    expect(covered).toEqual(content);
    // The wrapped field is inert: Tab passes from the toggle to whatever follows the demo.
    await toggle.focus();
    await page.keyboard.press('Tab');
    await expect(demo.locator('input')).not.toBeFocused();

    await toggle.click();
    await expect(demo.locator('[data-lab-output="state"]')).toHaveText('loaded');
    await expect(avatar).not.toHaveAttribute('aria-busy');
    await expect(demo.getByRole('img', { name: 'Maria Santos' })).toBeVisible();
    const field = demo.getByRole('textbox', { name: 'Note' });
    await field.fill('Prunes the hedge in March');
    const revealed = await avatar.boundingBox();
    expect([revealed?.width, revealed?.height]).toEqual([covered?.width, covered?.height]);
    await demo.getByRole('button', { name: 'Load again' }).click();
    await expect(field).toHaveCount(0);
    await demo.getByRole('button', { name: 'Finish loading' }).click();
    await expect(demo.getByRole('textbox', { name: 'Note' })).toHaveValue(
      'Prunes the hedge in March',
    );
    await lab.expectAccessible();
  });

  test('UIC-SKELETON-2.1 keeps the loaded layout in every shape', async ({ page, lab }) => {
    await lab.open('skeleton');
    for (const shape of ['text', 'rectangle', 'circle']) {
      const loading = await page
        .locator(`[data-lab-cell="shape=${shape} state=loading"] .ui-skeleton`)
        .boundingBox();
      const loaded = await page
        .locator(`[data-lab-cell="shape=${shape} state=loaded"] .ui-skeleton`)
        .boundingBox();
      expect([loading?.width, loading?.height]).toEqual([loaded?.width, loaded?.height]);
    }
  });
});
