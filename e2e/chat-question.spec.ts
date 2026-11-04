import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const database = 'Which database should the notes app use?';
const features = 'Which features should the first version include?';
const appName = 'What should the app be called?';

function demo(page: Page, name: string): Locator {
  return page.locator(`[data-lab-demo="${name}"]`);
}

function cell(page: Page, axes: string): Locator {
  return matrixCell(page, axes).locator(`.ui-chat-question`);
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
    await expect(several.getByRole('tablist', { name: 'Questions' })).toBeVisible();
    await expect(cell(page, 'questions=several status=answered')).toContainText(
      'You chose Search, Export to CSV, and Offline mode',
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

  test('UIC-CHAT-QUESTION-3.1 UIC-CHAT-QUESTION-3.5 UIC-CHAT-QUESTION-3.6 UIC-CHAT-QUESTION-2.4 UIC-CHAT-QUESTION-2.2 answers a stepped card from the keyboard alone', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'interactive');
    await expect(card.locator('.ui-chat-question__progress')).toContainText('Question 1 of 3');
    await card.getByRole('radio', { name: 'PostgreSQL Recommended' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(card.getByRole('radio', { name: 'SQLite' })).toBeChecked();
    await page.keyboard.press('Tab');
    const next = card.getByRole('button', { name: 'Next' });
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.locator('.ui-chat-question__progress')).toContainText('Question 2 of 3');
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
    await expect(card.locator('.ui-chat-question__progress')).toContainText('Question 3 of 3');
    await expect(card.getByRole('tab', { selected: true })).toHaveText('Name');
    await expect(card.locator('.ui-chat-question__tab[data-answered]')).toHaveCount(2);
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

  test('UIC-CHAT-QUESTION-2.1 drops a chosen option the host withdraws from the answer', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'revised');
    await card.getByText('Croutons').click();
    await card.getByText('Fresh herbs').click();
    await page.getByRole('button', { name: 'Withdraw Croutons' }).click();
    await expect(card.getByText('Croutons')).toHaveCount(0);
    await card.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('[data-lab-record="revised"]')).toHaveText(
      '[{"questionId":"toppings","optionIds":["herbs"]}]',
    );
  });

  test('UIC-CHAT-QUESTION-2.7 sends again from a card that is pending again while its earlier request is unsettled', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'reopened');
    const record = page.locator('[data-lab-record="reopened"]');
    const host = card.locator('xpath=..');
    await card.getByRole('textbox', { name: 'What should the app be called?' }).fill('Notebook');
    await card.getByRole('button', { name: 'Submit' }).click();
    await expect(record).toHaveText('Sent 1');
    await host.getByRole('button', { name: 'Withdraw' }).click();
    await host.getByRole('button', { name: 'Reopen' }).click();
    await expect(card).not.toHaveAttribute('data-submitting');
    await card.getByRole('textbox', { name: 'What should the app be called?' }).fill('Journal');
    await card.getByRole('button', { name: 'Submit' }).click();
    await expect(record).toHaveText('Sent 2');
    await expect(card).toHaveAttribute('data-submitting', 'true');
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
    await expect(single.getByRole('tab', { name: 'Servings', selected: true })).toBeVisible();
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

  test('UIC-CHAT-QUESTION-2.7 UIC-CHAT-QUESTION-2.8 keeps every answer when the host refuses them, then accepts a retry', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-question');
    await page.clock.pauseAt(Date.now() + 1000);
    const card = demo(page, 'async');
    const record = page.locator('[data-lab-record="async"]');
    await card.getByText('Other', { exact: true }).click();
    await expect(card.getByRole('textbox', { name: 'Other answer' })).toBeFocused();
    await page.keyboard.type('Redis');
    await card.getByRole('button', { name: 'Next' }).click();
    const name = card.getByRole('textbox', { name: appName });
    await expect(name).toBeFocused();
    await page.keyboard.type('Pocket Notes');
    const submit = card.getByRole('button', { name: /^Submit/ });
    await submit.click();
    await expect(card).toHaveAttribute('data-submitting', 'true');
    await expect(submit).toHaveAttribute('data-pending', 'true');
    await expect(submit).toBeFocused();
    await expect(name).toHaveAttribute('readonly', '');
    await page.keyboard.press('Enter');
    await expect(record).toHaveText('Attempt 1 sent');
    await page.clock.runFor(1200);
    await expect(card.getByRole('alert')).toHaveText(
      'The helper did not receive the answers. Try again.',
    );
    await expect(record).toHaveText('Attempt 1 refused');
    await expect(card).not.toHaveAttribute('data-submitting');
    await expect(submit).toBeFocused();
    await expect(card.locator('.ui-chat-question__progress')).toContainText('Question 2 of 2');
    await expect(name).toHaveValue('Pocket Notes');
    // Axe times itself with timers, so the clock runs again before checking the refused state.
    await page.clock.resume();
    await lab.expectAccessible('[data-lab-section="Asynchronous answers"]');
    await card.getByRole('button', { name: 'Back' }).click();
    await expect(card.getByRole('radio', { name: 'Other' })).toBeChecked();
    await expect(card.getByRole('textbox', { name: 'Other answer' })).toHaveValue('Redis');
    await card.getByRole('button', { name: 'Next' }).click();
    await submit.click();
    await expect(card).toHaveAttribute('data-status', 'answered');
    await expect(record).toHaveText('Attempt 2 accepted');
    await expect(card.getByRole('definition')).toHaveText([
      'You chose Redis',
      'You answered: Pocket Notes',
    ]);
    await expect(card).toBeFocused();
  });

  test('UIC-CHAT-QUESTION-2.9 reads a card without an answer handler, which takes no answer', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'read-only');
    const group = card.getByRole('radiogroup', { name: database });
    await expect(group).toHaveAttribute('aria-readonly', 'true');
    await card.getByText('MySQL', { exact: true }).click();
    await expect(card.getByRole('radio', { name: 'MySQL' })).not.toBeChecked();
    const sqlite = card.getByRole('radio', { name: 'SQLite' });
    await sqlite.focus();
    await page.keyboard.press('Space');
    await expect(sqlite).not.toBeChecked();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Next' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.getByRole('checkbox', { name: 'Sign-in' })).toBeFocused();
    await card.getByRole('button', { name: 'Next' }).click();
    await expect(card.getByRole('textbox', { name: appName })).toHaveAttribute('readonly', '');
    await expect(card.getByRole('button', { name: 'Submit' })).toHaveCount(0);
    await lab.expectAccessible('[data-lab-section="Read-only"]');
  });

  test('UIC-CHAT-QUESTION-3.1 UIC-CHAT-QUESTION-3.2 UIC-CHAT-QUESTION-3.3 UIC-CHAT-QUESTION-3.4 chooses any question by its tab, with the counter and answered marks', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-question');
    const card = demo(page, 'stepped');
    const counter = card.locator('.ui-chat-question__progress');
    await expect(counter.locator('[aria-hidden="true"]')).toHaveText('1/3');
    const tabs = card.getByRole('tablist', { name: 'Questions' });
    const counterBox = await counter.boundingBox();
    const tabsBox = await tabs.boundingBox();
    expect(counterBox && tabsBox && counterBox.x >= tabsBox.x + tabsBox.width - 1).toBe(true);
    await card.getByRole('tab', { name: 'Name' }).click();
    await expect(card.getByRole('tab', { name: 'Name' })).toBeFocused();
    await expect(counter.locator('[aria-hidden="true"]')).toHaveText('3/3');
    await expect(card.getByRole('textbox', { name: appName })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(card.getByRole('tab', { name: 'Features', selected: true })).toBeFocused();
    await card.getByRole('tab', { name: 'Database' }).click();
    await card.getByText('SQLite', { exact: true }).click();
    const answered = card.getByRole('tab', { name: 'Database' });
    await expect(answered).toHaveAttribute('data-answered', 'true');
    await expect(answered.locator('.ui-tabs__icon[data-glyph="check"]')).toBeVisible();

    const styled = demo(page, 'mark-style');
    await styled.getByText('SQLite', { exact: true }).click();
    const styledTab = styled.getByRole('tab', { name: 'Database' });
    await expect(styledTab).toHaveAttribute('data-answered', 'true');
    await expect(styledTab.locator('.ui-tabs__icon')).toHaveCount(0);
    await expect(styledTab).not.toHaveCSS(
      'color',
      await styled
        .getByRole('tab', { name: 'Features' })
        .evaluate((element) => getComputedStyle(element).color),
    );

    const many = demo(page, 'many');
    const forward = many.getByRole('button', { name: 'Scroll forward' });
    await expect(forward).toBeVisible();
    await many.getByRole('tab', { name: 'Destination' }).focus();
    await page.keyboard.press('End');
    await expect(many.getByRole('tab', { name: 'Activities', selected: true })).toBeInViewport();
    await expect(many.locator('.ui-chat-question__progress [aria-hidden="true"]')).toHaveText(
      '7/7',
    );
    await lab.expectAccessible('[data-lab-section="Answered marks"]');
    await lab.expectAccessible('[data-lab-section="Many questions"]');
  });
});
