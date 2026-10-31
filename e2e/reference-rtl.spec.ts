import { expect, test } from './fixtures.js';

test.describe('reference stylesheet right to left', () => {
  test('UIC-LABS-3.1 puts the condition rail and the severity bar on the start edge', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const group = page.locator(
      '[data-lab-demo="rtl"] .ui-condition-builder__group[data-depth="2"]',
    );
    await expect(group.first()).toHaveCSS('border-right-width', '3px');
    await expect(group.first()).toHaveCSS('border-left-width', '1px');

    await lab.open('problem-list');
    const list = page.locator('[data-lab-demo="rtl"] .ui-problem-list');
    await expect(list).toHaveCSS('border-right-width', '4px');
    await expect(list).toHaveCSS('border-left-width', '1px');
  });

  test('UIC-LABS-3.1 mirrors the attachment corner buttons and the feed line', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const attachment = page.locator('[data-lab-demo="rtl"] .ui-chat-attachment');
    const download = await attachment.locator('.ui-chat-attachment__download').boundingBox();
    const remove = await attachment.locator('.ui-chat-attachment__remove').boundingBox();
    expect(download?.x ?? 0).toBeGreaterThan(remove?.x ?? 0);
    await lab.expectAccessible('[data-lab-demo="rtl"]');

    await lab.open('activity-feed');
    const entry = page.locator('[data-lab-demo="rtl"] .ui-activity-feed__entry').first();
    // The line's inset from the entry's right edge, the start edge right to left.
    const inset = await entry.evaluate((node) => getComputedStyle(node, '::before').right);
    expect(inset).toBe('11px');
  });

  test('UIC-LABS-1.6 UIC-LABS-3.1 draws the current page bar on the start edge', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const link = page.locator('[data-lab-demo="rtl"] .ui-navigation-rail__link[data-current]');
    await expect(link).toHaveCSS('box-shadow', / -3px 0px 0px 0px inset$/);
    await lab.expectAccessible('[data-lab-demo="rtl"]');
  });
});
