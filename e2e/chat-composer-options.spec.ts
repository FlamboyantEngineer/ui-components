import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);
const output = (page: Page, name: string) =>
  demo(page, 'composer-hooks').locator(`[data-lab-output="${name}"]`);

/** Pastes text into the focused text box, as the clipboard does. */
async function pasteText(page: Page, text: string) {
  await page.evaluate((value) => {
    const data = new DataTransfer();
    data.setData('text/plain', value);
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    // Firefox drops a constructed event's clipboard data, so the event carries it as a property.
    Object.defineProperty(event, 'clipboardData', { value: data });
    document.activeElement?.dispatchEvent(event);
  }, text);
}

test.describe('Chat lab: host hooks', () => {
  test('UIC-CHAT-3.12 focuses the composer by id, checks pastes, reads the selection and opens a host trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const hooks = demo(page, 'composer-hooks');
    const box = hooks.locator('#lab-chat-composer');
    await hooks.getByRole('button', { name: 'Write a message' }).click();
    await expect(box).toBeFocused();
    await page.keyboard.type('Stay in ');
    await expect(output(page, 'selection')).toHaveText('8–8');
    await pasteText(page, '1234 5678 9012 3456');
    await expect(output(page, 'pasted')).toHaveText('refused a card number');
    await expect(box).toHaveText('Stay in ');
    await pasteText(page, 'https://example.test/trip/porto');
    await expect(output(page, 'pasted')).toHaveText('replaced a link with Trip: porto');
    await expect(box.locator('.ui-message-composer__pill')).toHaveText('Trip: porto');
    await page.keyboard.type(' near %bon');
    const places = page.getByRole('listbox', { name: 'Neighbourhoods' });
    await expect(places.getByRole('option')).toHaveText(['Bonfim']);
    await page.keyboard.press('Enter');
    await expect(box.locator('.ui-message-composer__pill[data-kind="trigger"]')).toHaveText(
      'Bonfim',
    );
    await page.keyboard.press('Enter');
    await expect(hooks.getByRole('article').last()).toContainText('Bonfim');
    await lab.expectAccessible('[data-lab-demo="composer-hooks"]');
  });

  test('UIC-CHAT-2.1 draws the host’s icons in the message menu', async ({ page, lab }) => {
    await lab.open('chat');
    const reply = demo(page, 'menu-icons').getByRole('article').last();
    await reply.scrollIntoViewIfNeeded();
    await reply.getByText('Ribeira is close to the river').click({ button: 'right' });
    const menu = page.getByRole('menu');
    const icon = (role: 'menuitem' | 'menuitemcheckbox', name: string) =>
      menu.getByRole(role, { name }).locator('.ui-menu-item__icon');
    await expect(icon('menuitem', 'Copy')).toHaveCount(0);
    await expect(
      icon('menuitemcheckbox', 'Good response').locator('[data-glyph="star"]'),
    ).toHaveCount(1);
    await expect(
      icon('menuitemcheckbox', 'Bad response').locator('[data-glyph="thumbs-down"]'),
    ).toHaveCount(1);
    await menu.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(demo(page, 'menu-icons').locator('[data-lab-output="copied"]')).toHaveText(
      'options-answer',
    );
  });

  test('UIC-CHAT-1.5 marks answered question tabs with a check or the style alone', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    for (const mark of ['icon', 'style']) {
      const card = matrixCell(page, `mark=${mark}`).locator('.ui-chat-question');
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveAttribute('data-answered-mark', mark);
      await card.getByRole('radio', { name: /Bonfim/ }).focus();
      await page.keyboard.press('Space');
      const tab = card.getByRole('tab', { name: /Area/ });
      await expect(tab).toHaveAttribute('data-answered', 'true');
      await expect(tab.locator('.ui-tabs__icon')).toHaveCount(mark === 'icon' ? 1 : 0);
    }
  });
});
