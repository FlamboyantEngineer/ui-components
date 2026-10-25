import { expect, test } from './fixtures.js';

test('UIC-AVATAR-4.1 keeps a card avatar circular with its own typography', async ({
  page,
  lab,
}) => {
  await lab.open('avatar');
  const avatar = page.locator('[data-lab-avatar="card"]');
  await expect(avatar).toHaveCSS('border-radius', '50%');
  await expect(avatar).toHaveCSS('font-size', '13px');
  await expect(avatar.locator('.ui-avatar__surface')).toHaveCSS('border-radius', '50%');
});

test('UIC-PROGRESS-BAR-3.1 draws a circular meter with threshold styling', async ({
  page,
  lab,
}) => {
  await lab.open('progress-bar');
  const meter = page
    .locator('[data-lab-cell="mode=meter shape=circular"]')
    .getByRole('meter', { name: 'Storage' });
  await expect(meter).toHaveAttribute('aria-valuenow', '60');
  await expect(meter).toHaveAttribute('data-tone', 'success');
  await expect(meter.locator('.ui-progress-bar__ring')).toHaveCSS('width', '24px');
  await expect(meter.locator('.ui-progress-bar__fill')).toHaveAttribute('stroke-dashoffset', '40');
  await lab.expectAccessible();
});

test('UIC-SEGMENTED-BAR-3.1 shows the same shares in linear, donut and pie shapes', async ({
  page,
  lab,
}) => {
  await lab.open('segmented-bar');
  for (const shape of ['linear', 'donut', 'pie']) {
    const bar = page.locator(`[data-lab-cell="shape=${shape} size=md"] .ui-segmented-bar`);
    await expect(bar).toHaveAttribute('data-shape', shape);
    await expect(bar.locator('.ui-segmented-bar__item-value')).toHaveText(['42', '6', '4', '8']);
    await expect(bar.locator('.ui-segmented-bar__item-share')).toHaveText([
      '52.5%',
      '7.5%',
      '5%',
      '10%',
    ]);
    if (shape !== 'linear') {
      await expect(bar.locator('.ui-segmented-bar__ring')).toHaveCSS('width', '24px');
      await expect(bar.locator('.ui-segmented-bar__segment').first()).toHaveAttribute(
        'stroke-dasharray',
        '52.5 47.5',
      );
      await expect(bar.locator('.ui-segmented-bar__ring')).toHaveCSS(
        'stroke-width',
        shape === 'pie' ? '16px' : '4px',
      );
    }
  }
  await lab.expectAccessible();
});

test('UIC-STEPS-4.1 finishes the last step and allows returning to it', async ({ page, lab }) => {
  await lab.open('steps');
  const demo = page.locator('[data-lab-demo="import"]');
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await demo.getByRole('button', { name: 'Next', exact: true }).click();
  await demo.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(demo.locator('.ui-steps')).toHaveAttribute('data-complete', 'true');
  await expect(demo.locator('[aria-current]')).toHaveCount(0);
  await expect(demo.locator('.ui-steps__item[data-status="complete"]')).toHaveCount(4);
  await expect(demo.getByRole('button', { name: 'Completed', exact: true })).toBeDisabled();
  await demo.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(demo.locator('.ui-steps')).not.toHaveAttribute('data-complete');
  await expect(demo.locator('[aria-current="step"]')).toHaveCount(1);
  await lab.expectAccessible();
});

test('UIC-AVATAR-GROUP-3.1 keeps outlined group avatars opaque in both themes', async ({
  page,
  lab,
}) => {
  for (const theme of ['light', 'dark']) {
    await lab.open('avatar-group', { theme });
    const avatar = page
      .locator('[data-lab-family="avatar-group-main"] .ui-avatar[data-variant="outlined"]')
      .first();
    const background = await avatar.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    await expect(avatar.locator('.ui-avatar__surface')).toHaveCSS('background-color', background);
  }
});

test('UIC-AVATAR-GROUP-3.1 overlaps the avatars of a clickable stack', async ({ page, lab }) => {
  await lab.open('avatar-group');
  const avatars = page.locator('[data-lab-group="list"] .ui-avatar-group__avatar');
  const first = await avatars.nth(0).boundingBox();
  const second = await avatars.nth(1).boundingBox();
  if (!first || !second) throw new Error('Missing avatar geometry');
  expect(second.x).toBeGreaterThan(first.x);
  expect(second.x).toBeLessThan(first.x + first.width);
});
