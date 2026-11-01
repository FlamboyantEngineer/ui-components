import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element not rendered');
  return box;
}

/** Opens the drawer of a matrix cell and waits until it has slid in and taken focus. */
async function openCell(page: Page, cell: string, name = 'Filters') {
  const trigger = matrixCell(page, cell).locator(`button`);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeFocused();
  return { trigger, dialog };
}

/** Whether focus is inside `locator`. */
function hasFocusWithin(locator: Locator) {
  return locator.evaluate((node) => node.contains(document.activeElement));
}

test.describe('Drawer lab', () => {
  test('UIC-DRAWER-1.1 UIC-DRAWER-3.1 UIC-DRAWER-2.1 UIC-DRAWER-4.1 moves focus in, keeps it inside and returns it on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const { trigger, dialog } = await openCell(page, 'position=end size=md');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.getByRole('heading', { level: 2, name: 'Filters' })).toBeAttached();
    const overlay = page.locator('.ui-drawer[data-lab-drawer="end-md"]');
    await expect(overlay).toHaveCSS('z-index', '110');
    await expect(overlay).not.toHaveAttribute('data-entering');
    const labRoot = page.locator('#lab-root');
    expect(
      await labRoot.evaluate((node) => node.closest('[aria-hidden="true"], [inert]') !== null),
    ).toBe(true);
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press('Tab');
      expect(await hasFocusWithin(dialog)).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await hasFocusWithin(dialog)).toBe(true);
    await lab.expectAccessible('.ui-drawer');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-DRAWER-1.2 UIC-DRAWER-1.3 UIC-DRAWER-4.1 rests against each edge at its size and closes from its close button', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const cases = [
      ['end', 'md', 'right'],
      ['start', 'sm', 'left'],
      ['top', 'md', 'top'],
      ['bottom', 'lg', 'bottom'],
      ['end', 'lg', 'right'],
    ] as const;
    for (const [position, size, edge] of cases) {
      const { trigger, dialog } = await openCell(page, `position=${position} size=${size}`);
      const panel = page.locator('.ui-drawer__panel');
      await expect(page.locator('.ui-drawer')).toHaveAttribute('data-size', size);
      await expect(panel).toHaveAttribute('data-position', edge);
      const isSide = edge === 'left' || edge === 'right';
      const extent = isSide
        ? { sm: 320, md: 400, lg: 560 }[size]
        : { sm: 0.3, md: 0.5, lg: 0.8 }[size] * viewport.height;
      // The panel may still be sliding into place when it takes focus.
      await expect(async () => {
        const box = await boxOf(panel);
        if (edge === 'right') expect(box.x + box.width).toBeCloseTo(viewport.width, 0);
        if (edge === 'left') expect(box.x).toBeCloseTo(0, 0);
        if (edge === 'top') expect(box.y).toBeCloseTo(0, 0);
        if (edge === 'bottom') expect(box.y + box.height).toBeCloseTo(viewport.height, 0);
        expect(isSide ? box.height : box.width).toBeCloseTo(
          isSide ? viewport.height : viewport.width,
          0,
        );
        expect(isSide ? box.width : box.height).toBeCloseTo(extent, 0);
      }).toPass();
      // The lab's sticky toolbar covers the top of the viewport, so the close button is pressed
      // from the keyboard.
      await dialog.getByRole('button', { name: 'Close' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.ui-drawer')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });

  test('UIC-DRAWER-2.2 UIC-DRAWER-2.3 closes on a backdrop press and on a swipe toward its edge', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const { trigger } = await openCell(page, 'position=end size=md');
    await page.mouse.click(100, viewport.height - 100);
    await expect(page.locator('.ui-drawer')).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await openCell(page, 'position=end size=md');
    const panel = await boxOf(page.locator('.ui-drawer__panel'));
    await expect(page.locator('.ui-drawer')).toHaveAttribute('data-swipe-direction', 'right');
    await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height / 2);
    await page.mouse.wheel(-viewport.width, 0);
    await expect(page.locator('.ui-drawer')).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await openCell(page, 'dismissal=outside presses refused', 'Draft');
    await page.mouse.click(100, viewport.height - 100);
    await expect(page.getByRole('dialog', { name: 'Draft' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-drawer')).toHaveCount(0);
  });

  test('UIC-DRAWER-2.1 UIC-DRAWER-2.4 refuses Escape or every dismissal when asked', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const draft = page.getByRole('dialog', { name: 'Draft' });
    await openCell(page, 'dismissal=Escape refused', 'Draft');
    await page.keyboard.press('Escape');
    await expect(draft).toBeVisible();
    await page.mouse.click(100, viewport.height - 100);
    await expect(draft).toHaveCount(0);

    await openCell(page, 'dismissal=dismissal prevented', 'Draft');
    await expect(draft.getByRole('button', { name: 'Close' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.mouse.click(100, viewport.height - 100);
    await expect(draft).toBeVisible();
    await draft.getByRole('button', { name: 'Send' }).click();
    await expect(draft).toHaveCount(0);
  });

  test('UIC-DRAWER-5.1 opens a bottom drawer at its first snap point and swipes it to the next', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    await openCell(page, 'swipe=snap points', 'Itinerary');
    const panel = page.locator('.ui-drawer__panel');
    await expect(panel).toHaveAttribute('data-position', 'bottom');
    await expect(async () => {
      const box = await boxOf(panel);
      expect(viewport.height - box.y).toBeCloseTo(box.height / 2, -1);
    }).toPass();
    await expect(panel).not.toHaveAttribute('data-expanded');
    // Swiping up moves it to its next snap point, its full height.
    const box = await boxOf(panel);
    await page.mouse.move(box.x + box.width / 2, viewport.height - 40);
    await page.mouse.wheel(0, viewport.height);
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    await expect(async () => {
      const expanded = await boxOf(panel);
      expect(expanded.y + expanded.height).toBeCloseTo(viewport.height, 0);
    }).toPass();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });

  test('UIC-DRAWER-5.2 stacks a nested drawer and closes only the top one', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    await page.getByRole('button', { name: 'Edit the trip' }).click();
    const outer = page.locator('.ui-drawer[data-lab-drawer="outer"]');
    const trip = page.getByRole('dialog', { name: 'Trip to Oslo' });
    await expect(trip).toBeFocused();
    const choose = trip.getByRole('button', { name: 'Choose a hotel' });
    await choose.click();
    const inner = page.locator('.ui-drawer[data-lab-drawer="inner"]');
    await expect(page.getByRole('dialog', { name: 'Hotels' })).toBeFocused();
    await expect(outer).toHaveAttribute('data-stack-index', '0');
    await expect(outer).toHaveAttribute('data-has-descendants', 'true');
    await expect(inner).toHaveAttribute('data-stack-index', '1');
    await lab.expectAccessible('.ui-drawer[data-lab-drawer="inner"]');
    await page.keyboard.press('Escape');
    await expect(inner).toHaveCount(0);
    await expect(outer).toBeVisible();
    await expect(outer).not.toHaveAttribute('data-has-descendants');
    await expect(choose).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(outer).toHaveCount(0);
  });

  test('UIC-DRAWER-1.1 UIC-DRAWER-4.2 opens a controlled drawer whose body closes it, and passes axe in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer', { theme: 'dark' });
    await lab.expectAccessible();
    const output = page.locator('[data-lab-output="controlled"]');
    await page.locator('[data-lab-open="controlled"]').click();
    const cities = page.getByRole('dialog', { name: 'Cities' });
    await expect(cities).toBeFocused();
    await expect(output).toHaveText('open');
    await expect(page.locator('.ui-drawer__panel')).toHaveAttribute('data-position', 'left');
    // The sheet moves its containing overlay in JavaScript after it gives the dialog focus.
    await expect(async () => {
      expect((await boxOf(page.locator('.ui-drawer__panel'))).x).toBe(0);
    }).toPass();
    await lab.expectAccessible('.ui-drawer');
    await cities.getByRole('button', { name: 'Kyoto' }).click();
    await expect(cities).toHaveCount(0);
    await expect(output).toHaveText('closed');
    await expect(page.locator('[data-lab-output="choice"]')).toHaveText('Kyoto');
  });

  test('UIC-DRAWER-1.4 stacks a drawer opened from a modal above the modal', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    await page.getByRole('button', { name: 'Trip settings' }).click();
    await page
      .getByRole('dialog', { name: 'Trip settings' })
      .getByRole('button', { name: 'Pick a city' })
      .click();
    const drawer = page.getByRole('dialog', { name: 'Cities' });
    await expect(drawer).toBeFocused();
    await expect(page.locator('.ui-drawer__panel[data-entering]')).toHaveCount(0);
    const panel = await boxOf(page.locator('.ui-drawer__panel'));
    const dialog = await boxOf(page.locator('.ui-modal__panel'));
    // The drawer makes the dialog inert, which hit testing skips; lift it to compare paint order.
    const hits = await page.evaluate(
      (points) => {
        const inert = [...document.querySelectorAll<HTMLElement>('[inert]')];
        for (const element of inert) element.inert = false;
        const owners = points.map(
          ({ x, y }) =>
            document.elementFromPoint(x, y)?.closest('.ui-drawer, .ui-modal')?.classList[0] ?? '',
        );
        for (const element of inert) element.inert = true;
        return owners;
      },
      [
        { x: panel.x + panel.width / 2, y: panel.y + panel.height / 2 },
        { x: dialog.x + 8, y: dialog.y + 8 },
      ],
    );
    // The drawer's panel, and its backdrop over the dialog's panel.
    expect(hits).toEqual(['ui-drawer', 'ui-drawer']);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Trip settings' })).toBeVisible();
  });

  test('UIC-DRAWER-3.1 focuses an autoFocus field once the panel has slid in', async ({
    page,
    lab,
  }) => {
    await lab.open('drawer');
    await page.getByRole('button', { name: 'Find a city' }).click();
    const field = page
      .getByRole('dialog', { name: 'Find a city' })
      .getByRole('textbox', { name: 'City' });
    await expect(field).toBeFocused();
    // Focused after the entrance: the panel rests fully in view at its edge.
    const panel = await boxOf(page.locator('[data-lab-drawer="autofocus"] .ui-drawer__panel'));
    const viewport = page.viewportSize();
    expect(Math.round(panel.x + panel.width)).toBe(viewport?.width);
    await expect(page.locator('[data-lab-drawer="autofocus"][data-entering]')).toHaveCount(0);
  });

  test('UIC-DRAWER-2.1 stays open on an Escape its content handled', async ({ page, lab }) => {
    await lab.open('drawer');
    await page.getByRole('button', { name: 'Search drawer' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeFocused();
    const draft = dialog.locator('[data-lab-draft]');
    await draft.fill('Oslo');
    await page.keyboard.press('Escape');
    await expect(draft).toHaveValue('');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
