import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const composer = (page: Page, name: string) => page.locator(`[data-lab-composer="${name}"]`);

test.describe('Message Composer controls', () => {
  test('UIC-MESSAGE-COMPOSER-6.4 UIC-MESSAGE-COMPOSER-7.1 UIC-MESSAGE-COMPOSER-8.1 UIC-CHAT-MODEL-PICKER-1.5 shows labels in a wide row and icons alone in a narrow one', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await lab.open('message-composer');
    const wide = composer(page, 'controls-wide');
    await expect(wide).not.toHaveAttribute('data-compact');
    await expect(wide.getByRole('button', { name: 'Approval: Ask first' })).toHaveText('Ask first');
    await expect(wide.getByRole('button', { name: 'Plan' })).toHaveText('Plan');
    await expect(wide.locator('.ui-chat-model-picker')).toContainText('Balanced');

    const narrow = composer(page, 'controls-narrow');
    await expect(narrow).toHaveAttribute('data-compact', 'true');
    const select = narrow.getByRole('button', { name: 'Approval: Ask first' });
    await expect(select).toHaveAttribute('data-content', 'icon');
    await expect(select.locator('svg[data-glyph="hand-raised"]')).toBeVisible();
    await expect(narrow.getByRole('button', { name: 'Plan' })).toHaveAttribute(
      'data-content',
      'icon',
    );
    const picker = narrow.locator('.ui-chat-model-picker');
    await expect(picker).toHaveAttribute('data-compact', 'true');
    await expect(picker.locator('svg[data-glyph="sparkles"]')).toBeVisible();
    // Every control stays inside the narrow composer.
    const frame = await narrow.boundingBox();
    for (const button of await narrow.locator('.ui-message-composer__footer button').all()) {
      const box = await button.boundingBox();
      expect(box && frame && box.x + box.width <= frame.x + frame.width + 1).toBe(true);
    }
    // React Aria opens hover tooltips only once the pointer has moved onto the page.
    await page.mouse.move(0, 0);
    await narrow.getByRole('button', { name: 'Plan' }).hover();
    await expect(page.getByRole('tooltip')).toHaveText('Plan');

    // The wide row turns compact as it narrows, and back once its labels fit again.
    const row = page.locator('[data-lab-row="wide"]');
    await row.evaluate((element) => {
      (element as HTMLElement).style.width = '300px';
    });
    await expect(wide).toHaveAttribute('data-compact', 'true');
    await row.evaluate((element) => {
      (element as HTMLElement).style.width = '900px';
    });
    await expect(wide).not.toHaveAttribute('data-compact');
    await lab.expectAccessible('[data-lab-row="narrow"]');
  });

  test('UIC-MESSAGE-COMPOSER-7.2 UIC-MESSAGE-COMPOSER-8.1 chooses an approval mode and the plan, then sends with them', async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await lab.open('message-composer');
    const wide = composer(page, 'controls-wide');
    const select = wide.getByRole('button', { name: 'Approval: Ask first' });
    await wide.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    await select.click();
    const menu = page.getByRole('menu', { name: 'Approval: Ask first' });
    const popover = page.locator('.ui-menu-popover').filter({ has: menu });
    await expect(popover).not.toHaveAttribute('data-entering');
    await expect(menu.getByRole('menuitemradio')).toHaveCount(4);
    await expect(menu.getByRole('menuitemradio', { name: /^Read only/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await lab.expectAccessible('.ui-message-composer__select-menu');
    await menu.getByRole('menuitemradio', { name: /^Accept edits/ }).click();
    await expect(menu).toHaveCount(0);
    await expect(wide.getByRole('button', { name: 'Approval: Accept edits' })).toBeFocused();
    const plan = wide.getByRole('button', { name: 'Plan' });
    await plan.click();
    await expect(plan).toHaveAttribute('aria-pressed', 'true');
    // The controls are shared, so every row shows the choice.
    await expect(
      composer(page, 'controls-narrow').getByRole('button', { name: 'Plan' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await wide.getByRole('textbox').fill('Tidy the notes');
    await wide.getByRole('textbox').press('Enter');
    await expect(page.locator('[data-lab-output="controls-sent"]')).toHaveText(
      'Tidy the notes (edits, plan on, Balanced, medium effort)',
    );
  });

  test('UIC-MESSAGE-COMPOSER-6.3 UIC-MESSAGE-COMPOSER-6.5 sends from a send button the host put first', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const target = composer(page, 'leading-send');
    const start = target.locator('.ui-message-composer__start');
    await expect(start.locator(':scope > *').first()).toHaveClass(/ui-message-composer__action/);
    await expect(target.getByRole('button', { name: 'Send' })).toHaveCount(1);
    await expect(target.getByRole('button', { name: '3 files in context' })).toBeVisible();
    await target.getByRole('textbox').fill('See the notes');
    await target.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-lab-output="leading-send-sent"]')).toHaveText('See the notes');
  });
});
