import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const passage = (page: Page) => page.locator('[data-lab-passage]');
const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Selection actions' });

// Selects the words of the passage's paragraph from the start of one word to the end of another.
async function selectWords(page: Page, first: string, last: string) {
  await passage(page).evaluate(
    (element, [from, to]) => {
      const text = element.querySelector('p')?.firstChild;
      if (!text?.textContent) return;
      const range = document.createRange();
      const start = text.textContent.indexOf(from ?? '');
      const end = text.textContent.indexOf(to ?? '') + (to ?? '').length;
      range.setStart(text, start);
      range.setEnd(text, end);
      (element as HTMLElement).focus();
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    },
    [first, last],
  );
}

test.describe('Floating Toolbar lab', () => {
  test('UIC-FLOATING-TOOLBAR-1.1 floats over the selection and leaves focus in the page', async ({
    page,
    lab,
  }) => {
    await lab.open('floating-toolbar');
    await expect(toolbar(page)).toHaveCount(0);
    await selectWords(page, 'Select', 'words');
    await expect(toolbar(page)).toBeVisible();
    await expect(passage(page)).toBeFocused();
    const box = await toolbar(page).boundingBox();
    const text = await passage(page).locator('p').boundingBox();
    expect(box && text && box.y + box.height).toBeLessThanOrEqual((text?.y ?? 0) + 1);
    await selectWords(page, 'toolbar', 'selection');
    await expect(toolbar(page)).toBeVisible();
    const moved = await toolbar(page).boundingBox();
    expect(moved?.x).not.toBe(box?.x);
  });

  test('UIC-FLOATING-TOOLBAR-1.2 takes focus on request and hides on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('floating-toolbar');
    await selectWords(page, 'Select', 'words');
    await page.keyboard.press('Alt+F10');
    await expect(toolbar(page).getByRole('button', { name: 'Count' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(toolbar(page).getByRole('button', { name: 'Shout' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('output[data-lab-output="action"]')).toHaveText(
      'upper SELECT A FEW WORDS',
    );
    await page.keyboard.press('Escape');
    await expect(toolbar(page)).toHaveCount(0);
    await expect(passage(page)).toBeFocused();
  });
});
