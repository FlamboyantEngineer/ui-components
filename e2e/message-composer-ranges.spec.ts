import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const ranges = (page: Page) => page.locator('[data-lab-ranges]');
const rangeBox = (page: Page) => ranges(page).getByRole('textbox', { name: 'Message with ranges' });
const output = (page: Page, name: string) => ranges(page).locator(`[data-lab-output="${name}"]`);
const triggerArea = (page: Page) => page.locator('[data-lab-triggers]');
const undo = (page: Page) =>
  page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');

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

test.describe('Message Composer selection, ranges and triggers', () => {
  test('UIC-MESSAGE-COMPOSER-4.11 selects and replaces ranges by text offsets as one undo step each', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(rangeBox(page)).toHaveAttribute('id', 'lab-range-input');
    await ranges(page).getByRole('button', { name: 'Select “plan”' }).click();
    await expect(output(page, 'selection')).toHaveText('Selection: 27–31');
    // The selection stays while the host's button has focus, and its replacement goes in its place.
    await ranges(page)
      .getByRole('button', { name: 'Replace the selection with a reference' })
      .click();
    await expect(output(page, 'result')).toHaveText('Insert reference: applied');
    await expect(rangeBox(page)).toBeFocused();
    await expect(output(page, 'draft')).toContainText('Ask @Ana Lopez about the **DOC-BRIEF**');
    await expect(output(page, 'draft')).toContainText('reference brief 27–36');
    // Typing goes on right after the inserted reference.
    await page.keyboard.type('!');
    await expect(output(page, 'draft')).toContainText('**DOC-BRIEF!**');
    await undo(page);
    await undo(page);
    await expect(output(page, 'draft')).toContainText('about the **plan**');
    // A range across the mention and the line break goes as one step, the mention whole.
    await ranges(page).getByRole('button', { name: 'Replace 6–38' }).click();
    await expect(output(page, 'draft')).toContainText('Ask @Jon Berg to share it,');
    await expect(output(page, 'draft')).not.toContainText('Ana Lopez');
    await expect(rangeBox(page).locator('p')).toHaveCount(2);
    await expect(output(page, 'selection')).toHaveText('Selection: 30–30');
    await undo(page);
    await expect(output(page, 'draft')).toContainText('Ask @Ana Lopez about the **plan**');
    await lab.expectAccessible('[data-lab-ranges]');
  });

  test('UIC-MESSAGE-COMPOSER-4.12 turns a pasted link into a reference once the host answers, unless the draft changed owner', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await rangeBox(page).locator('p').last().click();
    await page.keyboard.press('End');
    await page.keyboard.type(' see ');
    await pasteText(page, 'https://example.test/doc/plan');
    await expect(output(page, 'draft')).toContainText('room see https://example.test/doc/plan');
    await page.keyboard.type(' soon');
    const chip = rangeBox(page).locator('.ui-message-composer__pill[data-kind="reference"]');
    await expect(chip).toHaveCount(1);
    await expect(output(page, 'draft')).toContainText('see DOC-PLAN soon');
    // Undo brings the pasted text back.
    await undo(page);
    await expect(output(page, 'draft')).toContainText('see https://example.test/doc/plan soon');
    // A paste whose draft is switched away before the answer never reaches the other draft.
    await pasteText(page, 'https://example.test/doc/later');
    await ranges(page).getByRole('button', { name: 'Switch to another draft' }).click();
    await page.waitForTimeout(800);
    await expect(rangeBox(page)).not.toContainText('DOC-LATER');
    await expect(
      rangeBox(page).locator('.ui-message-composer__pill[data-kind="reference"]'),
    ).toHaveCount(0);
  });

  test('UIC-MESSAGE-COMPOSER-4.13 inserts host tool and file tokens with raw text, loading only for the current query', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const box = triggerArea(page).getByRole('textbox');
    await box.click();
    await page.keyboard.type('Use $ti');
    const tools = page.getByRole('listbox', { name: 'Tools' });
    await expect(tools.getByRole('option')).toHaveText(['Tidy Clean up a draft']);
    await expect(box).toHaveAttribute(
      'aria-activedescendant',
      (await tools.getByRole('option').first().getAttribute('id')) ?? '',
    );
    await page.keyboard.press('Enter');
    const tool = box.locator('.ui-message-composer__pill[data-kind="trigger"]');
    await expect(tool).toHaveText('Tidy');
    await expect(tool).toHaveAttribute('data-trigger', 'tools');
    await expect(tool.locator('.ui-message-composer__pill-icon')).toBeVisible();
    // A slow source shows loading for the current query, then its answer only.
    await page.keyboard.type('on #pl');
    await expect(page.locator('.ui-completion-list__empty')).toHaveText('Loading');
    const files = page.getByRole('listbox', { name: 'Files' });
    await expect(files.getByRole('option')).toHaveText([
      'garden.md plans/garden.md',
      'kitchen.md plans/kitchen.md',
    ]);
    // Pressing an option keeps the caret: typing goes on after the token.
    await files.getByRole('option', { name: /kitchen/ }).click();
    await expect(box).toBeFocused();
    await page.keyboard.type('please');
    await page.keyboard.press('Enter');
    await expect(triggerArea(page).locator('[data-lab-output="sent"]')).toContainText(
      'Use $tidy on #plans/kitchen.md please',
    );
    await expect(triggerArea(page).locator('[data-lab-output="sent"]')).toContainText(
      'trigger tool-tidy 4–9, trigger plans/kitchen.md 13–30',
    );
    await page.keyboard.type('#fail');
    await expect(page.locator('.ui-completion-list__empty')).toHaveText(
      'The action could not be completed.',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-completion-list__empty')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-triggers]');
  });
});
