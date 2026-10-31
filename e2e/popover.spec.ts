import type { Locator } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element not rendered');
  return box;
}

/** Whether `panel` sits wholly on `side` of `anchor`. */
function isOnSide(panel: Box, anchor: Box, side: string): boolean {
  switch (side) {
    case 'top':
      return panel.y + panel.height <= anchor.y;
    case 'bottom':
      return panel.y >= anchor.y + anchor.height;
    case 'left':
      return panel.x + panel.width <= anchor.x;
    default:
      return panel.x >= anchor.x + anchor.width;
  }
}

const sides = [
  ['top', 'top'],
  ['bottom', 'bottom'],
  ['start', 'left'],
  ['end', 'right'],
] as const;

test.describe('Popover lab', () => {
  test('UIC-POPOVER-1.1 UIC-POPOVER-1.3 UIC-POPOVER-1.4 UIC-POPOVER-1.5 UIC-POPOVER-3.1 opens on each side with its arrow', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    for (const [placement, side] of sides) {
      const trigger = matrixCell(page, `placement=${placement} arrow=arrow`).locator(`button`);
      await trigger.click();
      const panel = page.locator(`.ui-popover[data-lab-popover="${placement}-arrow"]`);
      const dialog = panel.getByRole('dialog', { name: 'Filters' });
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(panel).toHaveAttribute('data-placement', side);
      await expect(panel).toHaveAttribute('data-trigger', 'DialogTrigger');
      await expect(panel).toHaveCSS('z-index', '130');
      const arrow = panel.locator('.ui-popover__arrow');
      await expect(arrow).toHaveAttribute('data-placement', side);
      const [panelBox, triggerBox, arrowBox] = await Promise.all([
        boxOf(panel),
        boxOf(trigger),
        boxOf(arrow),
      ]);
      expect(isOnSide(panelBox, triggerBox, side)).toBe(true);
      // The arrow sits in the gap between the panel and the trigger, pointing at it.
      expect(isOnSide(arrowBox, triggerBox, side)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    const plain = matrixCell(page, 'placement=bottom arrow=no arrow').locator('button');
    await plain.click();
    await expect(page.locator('.ui-popover')).toBeVisible();
    await expect(page.locator('.ui-popover__arrow')).toHaveCount(0);
    await lab.expectAccessible('.ui-popover');
  });

  test('UIC-POPOVER-2.1 UIC-POPOVER-2.2 UIC-POPOVER-3.2 keeps focus inside and closes on outside presses and the close button', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    const trigger = matrixCell(page, 'placement=bottom arrow=arrow').locator('button');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeFocused();
    const close = dialog.getByRole('button', { name: 'Close' });
    const radius = dialog.getByRole('textbox', { name: 'Radius' });
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(radius).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(radius).toBeFocused();
    await close.click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(1000, 600);
    await expect(dialog).toHaveCount(0);

    const refusedEscape = matrixCell(page, 'dismissal=Escape refused').locator('button');
    await refusedEscape.click();
    const draft = page.getByRole('dialog', { name: 'Draft' });
    await expect(draft).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(draft).toBeVisible();
    await page.mouse.click(1000, 600);
    await expect(draft).toHaveCount(0);

    await matrixCell(page, 'dismissal=outside presses refused').locator('button').click();
    await expect(draft).toBeVisible();
    await page.mouse.click(1000, 600);
    await expect(draft).toBeVisible();
    await draft.getByRole('button', { name: 'Close' }).click();
    await expect(draft).toHaveCount(0);
  });

  test('UIC-POPOVER-3.1 UIC-POPOVER-1.3 names a popover without a title and applies position options', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    await matrixCell(page, 'parts=body only').locator('button').click();
    const hours = page.getByRole('dialog', { name: 'Opening hours' });
    await expect(hours).toBeVisible();
    await expect(page.locator('.ui-popover__header')).toHaveCount(0);
    await page.keyboard.press('Escape');

    const offsetTrigger = matrixCell(page, 'option=offset 16').locator('button');
    await offsetTrigger.click();
    const panel = page.locator('.ui-popover[data-lab-popover="offset 16"]');
    await expect(panel).toBeVisible();
    const [panelBox, triggerBox] = await Promise.all([boxOf(panel), boxOf(offsetTrigger)]);
    // React Aria places the panel on whole pixels.
    expect(Math.abs(panelBox.y - (triggerBox.y + triggerBox.height) - 16)).toBeLessThan(1);
    await page.keyboard.press('Escape');

    const noFlip = matrixCell(page, 'option=no flip').locator('button');
    await noFlip.click();
    await expect(page.locator('.ui-popover[data-lab-popover="no flip"]')).toHaveAttribute(
      'data-placement',
      'top',
    );
  });

  test('UIC-POPOVER-1.2 places a popover against a custom anchor and a controlled one against a summary', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    const open = page.locator('[data-lab-open="anchored"]');
    await open.click();
    const anchored = page.locator('.ui-popover[data-lab-popover="anchored"]');
    await expect(anchored).toBeVisible();
    const [panelBox, anchorBox] = await Promise.all([
      boxOf(anchored),
      boxOf(page.locator('[data-lab-anchor]')),
    ]);
    expect(isOnSide(panelBox, anchorBox, 'bottom')).toBe(true);
    expect(panelBox.x).toBeCloseTo(anchorBox.x, 0);
    await page.keyboard.press('Escape');
    await expect(anchored).toHaveCount(0);
    await expect(open).toBeFocused();

    const output = page.locator('[data-lab-output="controlled"]');
    await page.locator('[data-lab-open="controlled"]').click();
    const dates = page.getByRole('dialog', { name: 'Dates' });
    await expect(dates).toBeVisible();
    await expect(output).toHaveText('open');
    const [datesBox, summaryBox] = await Promise.all([
      boxOf(dates),
      boxOf(page.locator('[data-lab-summary]')),
    ]);
    expect(isOnSide(datesBox, summaryBox, 'bottom')).toBe(true);
    await dates.getByRole('button', { name: 'Close' }).click();
    await expect(dates).toHaveCount(0);
    await expect(output).toHaveText('closed');
    await page.locator('[data-lab-open="controlled"]').click();
    await dates.getByRole('button', { name: 'Shift by a day' }).click();
    await expect(dates).toHaveCount(0);
    await expect(page.locator('[data-lab-output="applied"]')).toHaveText('13 to 17 October');
  });

  test('UIC-POPOVER-2.3 hides the page behind a popover but not behind a non-modal one', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    const pageContent = page.locator('[data-lab-page]');
    const hidden = () =>
      pageContent.evaluate((node) => node.closest('[aria-hidden="true"], [inert]') !== null);
    await matrixCell(page, 'placement=bottom arrow=arrow').locator('button').click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    expect(await hidden()).toBe(true);
    await page.keyboard.press('Escape');

    const notesTrigger = page.getByRole('button', { name: 'Show notes' });
    // A non-modal popover closes when the page scrolls, so bring its trigger into view first.
    await notesTrigger.scrollIntoViewIfNeeded();
    await notesTrigger.click();
    const notes = page.getByRole('dialog', { name: 'Notes' });
    await expect(notes).toBeVisible();
    expect(await hidden()).toBe(false);
    await expect(page.locator('.ui-popover[data-lab-popover="notes"]')).toHaveAttribute(
      'data-placement',
      'right',
    );
    await lab.expectAccessible('.ui-popover');
    await page.locator('[data-lab-counter]').click();
    await expect(page.locator('[data-lab-output="visits"]')).toHaveText('1');
    await expect(notes).toHaveCount(0);
  });

  test('UIC-POPOVER-1.1 passes axe with an open popover in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('popover', { theme: 'dark' });
    await matrixCell(page, 'placement=end arrow=arrow').locator('button').click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    await lab.expectAccessible('.ui-popover');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });

  test('UIC-POPOVER-2.1 stays open on an Escape its content handled', async ({ page, lab }) => {
    await lab.open('popover');
    await page.getByRole('button', { name: 'Add label' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add label' });
    const draft = dialog.locator('[data-lab-draft]');
    await draft.fill('Urgent');
    await page.keyboard.press('Escape');
    await expect(draft).toHaveValue('');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});

for (const mode of ['no arrow', 'arrow']) {
  test(`UIC-POPOVER-6.1 keeps ${mode} gaps consistent with reserved scrollbar space`, async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
    for (const [placement, side] of sides) {
      const trigger = matrixCell(page, `placement=${placement} arrow=${mode}`).locator(`button`);
      await trigger.click();
      const panel = page.locator(`.ui-popover[data-lab-popover="${placement}-${mode}"]`);
      await expect(panel).toHaveAttribute('data-placement', side);
      await expect(panel).not.toHaveAttribute('data-entering');
      await expect(async () => {
        const [box, anchor] = await Promise.all([boxOf(panel), boxOf(trigger)]);
        const gap =
          side === 'left'
            ? anchor.x - box.x - box.width
            : side === 'right'
              ? box.x - anchor.x - anchor.width
              : side === 'top'
                ? anchor.y - box.y - box.height
                : box.y - anchor.y - anchor.height;
        expect(Math.abs(gap - (mode === 'arrow' ? 7 : 8))).toBeLessThanOrEqual(1.1);
      }).toPass();
      if (placement === 'start') {
        await page.setViewportSize({ width: 1380, height: 800 });
        await expect(async () => {
          const [box, anchor] = await Promise.all([boxOf(panel), boxOf(trigger)]);
          expect(
            Math.abs(anchor.x - box.x - box.width - (mode === 'arrow' ? 7 : 8)),
          ).toBeLessThanOrEqual(1.1);
        }).toPass();
      }
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
    }
  });
}
