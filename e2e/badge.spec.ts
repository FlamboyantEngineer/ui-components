import { expect, test } from './fixtures.js';

test.describe('Badge lab', () => {
  test('UIC-BADGE-1.2 UIC-BADGE-1.3 UIC-BADGE-1.4 draws every variant and tone at three heights', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const cells = page.locator('table[data-lab-matrix="variant tone size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 5 * 3);
    for (const variant of ['subtle', 'solid', 'status']) {
      for (const [size, height] of [
        ['sm', 18],
        ['md', 22],
        ['lg', 26],
      ] as const) {
        const box = await page
          .locator(`[data-lab-cell="variant=${variant} tone=success size=${size}"] .ui-badge`)
          .boundingBox();
        expect(box?.height).toBe(height);
      }
    }
    const dot = await page
      .locator('[data-lab-cell="variant=status tone=danger size=md"] .ui-badge__dot')
      .boundingBox();
    expect(dot?.width).toBe(6);
  });

  test('UIC-BADGE-1.1 UIC-BADGE-2.1 keeps badges out of the tab order and exposes statuses', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const plain = page.locator('[data-lab-cell="variant=subtle tone=info size=md"] .ui-badge');
    await expect(plain).not.toHaveAttribute('role');
    const status = page.locator('[data-lab-cell="variant=status tone=info size=md"]');
    await expect(status.getByRole('status')).toHaveText('New');
    const quiet = page.locator('[data-lab-cell="option=quiet status tone=info"] .ui-badge');
    await expect(quiet).not.toHaveAttribute('role');
    await expect(quiet.locator('.ui-badge__dot')).toBeVisible();
    expect(await page.locator('#lab-root .ui-badge[tabindex]').count()).toBe(0);
    await lab.expectAccessible();
  });

  test('UIC-BADGE-3.1 UIC-BADGE-3.2 caps counts visibly and keeps the full value for readers', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const capped = page.locator('[data-lab-cell="count=capped size=md"] .ui-badge');
    await expect(capped.locator('.ui-badge__label')).toHaveText('9+');
    await expect(capped.locator('.ui-badge__label')).toHaveAttribute('aria-hidden', 'true');
    const spoken = capped.locator('.ui-badge__accessible-label');
    await expect(spoken).toHaveText('12');
    const hidden = await spoken.boundingBox();
    expect(hidden?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(
      page.locator('[data-lab-cell="count=more size=md"] .ui-badge__accessible-label'),
    ).toHaveText('20 or more');
    const exact = page.locator('[data-lab-cell="count=exact size=md"] .ui-badge');
    await expect(exact.locator('.ui-badge__label')).not.toHaveAttribute('aria-hidden');
    await expect(exact.locator('.ui-badge__accessible-label')).toHaveCount(0);
    const zero = await page.locator('[data-lab-cell="count=zero size=sm"] .ui-badge').boundingBox();
    expect(zero?.width).toBeGreaterThanOrEqual(18);
    expect(await capped.evaluate((node) => getComputedStyle(node).fontVariantNumeric)).toContain(
      'tabular-nums',
    );
  });

  test('UIC-BADGE-3.3 pins overlay counts to the host corner without resizing it', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const host = page.locator('[data-lab-overlay-host="messages"]');
    const button = host.getByRole('button');
    const badge = host.locator('.ui-badge');
    await expect(badge).toHaveAttribute('data-placement', 'overlay');
    await host.scrollIntoViewIfNeeded();
    const hostBox = await host.boundingBox();
    const buttonBox = await button.boundingBox();
    const badgeBox = await badge.boundingBox();
    expect(hostBox?.width).toBe(buttonBox?.width);
    expect((badgeBox?.x ?? 0) + (badgeBox?.width ?? 0)).toBeGreaterThan(
      (buttonBox?.x ?? 0) + (buttonBox?.width ?? 0),
    );
    expect(badgeBox?.y ?? 0).toBeLessThan(buttonBox?.y ?? 0);
    expect(await badge.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe('none');
    await page.mouse.click(
      (badgeBox?.x ?? 0) + (badgeBox?.width ?? 0) / 4,
      (badgeBox?.y ?? 0) + (badgeBox?.height ?? 0) - 2,
    );
    await expect(badge.locator('.ui-badge__label')).toHaveText('9+');
    await expect(button).toHaveAccessibleName('Messages, 13 unread');
  });

  test('UIC-BADGE-1.7 UIC-BADGE-4.1 draws icons beside labels and dot markers without text', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const both = page.locator('[data-lab-cell="icon=both tone=info"] .ui-badge');
    const start = await both.locator('.ui-badge__start-icon').boundingBox();
    const label = await both.locator('.ui-badge__label').boundingBox();
    const end = await both.locator('.ui-badge__end-icon').boundingBox();
    expect(start?.x ?? 0).toBeLessThan(label?.x ?? 0);
    expect(end?.x ?? 0).toBeGreaterThan(label?.x ?? 0);
    expect(start?.width).toBeCloseTo(14.4, 0);
    expect((await both.boundingBox())?.height).toBe(22);
    for (const [size, width] of [
      ['sm', 6],
      ['md', 8],
      ['lg', 10],
    ] as const) {
      const dot = page.locator(`[data-lab-cell="dot=danger size=${size}"] .ui-badge`);
      expect((await dot.boundingBox())?.width).toBe(width);
      await expect(dot.locator('.ui-badge__accessible-label')).toHaveText('Sold out marker');
    }
    await lab.expectAccessible();
  });

  test('UIC-BADGE-3.4 UIC-BADGE-4.1 hides a count at zero and pins a dot to its host', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const demo = page.locator('[data-lab-demo="zero"]');
    const inbox = demo.locator('[data-lab-overlay-host="inbox"]');
    const button = inbox.getByRole('button');
    await expect(inbox.locator('.ui-badge__label')).toHaveText('2');
    await button.click();
    await expect(inbox.locator('.ui-badge__label')).toHaveText('1');
    await button.click();
    await expect(demo.locator('[data-lab-output="unread"]')).toHaveText('0');
    await expect(inbox.locator('.ui-badge')).toHaveCount(0);

    const host = demo.locator('[data-lab-overlay-host="dot"]');
    const dot = host.locator('.ui-badge');
    await expect(dot).toHaveAttribute('data-placement', 'overlay');
    const hostBox = await host.boundingBox();
    const dotBox = await dot.boundingBox();
    expect((dotBox?.x ?? 0) + (dotBox?.width ?? 0)).toBeGreaterThan(
      (hostBox?.x ?? 0) + (hostBox?.width ?? 0),
    );
    expect(dotBox?.y ?? 0).toBeLessThan(hostBox?.y ?? 0);
    expect(hostBox?.width).toBe((await host.getByRole('button').boundingBox())?.width);
    await lab.expectAccessible();
  });
});
