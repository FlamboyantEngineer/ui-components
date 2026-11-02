import { expect, test } from './fixtures.js';

for (const enabled of [false, true]) {
  test(`UIC-TABLE-3.5 repeats reader selection events only when enabled=${String(enabled)}`, async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const name = enabled ? 'enabled' : 'default';
    const demo = page.locator(`[data-lab-demo="repeat-selection-${name}"]`);
    const row = demo.getByRole('row', { name: 'Alpha', exact: true });
    await row.click();
    await row.click();
    await row.press('Enter');
    await row.press('Enter');
    const count = enabled ? '4' : '0';
    await expect(demo.locator(`[data-lab-output="repeat-events-${name}"]`)).toHaveText(count);
    const disabled = await demo
      .getByRole('row', { name: 'Blue', exact: true })
      .getByRole('rowheader')
      .boundingBox();
    if (!disabled) throw new Error('The disabled row must remain visible');
    await page.mouse.click(disabled.x + disabled.width / 2, disabled.y + disabled.height / 2);
    await row.getByRole('button', { name: 'Inspect' }).click();
    await expect(demo.locator(`[data-lab-output="repeat-inspections-${name}"]`)).toHaveText('1');
    await demo.getByRole('button', { name: `Rerender ${name}` }).click();
    await expect(demo.locator(`[data-lab-output="repeat-renders-${name}"]`)).toHaveText('1');
    await expect(demo.locator(`[data-lab-output="repeat-events-${name}"]`)).toHaveText(count);
    await lab.expectAccessible(`[data-lab-demo="repeat-selection-${name}"]`);
  });
}
