import { expect, matrixCell, test, themeSegment } from './fixtures.js';

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
        const box = await matrixCell(page, `variant=${variant} tone=success size=${size}`)
          .locator(`.ui-badge`)
          .boundingBox();
        expect(box?.height).toBe(height);
      }
    }
    const dot = await matrixCell(page, 'variant=status tone=danger size=md')
      .locator('.ui-badge__dot')
      .boundingBox();
    expect(dot?.width).toBe(6);
  });

  test('UIC-BADGE-1.1 UIC-BADGE-2.1 keeps badges out of the tab order and exposes statuses', async ({
    page,
    lab,
  }) => {
    await lab.open('badge');
    const plain = matrixCell(page, 'variant=subtle tone=info size=md').locator('.ui-badge');
    await expect(plain).not.toHaveAttribute('role');
    const status = matrixCell(page, 'variant=status tone=info size=md');
    await expect(status.getByRole('status')).toHaveText('New');
    const quiet = matrixCell(page, 'option=quiet status tone=info').locator('.ui-badge');
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
    const capped = matrixCell(page, 'count=capped size=md').locator('.ui-badge');
    await expect(capped.locator('.ui-badge__label')).toHaveText('9+');
    await expect(capped.locator('.ui-badge__label')).toHaveAttribute('aria-hidden', 'true');
    const spoken = capped.locator('.ui-badge__accessible-label');
    await expect(spoken).toHaveText('12');
    const hidden = await spoken.boundingBox();
    expect(hidden?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(
      matrixCell(page, 'count=more size=md').locator('.ui-badge__accessible-label'),
    ).toHaveText('20 or more');
    const exact = matrixCell(page, 'count=exact size=md').locator('.ui-badge');
    await expect(exact.locator('.ui-badge__label')).not.toHaveAttribute('aria-hidden');
    await expect(exact.locator('.ui-badge__accessible-label')).toHaveCount(0);
    const zero = await matrixCell(page, 'count=zero size=sm').locator('.ui-badge').boundingBox();
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
    const both = matrixCell(page, 'icon=both tone=info').locator('.ui-badge');
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
      const dot = matrixCell(page, `dot=danger size=${size}`).locator(`.ui-badge`);
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

test('UIC-COUNT-1.2 UIC-COUNT-1.3 UIC-COUNT-1.4 shows the count helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('badge');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call('normalizeCount(4.7)')).toHaveText('4');
  await expect(call('normalizeCount(-2)')).toHaveText('0');
  await expect(call("formatCount(128, 'en-US', { max: 99 })")).toHaveText('99+');
  await expect(call("formatCount(12, 'en-US', { more: true })")).toHaveText('12+');
  await expect(call("formatCount(12345, 'fr-FR')")).toHaveText('12\u202f345');
});

test('UIC-BADGE-3.1 UIC-BADGE-1.2 shares count geometry and typography across appearances and selected parents in both themes', async ({
  page,
  lab,
}) => {
  await lab.open('badge');
  const section = page.getByRole('region', { name: 'Count appearances', exact: true });
  for (const theme of ['light', 'dark'] as const) {
    await themeSegment(page, theme).click();
    for (const count of ['0', '7', '12', '128']) {
      const read = async (variant: string) =>
        matrixCell(section, `variant=${variant} count=${count}`)
          .locator('.ui-badge')
          .evaluateAll((badges) =>
            badges.map((badge) => {
              const box = badge.getBoundingClientRect();
              const style = getComputedStyle(badge);
              return {
                width: box.width,
                height: box.height,
                font: `${style.fontFamily} ${style.fontSize} ${style.lineHeight}`,
                weight: style.fontWeight,
                spacing: style.letterSpacing,
                color: style.color,
                background: style.backgroundColor,
              };
            }),
          );
      const quiet = await read('subtle');
      const solid = await read('solid');
      expect(quiet).toHaveLength(4);
      expect(solid).toHaveLength(4);
      for (const styles of [quiet, solid]) {
        const [first, ...others] = styles;
        if (!first) throw new Error('No count sample rendered.');
        const { width: expectedWidth, ...expectedAppearance } = first;
        for (const { width, ...appearance } of others) {
          // Bidi inline layout rounds widths to adjacent 1/64px positions.
          expect(width).toBeCloseTo(expectedWidth, 1);
          expect(appearance).toEqual(expectedAppearance);
        }
      }
      const geometry = (style: (typeof quiet)[number] | undefined) => ({
        height: style?.height,
        font: style?.font,
        weight: style?.weight,
        spacing: style?.spacing,
      });
      expect(geometry(quiet[0])).toEqual(geometry(solid[0]));
      expect(quiet[0]?.width).toBeCloseTo(solid[0]?.width ?? 0, 1);
      expect(quiet[0]?.background).not.toBe(solid[0]?.background);
    }
  }
});
