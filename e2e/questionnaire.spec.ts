import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const stepping = (page: Page) => page.getByRole('form', { name: 'stepping questionnaire' });

/** Picks an option from the keyboard, as its visually hidden input takes no pointer. */
async function choose(page: Page, name: string) {
  await stepping(page).getByRole('radio', { name }).focus();
  await page.keyboard.press('Space');
}

test('UIC-QUESTIONNAIRE-1.1 shows every question with bordered options', async ({ page, lab }) => {
  await lab.open('questionnaire');
  const form = page.getByRole('form', { name: 'all at once questionnaire' });
  await expect(form.getByRole('radiogroup', { name: 'Which crossing suits you?' })).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'A note for the crew' })).toBeVisible();
  const option = form.locator('.ui-questionnaire__choice').first();
  expect(await option.evaluate((choice) => getComputedStyle(choice).borderTopWidth)).toBe('1px');
  await lab.expectAccessible();
});

test('UIC-QUESTIONNAIRE-1.2 steps through the questions with its progress', async ({
  page,
  lab,
}) => {
  await lab.open('questionnaire');
  const form = stepping(page);
  await expect(form.getByRole('progressbar')).toHaveText('Question 1 of 3');
  await choose(page, 'Ferry');
  await form.getByRole('button', { name: 'Next' }).click();
  await expect(form.getByRole('progressbar')).toHaveText('Question 2 of 3');
  await expect(form.getByRole('checkbox', { name: 'A bike' })).toBeFocused();
  await expect(form.getByRole('radio', { name: 'Ferry' })).toBeHidden();
  await lab.expectAccessible();
});

test('UIC-QUESTIONNAIRE-1.3 UIC-QUESTIONNAIRE-2.1 UIC-QUESTIONNAIRE-2.3 answers, skips and submits', async ({
  page,
  lab,
}) => {
  await lab.open('questionnaire');
  const form = stepping(page);
  await choose(page, 'Bridge');
  await form.getByRole('button', { name: 'Next' }).click();
  await form.getByRole('button', { name: 'Skip' }).click();
  const note = form.getByRole('textbox', { name: 'A note for the crew' });
  await expect(note).toBeFocused();
  await note.fill('A window seat');
  await note.press('Enter');
  await expect(page.getByRole('status', { name: 'stepping questionnaire answers' })).toHaveText(
    '{"crossing":["bridge"],"extras":[],"note":["A window seat"]}',
  );
});

test('UIC-QUESTIONNAIRE-2.2 stops at a required question and says why', async ({ page, lab }) => {
  await lab.open('questionnaire');
  const form = stepping(page);
  await form.getByRole('button', { name: 'Next' }).click();
  const question = form.getByRole('group', { name: 'Which crossing suits you?' });
  await expect(question).toHaveAttribute('data-invalid', 'true');
  const error = form.locator('.ui-questionnaire__error');
  await expect(error).toHaveText('Answer this question to continue.');
  const danger = await error.evaluate((text) => getComputedStyle(text).color);
  const plain = await form
    .locator('.ui-questionnaire__description')
    .first()
    .evaluate((text) => getComputedStyle(text).color);
  expect(danger).not.toBe(plain);
  await lab.expectAccessible();
});
