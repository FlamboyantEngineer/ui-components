import { expect, test } from './fixtures.js';

for (const relationship of ['description', 'label'] as const) {
  test(`UIC-TOOLTIP-2.3 UIC-TOOLTIP-2.4 maintains the anchored ${relationship} through host updates`, async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const demo = page.locator(`[data-lab-demo="anchored-${relationship}-updates"]`);
    const hint = page.getByRole('tooltip', { name: `${relationship} hint` });
    const anchor = demo.getByRole('button', {
      name: relationship === 'label' ? `First context ${relationship} hint` : 'Context anchor',
    });
    const element = await anchor.elementHandle();
    if (!element) throw new Error('Missing context anchor');
    // Keep the same anchor locator as its accessible name changes.
    const current = demo.getByRole('button').first();
    const update = demo.getByRole('button', { name: 'Update context' });
    const id = await hint.getAttribute('id');
    await expect(hint).toBeVisible();
    for (const context of ['Second context', 'Extra context Second context', 'First context']) {
      await update.focus();
      await page.keyboard.press('Enter');
      if (relationship === 'label') {
        await expect(current).toHaveAccessibleName(`${context} label hint`);
      } else {
        await expect(current).toHaveAccessibleDescription(`${context} description hint`);
      }
      await expect(hint).toHaveAttribute('id', id ?? '');
      expect(await current.evaluate((node, original) => node === original, element)).toBe(true);
    }
    await demo.getByRole('button', { name: 'Hide context hint' }).focus();
    await page.keyboard.press('Enter');
    await expect(hint).toHaveCount(0);
    if (relationship === 'label') await expect(current).toHaveAccessibleName('First context');
    else await expect(current).toHaveAccessibleDescription('First context');
    await update.focus();
    await page.keyboard.press('Enter');
    if (relationship === 'label') await expect(current).toHaveAccessibleName('Second context');
    else await expect(current).toHaveAccessibleDescription('Second context');
    await element.dispose();
  });
}
