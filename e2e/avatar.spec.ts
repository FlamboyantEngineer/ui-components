import { expect, familySelector, matrix, matrixCell, test } from './fixtures.js';

test.describe('Avatar lab', () => {
  test('UIC-AVATAR-1.1 UIC-AVATAR-2.1 draws pictures, initials and group glyphs at every size', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const cells = matrix(page, 'avatar-main').locator(
      'table[data-lab-matrix="content variant size"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(3 * 2 * 5);
    for (const [size, pixels] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 32],
      ['lg', 40],
      ['fill', 48],
    ] as const) {
      for (const content of ['picture', 'initials', 'group']) {
        const cell = matrixCell(page, `content=${content} variant=filled size=${size}`, {
          family: 'avatar-main',
        });
        const box = await cell.locator('.ui-avatar').boundingBox();
        expect(box?.width).toBe(pixels);
        expect(box?.height).toBe(pixels);
      }
    }
    const picture = matrixCell(page, 'content=picture variant=filled size=md', {
      family: 'avatar-main',
    }).locator('img');
    await expect(picture).toHaveClass('ui-avatar__image');
    expect(await picture.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
      0,
    );
    await expect(
      matrixCell(page, 'content=initials variant=filled size=md', {
        family: 'avatar-main',
      }).locator('.ui-avatar__initials'),
    ).toHaveText('MS');
    await expect(
      matrixCell(page, 'content=group variant=filled size=md', { family: 'avatar-main' }).locator(
        '.ui-avatar__glyph',
      ),
    ).toBeVisible();
  });

  test('UIC-AVATAR-1.3 UIC-AVATAR-2.2 colours each slot through the stylesheet only', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const fills = new Set<string>();
    for (let slot = 0; slot < 8; slot += 1) {
      const filled = matrixCell(page, `variant=filled slot=${slot}`, {
        family: 'avatar-main',
      }).locator(`.ui-avatar`);
      await expect(filled).toHaveAttribute('data-color', String(slot));
      const fill = await filled
        .locator('.ui-avatar__initials')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      fills.add(fill);
      const ring = await matrixCell(page, `variant=outlined slot=${slot}`, {
        family: 'avatar-main',
      })
        .locator(`.ui-avatar`)
        .evaluate((node) => getComputedStyle(node, '::after').borderTopColor);
      expect(ring).toBe(fill);
    }
    expect(fills.size).toBe(8);
    await expect(
      page.locator(
        `${familySelector('avatar-main')} .ui-avatar[style], ${familySelector('avatar-main')} .ui-avatar [style]`,
      ),
    ).toHaveCount(0);
  });

  test('UIC-AVATAR-1.4 falls back to the initials and tries a new address again', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = matrix(page, 'avatar-main').locator('[data-lab-avatar="fallback"]');
    await expect(avatar.locator('img')).toBeVisible();
    await page.getByRole('button', { name: 'Break the picture' }).click();
    await expect(matrix(page, 'avatar-main').locator('[data-lab-output="picture"]')).toHaveText(
      'broken',
    );
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('JB');
    await expect(avatar.locator('img')).toHaveCount(0);
    await page.getByRole('button', { name: 'Restore the picture' }).click();
    await expect(avatar.locator('img')).toBeVisible();
    await expect(avatar).toHaveAccessibleName('Jon Berg');
  });

  test('UIC-AVATAR-1.4 tries a new responsive candidate after the first one fails', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const avatar = matrix(page, 'avatar-main').locator('[data-lab-avatar="candidate"]');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('PN');
    await expect(avatar.locator('img')).toHaveCount(0);
    await page.getByRole('button', { name: 'Offer a working candidate' }).click();
    const image = avatar.locator('img');
    await expect(image).toBeVisible();
    await expect(avatar).not.toHaveAttribute('data-loading');
    expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(
      0,
    );
  });

  test('UIC-AVATAR-1.2 UIC-AVATAR-3.1 names avatars, hides decorative ones and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const derived = matrixCell(page, 'name=jon de berg source=derived', { family: 'avatar-main' });
    await expect(derived.getByRole('img', { name: 'jon de berg' })).toHaveText('JB');
    await expect(
      matrixCell(page, 'name=(blank) source=derived', { family: 'avatar-main' }).getByRole('img'),
    ).toHaveAccessibleName('Unnamed');
    await expect(
      matrixCell(page, 'name=Plato source=explicit initials', { family: 'avatar-main' }).locator(
        '.ui-avatar',
      ),
    ).toHaveText('AI');
    const decorative = matrixCell(page, 'name=Plato source=decorative', {
      family: 'avatar-main',
    }).locator('.ui-avatar');
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role');
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-2.3 rounds or squares the corners by shape', async ({ page, lab }) => {
    await lab.open('avatar');
    const radius = async (shape: string, content: string) =>
      matrixCell(page, `shape=${shape} content=${content} variant=filled`, {
        family: 'avatar-main',
      })
        .locator(`.ui-avatar`)
        .evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    for (const content of ['picture', 'initials', 'group']) {
      expect(await radius('circle', content)).toBe('50%');
      expect(await radius('rounded', content)).toBe('25%');
      expect(await radius('square', content)).toBe('0px');
    }
    await expect(
      matrixCell(page, 'shape=square content=picture variant=filled', {
        family: 'avatar-main',
      }).locator('.ui-avatar'),
    ).toHaveAttribute('data-shape', 'square');
  });

  test('UIC-AVATAR-1.1 centres the group glyph in every size, shape, variant and card trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const offCentre = (cell: ReturnType<typeof matrixCell>) =>
      cell.locator('.ui-avatar__surface').evaluate((surface) => {
        const glyph = surface.querySelector('.ui-avatar__glyph');
        if (!glyph) return Number.POSITIVE_INFINITY;
        const outer = surface.getBoundingClientRect();
        const inner = glyph.getBoundingClientRect();
        return Math.max(
          Math.abs(inner.left + inner.width / 2 - (outer.left + outer.width / 2)),
          Math.abs(inner.top + inner.height / 2 - (outer.top + outer.height / 2)),
        );
      });
    const cells = [
      ...['xs', 'sm', 'md', 'lg', 'fill'].flatMap((size) =>
        ['filled', 'outlined'].map((variant) => `content=group variant=${variant} size=${size}`),
      ),
      ...['circle', 'rounded', 'square'].flatMap((shape) =>
        ['filled', 'outlined'].flatMap((variant) => [
          `shape=${shape} content=group variant=${variant}`,
          `shape=${shape} variant=${variant}`,
        ]),
      ),
    ];
    for (const address of cells) {
      const cell = matrixCell(page, address, { family: 'avatar-main' });
      expect(await offCentre(cell), address).toBeLessThanOrEqual(0.5);
    }
    await expect(
      matrixCell(page, 'shape=circle variant=filled', { family: 'avatar-main' }).getByRole(
        'button',
        {
          name: 'Design team',
        },
      ),
    ).toBeVisible();
  });

  test('UIC-AVATAR-2.2 draws the outline over a surface that fills the whole box', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    for (const shape of ['circle', 'rounded', 'square']) {
      for (const content of ['picture', 'initials', 'group']) {
        const avatar = matrixCell(page, `shape=${shape} content=${content} variant=outlined`, {
          family: 'avatar-main',
        }).locator('.ui-avatar');
        const geometry = await avatar.evaluate((root) => {
          const surface = root.querySelector('.ui-avatar__surface');
          const outer = root.getBoundingClientRect();
          const inner = surface?.getBoundingClientRect();
          const ring = getComputedStyle(root, '::after');
          return {
            insets: inner
              ? [
                  inner.left - outer.left,
                  inner.top - outer.top,
                  outer.right - inner.right,
                  outer.bottom - inner.bottom,
                ]
              : [],
            rootBorder: getComputedStyle(root).borderTopWidth,
            ring: ring.borderTopWidth,
            ringRadius: ring.borderTopLeftRadius,
            rootRadius: getComputedStyle(root).borderTopLeftRadius,
            width: outer.width,
          };
        });
        expect(geometry.insets, `${shape} ${content}`).toEqual([0, 0, 0, 0]);
        expect(geometry.rootBorder).toBe('0px');
        expect(geometry.ring).toBe('2px');
        expect(geometry.ringRadius).toBe(geometry.rootRadius);
        expect(geometry.width).toBe(40);
      }
    }
  });

  test('UIC-AVATAR-1.5 UIC-AVATAR-1.6 reports each loading status and keeps picture attributes', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const statuses = matrix(page, 'avatar-main').locator('[data-lab-output="status"]');
    const avatar = matrix(page, 'avatar-main').locator('[data-lab-avatar="status"]');
    await expect(statuses).toHaveText('idle');
    await page.getByRole('button', { name: 'Load a working picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded');
    await expect(avatar.locator('img')).toBeVisible();
    await expect(avatar).not.toHaveAttribute('data-loading');
    await page.getByRole('button', { name: 'Load a broken picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded, loading, error');
    await expect(avatar.locator('.ui-avatar__initials')).toHaveText('LO');
    await page.getByRole('button', { name: 'Remove the picture' }).click();
    await expect(statuses).toHaveText('idle, loading, loaded, loading, error, idle');

    const picture = matrix(page, 'avatar-main').locator('[data-lab-avatar="attributes"] img');
    await expect(picture).toHaveAttribute('srcset', /1x, data:image\/svg\+xml,.* 2x$/);
    await expect(picture).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(picture).toHaveAttribute('crossorigin', 'anonymous');
    await expect(picture).toHaveAttribute('loading', 'lazy');
    await picture.scrollIntoViewIfNeeded();
    await expect
      .poll(() => picture.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('UIC-AVATAR-4.2 places the corner badge outside the picture, clear of the status', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const cell = (address: string) => matrixCell(page, address, { family: 'avatar-badge' });
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      for (const placement of ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const) {
        const avatar = cell(`placement=${placement} size=${size}`).locator('.ui-avatar');
        const [box, badge] = await Promise.all([
          avatar.boundingBox(),
          avatar.locator('.ui-avatar__badge').boundingBox(),
        ]);
        if (!box || !badge) throw new Error(`no badge at ${placement} ${size}`);
        // The badge stays on its own corner and pokes past the clipped surface.
        const isEnd = placement.endsWith('end');
        const isBottom = placement.startsWith('bottom');
        expect(isEnd ? badge.x + badge.width : badge.x).toBeCloseTo(
          isEnd ? box.x + box.width + 2 : box.x - 2,
          0,
        );
        expect(isBottom ? badge.y + badge.height : badge.y).toBeCloseTo(
          isBottom ? box.y + box.height + 2 : box.y - 2,
          0,
        );
        expect(badge.width).toBeLessThan(box.width);
        await expect(avatar).toHaveAccessibleName('Maria Santos, France');
      }
    }
    // With a status, a badge asked for at the bottom end moves to the top end.
    const away = cell('status=away placement=bottom-end').locator('.ui-avatar');
    await expect(away.locator('.ui-avatar__badge')).toHaveAttribute('data-placement', 'top-end');
    const [dot, flag] = await Promise.all([
      away.locator('.ui-avatar__indicator').boundingBox(),
      away.locator('.ui-avatar__badge').boundingBox(),
    ]);
    expect(requireBox(flag).y + requireBox(flag).height).toBeLessThan(requireBox(dot).y);
    await expect(away).toHaveAccessibleName('Maria Santos, Away, France');
  });

  test('UIC-AVATAR-4.2 keeps the badge out of the tab order and out of the press', async ({
    page,
    lab,
  }) => {
    await lab.open('avatar');
    const trigger = page.locator('[data-lab-avatar="badge-trigger"]');
    const badge = trigger.locator('.ui-avatar__badge');
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(trigger).not.toBeFocused();
    expect(await badge.evaluate((node) => node.contains(document.activeElement))).toBe(false);
    // Tab scrolls the next control into view, which can leave the trigger under the lab chrome.
    await trigger.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    const before = await badge.boundingBox();
    const box = requireBox(await trigger.boundingBox());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(trigger).toHaveAttribute('data-pressed', 'true');
    expect(await badge.boundingBox()).toEqual(before);
    await page.mouse.up();
    await expect(page.locator('[data-lab-output="badge-presses"]')).toHaveText('1');
    await expect(page.getByRole('dialog', { name: 'Lena Ortiz' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).not.toHaveAttribute('data-pressed');
    await lab.expectAccessible();
  });

  test('UIC-AVATAR-2.1 renders unstyled without errors', async ({ page, lab }) => {
    await lab.open('avatar', { stylesheet: 'none' });
    await expect(matrix(page, 'avatar-main').locator('.ui-avatar').first()).toBeVisible();
  });
});

function requireBox<T>(box: T | null): T {
  if (!box) throw new Error('no box');
  return box;
}

test('UIC-AVATAR-1.3 keeps a key-derived colour across renames and follows the palette size and index', async ({
  page,
  lab,
}) => {
  await lab.open('avatar');
  const demo = page.locator('[data-lab-demo="avatar-colours"]');
  const row = (id: string) => demo.locator(`[data-lab-colour="${id}"]`);
  const check = async (id: string) => {
    const slot = await row(id).locator('[data-lab-output="slot"]').innerText();
    await expect(row(id).locator('.ui-avatar')).toHaveAttribute('data-color', slot);
    return slot;
  };
  const keyed = await check('key');
  await check('name');
  await demo.getByRole('textbox', { name: 'Display name' }).fill('Lena Ortiz-Brand');
  expect(await check('key')).toBe(keyed);
  await check('name');
  await demo.getByRole('radio', { name: '4' }).click();
  expect(Number(await check('key'))).toBeLessThan(4);
  await demo.getByRole('radio', { name: '11' }).click();
  expect(await check('index')).toBe('3');
  await demo.getByRole('radio', { name: '12' }).click();
  expect(await check('index')).toBe('11');
  await demo.getByRole('radio', { name: '-1' }).click();
  expect(await check('index')).toBe('11');
  await lab.expectAccessible();
});
