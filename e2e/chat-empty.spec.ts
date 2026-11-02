import type { Locator, Page } from '@playwright/test';
import { expect, formatLabUrl, matrixCell, test, waitForLab } from './fixtures.js';

const section = (page: Page) => page.locator('[data-lab-section="Starting a conversation"]');
const welcome = (scope: Locator) => scope.getByRole('heading', { name: 'Plan your next trip' });
const starters = (scope: Locator) => scope.locator('[data-lab-starters] button');

async function openCell(page: Page, suggestions: 'several' | 'none') {
  await page.goto(formatLabUrl('chat'));
  await waitForLab(page);
  return matrixCell(section(page), `suggestions=${suggestions}`);
}

/** Waits for the one sent question and its finished answer, and no other message. */
async function expectOneTurn(scope: Locator, question: string) {
  await expect(scope.locator('article')).toHaveCount(2, { timeout: 15_000 });
  await expect(scope.locator('article').first()).toHaveText(new RegExp(question));
  await expect(scope.getByText(question, { exact: true })).toHaveCount(1);
  await expect(welcome(scope)).toHaveCount(0);
}

test.describe('Chat empty conversation', () => {
  test('UIC-CHAT-1.7 welcomes an empty conversation with suggestions that send themselves once', async ({
    page,
  }) => {
    const scope = await openCell(page, 'several');
    await expect(welcome(scope)).toBeVisible();
    await expect(scope.getByText('Ask about places to see')).toBeVisible();
    await expect(starters(scope)).toHaveText([
      'Plan a weekend in Lisbon',
      'Which day is best for the castle?',
      'What should I pack for May?',
    ]);
    await expect(scope.locator('article')).toHaveCount(0);
    await scope.getByRole('button', { name: 'Plan a weekend in Lisbon' }).click();
    await expectOneTurn(scope, 'Plan a weekend in Lisbon');
    // A new conversation brings the welcome back, with nothing kept in its history.
    await scope.getByRole('button', { name: 'New conversation' }).click();
    await expect(welcome(scope)).toBeVisible();
    await expect(scope.locator('article')).toHaveCount(0);
  });

  test('UIC-CHAT-1.7 sends a suggestion picked by keyboard', async ({ page }) => {
    const scope = await openCell(page, 'several');
    const second = scope.getByRole('button', { name: 'Which day is best for the castle?' });
    await scope.getByRole('button', { name: 'Plan a weekend in Lisbon' }).focus();
    await page.keyboard.press('Tab');
    await expect(second).toBeFocused();
    await page.keyboard.press('Enter');
    await expectOneTurn(scope, 'Which day is best for the castle?');
  });

  test('UIC-CHAT-1.7 keeps the welcome useful with no suggestions, until the first message', async ({
    page,
  }) => {
    const scope = await openCell(page, 'none');
    await expect(welcome(scope)).toBeVisible();
    await expect(starters(scope)).toHaveCount(0);
    await scope.getByRole('textbox', { name: 'Message' }).click();
    await page.keyboard.type('Ferry times?');
    await page.keyboard.press('Enter');
    await expectOneTurn(scope, 'Ferry times?');
  });

  test('UIC-CHAT-1.7 wraps the welcome in a narrow panel', async ({ page }) => {
    const scope = await openCell(page, 'several');
    await scope.locator('.ui-chat').evaluate((root) => {
      (root.parentElement as HTMLElement).style.width = '240px';
    });
    const empty = scope.locator('.ui-chat-transcript__empty');
    await expect(welcome(scope)).toBeVisible();
    const overflow = await scope
      .locator('.ui-chat')
      .evaluate((root) =>
        [root, ...root.querySelectorAll<HTMLElement>('.ui-empty-state, [data-lab-starters]')].some(
          (element) => element.scrollWidth > element.clientWidth + 1,
        ),
      );
    expect(overflow).toBe(false);
    // Every suggestion stays whole and within the panel.
    const panel = await empty.boundingBox();
    if (!panel) throw new Error('The empty state has no box.');
    for (const button of await starters(scope).all()) {
      const box = await button.boundingBox();
      if (!box) throw new Error('A suggestion has no box.');
      expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width + 1);
    }
  });
});
