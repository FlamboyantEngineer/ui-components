import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const database = 'Which database should the notes app use?';
const features = 'Which features should the first version include?';
const appName = 'What should the app be called?';

function demo(page: Page, name: string): Locator {
  return page.locator(`[data-lab-demo="${name}"]`);
}

function cell(page: Page, axes: string): Locator {
  return page.locator(`[data-lab-cell="${axes}"] .ui-chat-question`);
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The element has no layout box.');
  return box;
}

test.describe('Chat Question lab', () => {
  test('UIC-CHAT-QUESTION-1.1 UIC-CHAT-QUESTION-4.1 UIC-CHAT-QUESTION-4.2 passes axe in every status', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    for (const questions of ['one', 'several']) {
      const pending = cell(page, `questions=${questions} status=pending`);
      await expect(pending).toHaveAttribute('data-status', 'pending');
      await expect(pending.getByRole('button', { name: 'Dismiss' })).toBeVisible();
      await expect(cell(page, `questions=${questions} status=dismissed`)).toContainText(
        'Dismissed',
      );
    }
    const several = page.getByRole('group', { name: `3 questions: ${database}` }).first();
    await expect(several.getByRole('list', { name: 'Questions' })).toBeVisible();
    await expect(cell(page, 'questions=several status=answered')).toContainText(
      'You chose Search, Export to CSV and Offline mode',
    );
    await expect(cell(page, 'questions=one status=answered')).toContainText('You chose PostgreSQL');
    await expect(cell(page, 'questions=several status=answered')).toContainText(
      'You answered: Pocket Notes',
    );
    await lab.expectAccessible('[data-lab-section="Statuses"]');
    await lab.expectAccessible('[data-lab-section="Selection modes"]');
    await lab.expectAccessible('[data-lab-section="Several questions"]');
  });

  test('UIC-CHAT-QUESTION-1.6 UIC-CHAT-QUESTION-1.7 UIC-CHAT-QUESTION-2.5 passes axe with Other, previews and a message shown', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const servings = demo(page, 'other-single');
    await expect(servings.getByRole('radio', { name: 'Four Recommended' })).not.toBeChecked();
    await servings.getByText('Other', { exact: true }).click();
    await expect(servings.getByRole('textbox', { name: 'Other answer' })).toBeFocused();
    await demo(page, 'preview-markdown').getByRole('radio', { name: 'One list' }).focus();
    await demo(page, 'preview-code').getByText('SQLite', { exact: true }).click();
    const name = cell(page, 'selectionMode=none').getByRole('textbox');
    await name.focus();
    await name.press('Enter');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(cell(page, 'selectionMode=none').locator('.ui-field__message')).toHaveText(
      'A value is required.',
    );
    await lab.expectAccessible('[data-lab-section="Recommended option and Other"]');
    await lab.expectAccessible('[data-lab-section="Previews"]');
    await lab.expectAccessible('[data-lab-section="Selection modes"]');
  });

  test('UIC-CHAT-QUESTION-3.1 UIC-CHAT-QUESTION-3.2 UIC-CHAT-QUESTION-3.3 UIC-CHAT-QUESTION-2.4 UIC-CHAT-QUESTION-2.2 answers a stepped card from the keyboard alone', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'interactive');
    await expect(card.locator('.ui-chat-question__progress')).toHaveText('Question 1 of 3');
    await card.getByRole('radio', { name: 'PostgreSQL Recommended' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(card.getByRole('radio', { name: 'SQLite' })).toBeChecked();
    await page.keyboard.press('Tab');
    const next = card.getByRole('button', { name: 'Next' });
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.locator('.ui-chat-question__progress')).toHaveText('Question 2 of 3');
    await expect(card.getByRole('checkbox', { name: 'Sign-in' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(card.getByRole('checkbox', { name: 'Search Recommended' })).toBeChecked();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    const other = card.getByRole('textbox', { name: 'Other answer' });
    await expect(other).toBeFocused();
    await page.keyboard.type('Offline mode');
    await page.keyboard.press('Enter');
    await expect(card.locator('.ui-chat-question__progress')).toHaveText('Question 3 of 3');
    await expect(card.locator('[aria-current="step"]')).toHaveText('Name');
    await expect(card.locator('.ui-chat-question__step[data-answered]')).toHaveCount(2);
    const name = card.getByRole('textbox', { name: appName });
    await expect(name).toBeFocused();
    await page.keyboard.type('Pocket Notes');
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('data-status', 'answered');
    await expect(card).toBeFocused();
    await expect(page.locator('[data-lab-output="interactive"]')).toContainText('"sqlite"');
    await expect(page.locator('[data-lab-output="interactive"]')).toContainText(
      '"otherText": "Offline mode"',
    );
    await expect(card.getByRole('definition')).toHaveText([
      'You chose SQLite',
      'You chose Search and Offline mode',
      'You answered: Pocket Notes',
    ]);
    await lab.expectAccessible('[data-lab-section="Interactive"]');
  });

  test('UIC-CHAT-QUESTION-2.3 UIC-CHAT-QUESTION-4.2 dismisses the interactive card and asks again', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'interactive');
    await card.getByRole('button', { name: 'Dismiss' }).click();
    await expect(card).toHaveAttribute('data-status', 'dismissed');
    await expect(card.locator('.ui-chat-question__status')).toHaveText('Dismissed');
    await expect(card).toBeFocused();
    await page.getByRole('button', { name: 'Ask again' }).click();
    await expect(card).toHaveAttribute('data-status', 'pending');
    await expect(card.getByRole('radio', { checked: true })).toHaveCount(0);
  });

  test('UIC-CHAT-QUESTION-1.7 UIC-CHAT-QUESTION-1.4 takes the reader’s own words through Other', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const servings = demo(page, 'other-single');
    await servings.getByRole('radio', { name: 'Two' }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const other = servings.getByRole('radio', { name: 'Other' });
    await expect(other).toBeChecked();
    await expect(other).toBeFocused();
    await page.keyboard.press('Tab');
    const words = servings.getByRole('textbox', { name: 'Other answer' });
    await expect(words).toBeFocused();
    await page.keyboard.type('Eight');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-record="other-single"]')).toHaveText(
      '[{"questionId":"servings","optionIds":[],"otherText":"Eight"}]',
    );
    const toppings = demo(page, 'other-multiple');
    await toppings.getByText('Croutons').click();
    await toppings.getByText('Other', { exact: true }).click();
    const more = toppings.getByRole('textbox', { name: 'Other answer' });
    await expect(more).toBeFocused();
    await page.keyboard.type('Chili oil');
    await toppings.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('[data-lab-record="other-multiple"]')).toHaveText(
      '[{"questionId":"toppings","optionIds":["croutons"],"otherText":"Chili oil"}]',
    );
  });

  test('UIC-CHAT-QUESTION-1.8 shows the preview of the focused option beside the options', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'preview-code');
    await expect(card.locator('.ui-chat-question__preview')).toHaveCount(0);
    await card.getByRole('radio', { name: 'PostgreSQL Recommended' }).focus();
    const postgres = card.getByRole('group', { name: 'Preview of PostgreSQL' });
    await expect(postgres.locator('.ui-markdown__code-block')).toContainText('body text NOT NULL');
    const optionsBox = await boxOf(card.locator('.ui-chat-question__options'));
    const previewBox = await boxOf(postgres);
    expect(previewBox.x).toBeGreaterThan(optionsBox.x + optionsBox.width - 1);
    await page.keyboard.press('ArrowDown');
    await expect(card.getByRole('group', { name: 'Preview of SQLite' })).toContainText(
      'INTEGER PRIMARY KEY',
    );
    await page.keyboard.press('ArrowDown');
    await expect(card.locator('.ui-chat-question__preview')).toHaveCount(0);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Submit' })).toBeFocused();
    await expect(card.getByRole('group', { name: 'Preview of SQLite' })).toBeVisible();
    const layout = demo(page, 'preview-markdown');
    await layout.getByRole('radio', { name: 'Two columns Recommended' }).focus();
    const columns = layout.getByRole('group', { name: 'Preview of Two columns' });
    await expect(columns.locator('strong')).toHaveText('Two columns');
    await expect(columns.getByRole('table')).toBeVisible();
  });

  test('UIC-CHAT-QUESTION-1.3 UIC-CHAT-QUESTION-1.5 UIC-CHAT-QUESTION-1.2 draws each selection mode', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const single = cell(page, 'selectionMode=single');
    await expect(single.locator('.ui-chat-question__header')).toHaveText('Servings');
    await expect(single.getByRole('radiogroup')).toBeVisible();
    await expect(cell(page, 'selectionMode=multiple').getByRole('checkbox')).toHaveCount(3);
    const text = cell(page, 'selectionMode=none').getByRole('textbox');
    await expect(text).toHaveAttribute('placeholder', 'Type your answer');
    await expect(
      cell(page, 'selectionMode=none').locator('.ui-chat-question__item'),
    ).toHaveAttribute('data-selection-mode', 'none');
    const submit = single.getByRole('button', { name: 'Submit' });
    await expect(submit).toHaveAttribute('aria-disabled', 'true');
    await single.getByText('Six').click();
    await expect(submit).not.toHaveAttribute('aria-disabled');
    const stepped = demo(page, 'stepped');
    await expect(stepped.getByRole('radiogroup', { name: database })).toBeVisible();
    await expect(stepped.getByRole('group', { name: features })).toHaveCount(0);
  });
});
