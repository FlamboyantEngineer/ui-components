import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

/**
 * Scrolling closes an open hint, so bring a trigger into view and let the scroll events settle
 * before opening its hint.
 */
async function bringIntoView(page: Page, trigger: Locator) {
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/** Hover opens a hint only for pointer input, which React Aria learns from earlier pointer moves. */
async function usePointer(page: Page) {
  await page.mouse.move(2, 2);
  await page.mouse.move(4, 4);
}

test.describe('Tooltip lab', () => {
  test('UIC-TOOLTIP-1.1 UIC-TOOLTIP-1.2 opens after the hover delay and at once on keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const trigger = matrixCell(page, 'placement=bottom').getByRole('button');
    const hint = page.getByRole('tooltip', { name: 'Placed bottom' });
    await bringIntoView(page, trigger);
    await usePointer(page);
    // Scrolling closed the open hints; let React Aria's warm-up window after a close expire.
    await page.waitForTimeout(1000);
    const box = await trigger.boundingBox();
    if (!box) throw new Error('trigger has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // The exact delay is covered by the unit tests; here the hint must not appear at once.
    expect(await hint.count()).toBe(0);
    await expect(hint).toBeVisible();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      (await hint.getAttribute('id')) ?? '',
    );
    await page.mouse.move(0, 0);
    await expect(hint).toHaveCount(0);

    const focusOnly = matrixCell(page, 'option=focus only').getByRole('button');
    await matrixCell(page, 'option=long delay').getByRole('button').focus();
    await page.keyboard.press('Tab');
    await expect(focusOnly).toBeFocused();
    await expect(page.getByRole('tooltip', { name: 'Hint with focus only' })).toBeVisible();
  });

  test('UIC-TOOLTIP-1.3 closes on Escape and keeps focus on the trigger', async ({ page, lab }) => {
    await lab.open('tooltip');
    const trigger = matrixCell(page, 'placement=top').getByRole('button');
    await bringIntoView(page, trigger);
    await matrixCell(page, 'variant=info state=open').getByRole('button').focus();
    await page.keyboard.press('Tab');
    await expect(trigger).toBeFocused();
    const hint = page.getByRole('tooltip', { name: 'Placed top' });
    await expect(hint).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(hint).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-TOOLTIP-1.5 places the hint on the requested side', async ({ page, lab }) => {
    await lab.open('tooltip');
    for (const placement of ['top', 'bottom', 'end'] as const) {
      const trigger = matrixCell(page, `placement=${placement}`).getByRole('button');
      await bringIntoView(page, trigger);
      await trigger.focus();
      const hint = page.getByRole('tooltip', { name: `Placed ${placement}` });
      await expect(hint).toBeVisible();
      const triggerBox = await trigger.boundingBox();
      const hintBox = await hint.boundingBox();
      if (!triggerBox || !hintBox) throw new Error('missing boxes');
      if (placement === 'top') {
        expect(hintBox.y + hintBox.height).toBeLessThanOrEqual(triggerBox.y);
      }
      if (placement === 'bottom') {
        expect(Math.round(hintBox.y - (triggerBox.y + triggerBox.height))).toBe(8);
      }
      if (placement === 'end') {
        expect(hintBox.x).toBeGreaterThanOrEqual(triggerBox.x + triggerBox.width);
        await expect(hint).toHaveAttribute('data-placement', 'right');
      }
      await expect(hint.locator('.ui-tooltip__arrow')).toHaveAttribute(
        'data-placement',
        placement === 'end' ? 'right' : placement,
      );
      await trigger.blur();
    }
  });

  test('UIC-TOOLTIP-1.6 draws both variants', async ({ page, lab }) => {
    await lab.open('tooltip');
    await expect(page.getByRole('tooltip', { name: 'Save changes' })).toHaveAttribute(
      'data-variant',
      'default',
    );
    const info = page.getByRole('tooltip', { name: 'Totals refresh every hour.' });
    await expect(info).toHaveAttribute('data-variant', 'info');
    const [defaultBackground, infoBackground] = await Promise.all([
      page
        .getByRole('tooltip', { name: 'Save changes' })
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      info.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);
    expect(defaultBackground).not.toBe(infoBackground);
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-1.6 UIC-BUTTON-11.5 explains pending and focusable disabled buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const disabled = matrixCell(page, 'control=button state=focusable disabled').getByRole(
      'button',
    );
    await bringIntoView(page, disabled);
    await disabled.focus();
    await expect(page.getByRole('tooltip', { name: 'Only owners can publish' })).toBeVisible();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await disabled.blur();

    const pending = matrixCell(page, 'control=icon button state=pending').getByRole('button');
    await usePointer(page);
    await pending.hover();
    await expect(page.getByRole('tooltip', { name: 'Undo the last edit' })).toBeVisible();
    await expect(pending).toHaveAttribute('aria-label', 'Undo');
  });

  test('UIC-TOOLTIP-1.9 names icon-only triggers by their hint', async ({ page, lab }) => {
    await lab.open('tooltip');
    const undo = matrixCell(page, 'label=Undo').getByRole('button');
    const hint = page.getByRole('tooltip').filter({ hasText: /^Undo$/ });
    await expect(undo).toHaveAccessibleName('Undo');
    await expect(hint).toHaveCount(0);
    // Arrive by keyboard, so the trigger is focus-visible and shows its hint.
    await undo.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(undo).toBeFocused();
    await expect(hint).toBeVisible();
    await expect(undo).toHaveAccessibleName('Undo');
    await expect(undo).toHaveAccessibleDescription('');
    await lab.expectAccessible();
    await page.keyboard.press('Escape');
    await expect(hint).toHaveCount(0);
    await expect(undo).toHaveAccessibleName('Undo');
  });
});

test.describe('Anchored tooltip lab', () => {
  test('UIC-TOOLTIP-2.1 UIC-TOOLTIP-2.3 shows a hint the page opens on an element it owns', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const demo = page.locator('[data-lab-demo="anchored-element"]');
    const chip = demo.getByRole('status', { name: 'Build status' });
    await demo.getByRole('button', { name: 'Show the hint' }).click();
    const hint = page.getByRole('tooltip', { name: 'All 48 checks passed' });
    await expect(hint).toBeVisible();
    await expect(chip).toHaveAccessibleDescription('All 48 checks passed');
    await expect(async () => {
      const chipBox = await chip.boundingBox();
      const hintBox = await hint.boundingBox();
      expect(hintBox?.y).toBeGreaterThan((chipBox?.y ?? 0) + (chipBox?.height ?? 0));
    }).toPass();
    // The arrow stays out of the panel's flow, so the panel is as tall as its one line of text.
    const [hintBox, contentBox] = await Promise.all([
      hint.boundingBox(),
      hint.locator('.ui-tooltip__content').boundingBox(),
    ]);
    expect((hintBox?.height ?? 0) - (contentBox?.height ?? 0)).toBeLessThan(12);
    await lab.expectAccessible('[data-lab-demo="anchored-element"]');
    await demo.getByRole('button', { name: 'Hide the hint' }).click();
    await expect(hint).toHaveCount(0);
    await expect(chip).not.toHaveAttribute('aria-describedby');
  });

  test('UIC-TOOLTIP-2.1 opens hints on the bars of an SVG chart', async ({ page, lab }) => {
    await lab.open('tooltip');
    const demo = page.locator('[data-lab-demo="anchored-svg"]');
    const bar = demo.getByRole('img', { name: 'Tue' });
    await bar.hover();
    const hint = page.getByRole('tooltip', { name: '30 visits' });
    await expect(hint).toBeVisible();
    await expect(bar).toHaveAccessibleDescription('30 visits');
    await page.mouse.move(0, 0);
    await expect(hint).toHaveCount(0);
  });

  test('UIC-TOOLTIP-2.2 UIC-TOOLTIP-2.4 follows a rectangle as its box scrolls', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const demo = page.locator('[data-lab-demo="anchored-region"]');
    const open = demo.getByRole('button', { name: 'Show the region hint' });
    await open.scrollIntoViewIfNeeded();
    await open.click();
    const hint = page.getByRole('tooltip', { name: 'Meeting room' });
    await expect(hint).toBeVisible();
    const before = await hint.boundingBox();
    await demo.locator('[data-lab-region]').evaluate((box) => {
      box.scrollTop = 40;
    });
    await expect(async () => {
      const after = await hint.boundingBox();
      expect((before?.y ?? 0) - (after?.y ?? 0)).toBeCloseTo(40, 0);
    }).toPass();
    await expect(hint).toBeVisible();
  });

  test('UIC-TOOLTIP-2.3 repeats an icon button name without describing it again', async ({
    page,
    lab,
  }) => {
    await lab.open('tooltip');
    const button = page
      .locator('[data-lab-demo="anchored-visual"]')
      .getByRole('button', { name: 'Add a row' });
    await button.hover();
    await expect(page.locator('.ui-tooltip[aria-hidden="true"]')).toHaveText('Add a row');
    await expect(button).toHaveAccessibleDescription('');
    await expect(button).toHaveAccessibleName('Add a row');
  });
});
