import { expect, test } from './fixtures.js';

test.describe('Timeline lab, owned expansion and options', () => {
  test('UIC-TIMELINE-1.4 UIC-TIMELINE-3.1 follows expansion owned by the host in chart and table', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const demo = page.locator('[data-lab-demo="controlled-expansion"]');
    const timeline = demo.getByRole('group', { name: 'Garden jobs, expansion owned by the host' });
    const expanded = demo.locator('[data-lab-output="expanded"]');
    const labels = timeline.locator('.ui-timeline__row-name');
    await expect(labels).toHaveText(['Beds', 'Shed', 'Base', 'Walls', 'Party']);
    await expect(timeline.getByRole('button', { name: /^Turn soil/ })).toHaveCount(0);
    await demo.getByRole('button', { name: 'Expand every group' }).click();
    await expect(expanded).toHaveText('beds, shed');
    await expect(labels).toHaveText([
      'Beds',
      'Digging',
      'Sowing',
      'Shed',
      'Base',
      'Walls',
      'Party',
    ]);
    await expect(timeline.getByRole('button', { name: /^Turn soil/ })).toBeVisible();
    await demo.getByRole('button', { name: 'Only Beds' }).click();
    await expect(expanded).toHaveText('beds');
    await expect(timeline.getByRole('button', { name: /^Pour slab/ })).toHaveCount(0);
    // The toggle in the row list reports to the same owner.
    await timeline
      .locator('.ui-timeline__row-label', { hasText: 'Shed' })
      .locator('.ui-timeline__toggle')
      .click();
    await expect(expanded).toHaveText('beds, shed');
    await expect(timeline.getByRole('button', { name: /^Pour slab/ })).toBeVisible();
    await demo.getByRole('radio', { name: 'Table' }).click();
    await expect(demo.locator('.ui-timeline__table')).toBeVisible();
    await expect(expanded).toHaveText('beds, shed');
    await demo.getByRole('button', { name: 'Collapse every group' }).click();
    await demo.getByRole('radio', { name: 'Chart' }).click();
    await expect(expanded).toHaveText('none');
    await expect(labels).toHaveText(['Beds', 'Shed', 'Party']);
    await lab.expectAccessible('[data-lab-demo="controlled-expansion"]');
  });

  test('UIC-TIMELINE-1.4 UIC-TIMELINE-1.13 UIC-TIMELINE-2.2 UIC-TIMELINE-2.4 lays rows out at rowHeight and selects by mode', async ({
    page,
    lab,
  }) => {
    await lab.open('timeline');
    const demo = page.locator('[data-lab-demo="row-height"]');
    const timeline = demo.getByRole('group', { name: 'Garden jobs, row height and selection' });
    const rowsOf = timeline.locator('.ui-timeline__row');
    const height = async () => (await rowsOf.first().boundingBox())?.height;
    const labelHeight = async () =>
      (await timeline.locator('.ui-timeline__row-label').first().boundingBox())?.height;
    await expect(rowsOf).toHaveCount(7);
    expect(await height()).toBe(52);
    expect(await labelHeight()).toBe(52);
    // The bar of the second row sits one 52-pixel row below the first.
    const turn = timeline.getByRole('button', { name: /^Turn soil/ });
    const seed = timeline.getByRole('button', { name: /^Sow peas/ });
    const top = async (bar: typeof turn) => (await bar.boundingBox())?.y ?? 0;
    expect((await top(seed)) - (await top(turn))).toBe(52);
    const connectors = timeline.locator('.ui-timeline__connectors');
    const tall = (await connectors.boundingBox())?.height ?? 0;
    await demo.getByRole('radio', { name: 'Default (36)' }).click();
    expect(await height()).toBe(36);
    expect((await top(seed)) - (await top(turn))).toBe(36);
    expect((await connectors.boundingBox())?.height ?? 0).toBeLessThan(tall);
    await demo.getByRole('radio', { name: '52 pixels' }).click();

    // Selection off: no pressed state, pressing selects nothing, arrows still move the item.
    const selected = demo.locator('[data-lab-output="row-height-selected"]');
    await expect(turn).not.toHaveAttribute('aria-pressed');
    await turn.click();
    await expect(selected).toHaveText('none');
    await expect(turn).not.toHaveAttribute('data-selected');
    const before = (await turn.boundingBox())?.x ?? 0;
    await turn.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await turn.boundingBox())?.x ?? 0).toBeGreaterThan(before);

    await demo.getByRole('radio', { name: 'Single' }).click();
    await expect(turn).toHaveAttribute('aria-pressed', 'false');
    await turn.click();
    await seed.click();
    await expect(selected).toHaveText('seed');
    await demo.getByRole('radio', { name: 'Multiple' }).click();
    await turn.click();
    await seed.click();
    await expect(selected).toHaveText('turn, seed');
    await demo.getByRole('button', { name: 'Put the jobs back' }).click();
    await lab.expectAccessible('[data-lab-demo="row-height"]');
  });
});
