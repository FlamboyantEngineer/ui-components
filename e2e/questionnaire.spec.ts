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

test('UIC-QUESTIONNAIRE-2.2 UIC-QUESTIONNAIRE-2.3 advances and submits with a disabled required question', async ({
  page,
  lab,
}) => {
  await lab.open('questionnaire');
  const label = 'Questionnaire with an unavailable question';
  const form = page.getByRole('form', { name: label });
  await expect(form.getByRole('radio', { name: 'Ferry' })).toBeDisabled();
  await form.getByRole('button', { name: 'Next' }).click();
  await expect(form.getByRole('progressbar')).toHaveText('Question 2 of 3');
  await expect(form.getByRole('checkbox', { name: 'A bike' })).toBeFocused();
  await form.getByRole('button', { name: 'Next' }).click();
  const note = form.getByRole('textbox', { name: 'A note for the crew' });
  await note.fill('A window seat');
  await note.press('Enter');
  await expect(page.getByRole('status', { name: `${label} answers` })).toHaveText(
    '{"crossing":[],"extras":[],"note":["A window seat"]}',
  );
});

test('UIC-QUESTIONNAIRE-2.2 follows the disabled state of an enclosing fieldset', async ({
  page,
  lab,
}) => {
  await lab.open('questionnaire');
  const form = page.getByRole('form', { name: 'Survey in an enclosing fieldset' });
  const question = form.getByRole('group', { name: 'Which crossing suits you?' });
  const radio = question.getByRole('radio', { name: 'Ferry' });
  const toggle = page.getByRole('checkbox', { name: 'Disable the survey fieldset' });
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(question).toHaveAttribute('data-invalid', 'true');
  await expect(radio).toBeFocused();

  await toggle.check();
  await expect(radio).toBeDisabled();
  await expect(question).not.toHaveAttribute('data-invalid');
  await expect(question.getByText('Answer this question to continue.')).toHaveCount(0);

  await toggle.uncheck();
  await expect(radio).toBeEnabled();
  await expect(question).toHaveAttribute('data-invalid', 'true');
  await expect(toggle).toBeFocused();
});
