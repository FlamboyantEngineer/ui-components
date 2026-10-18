import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-transition-menu`;

test.describe('Transition Menu lab', () => {
  test('UIC-TRANSITION-MENU-1.1 UIC-TRANSITION-MENU-1.2 UIC-TRANSITION-MENU-1.3 lists the allowed transitions', async ({
    page,
    lab,
  }) => {
    await lab.open('transition-menu');
    const alone = page.locator(cell('state=approved menu=no transitions'));
    await expect(alone).toHaveAttribute('data-readonly', 'true');
    await expect(alone.locator('.ui-transition-menu__badge')).toHaveAttribute(
      'data-tone',
      'success',
    );
    await expect(alone.getByRole('button')).toHaveCount(0);
    const review = page.locator(cell('state=review menu=with transitions'));
    await review.getByRole('button', { name: 'Status, with transitions: In review' }).click();
    const menu = page.getByRole('menu', { name: 'Status, with transitions' });
    const items = menu.getByRole('menuitem');
    await expect(items.locator('.ui-menu-item__label')).toHaveText([
      'Approve',
      'Request changes',
      'Approve and publish',
    ]);
    await expect(items.nth(1)).toHaveAttribute('data-target-tone', 'warning');
    await expect(items.nth(2)).toHaveAttribute('aria-disabled', 'true');
    await expect(items.nth(2)).toContainText('Needs a second reviewer');
    await page.keyboard.press('Escape');
  });

  test('UIC-TRANSITION-MENU-1.4 UIC-TRANSITION-MENU-1.5 moves a document through its workflow', async ({
    page,
    lab,
  }) => {
    await lab.open('transition-menu');
    const demo = page.locator('[data-lab-demo="document"]');
    const root = demo.locator('.ui-transition-menu');
    await demo.getByRole('button', { name: /^Status: Draft/ }).click();
    await page.getByRole('menuitem', { name: /Submit for review/ }).click();
    await expect(root).toHaveAttribute('data-pending', 'true');
    await expect(demo.locator('.ui-transition-menu__badge')).toHaveText('In review');
    await expect(root).not.toHaveAttribute('data-pending');
    await demo.getByRole('button', { name: /^Status: In review/ }).click();
    await page.getByRole('menuitem', { name: /Request changes/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Move to Changes requested' });
    const comment = dialog.getByRole('textbox', { name: /^Comment/ });
    await expect(comment).toBeFocused();
    const action = dialog.getByRole('button', { name: 'Request changes' });
    await expect(action).toBeDisabled();
    await comment.fill('Add the oven temperature');
    await action.click();
    await expect(dialog).toBeHidden();
    await expect(demo.locator('.ui-transition-menu__badge')).toHaveText('Changes requested');
    await expect(demo.locator('[data-lab-output="log"] li')).toHaveText([
      'In review',
      'Changes requested: “Add the oven temperature”',
    ]);
    await demo.getByRole('button', { name: /^Status: Changes requested/ }).click();
    await page.getByRole('menuitem', { name: 'Resubmit' }).click();
    await demo.getByRole('button', { name: /^Status: In review/ }).click();
    await page.getByRole('menuitem', { name: /^Approve$/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Move to Approved' });
    await expect(confirm).toContainText('Approved documents can no longer be edited.');
    await confirm.getByRole('button', { name: 'Approve' }).click();
    await expect(demo.locator('.ui-transition-menu__badge')).toHaveText('Approved');
  });

  test('UIC-TRANSITION-MENU-2.1 opens by keyboard and passes axe', async ({ page, lab }) => {
    await lab.open('transition-menu');
    const demo = page.locator('[data-lab-demo="document"]');
    const trigger = demo.getByRole('button', { name: /^Status: Draft/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /Submit for review/ })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: /Withdrawn/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await lab.expectAccessible();
    await lab.open('transition-menu', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
