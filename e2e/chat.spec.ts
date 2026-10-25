import type { Locator, Page } from '@playwright/test';
import { expect, formatLabUrl, test, waitForLab } from './fixtures.js';

const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
const composer = (scope: Locator) => scope.getByRole('textbox', { name: 'Message' });
const message = (scope: Locator, id: string) => scope.locator(`article[id="${id}"]`);
const lastReply = (scope: Locator) => scope.locator('article').last();

/** Opens the Chat lab with the fake agent pausing `pause` milliseconds between chunks. */
async function openChat(page: Page, pause?: number) {
  const url = formatLabUrl('chat');
  await page.goto(pause ? `${url}&pause=${pause}` : url);
  await waitForLab(page);
}

/** Picks what the lab's agent does with the next message, then sends `text`. */
async function ask(page: Page, behaviour: string, text: string) {
  const assistant = section(page, 'Assistant, live');
  await assistant.locator('label', { hasText: behaviour }).click();
  await expect(assistant.getByRole('radio', { name: behaviour })).toBeChecked();
  await composer(assistant).click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
  return assistant;
}

test.describe('Chat lab', () => {
  test('UIC-CHAT-1.2 UIC-CHAT-6.1 passes axe in every section', async ({ page, lab }) => {
    test.slow();
    await lab.open('chat');
    const titles = await page
      .locator('[data-lab-section]')
      .evaluateAll((sections) => sections.map((entry) => entry.getAttribute('data-lab-section')));
    for (const title of titles) await lab.expectAccessible(`[data-lab-section="${title}"]`);
  });

  test('UIC-CHAT-1.7 follows the keyboard model from the composer to a message and back', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const pair = section(page, 'Between two people');
    await composer(pair).click();
    await page.keyboard.press('Shift+Tab');
    await expect(message(pair, 'pair-4')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(message(pair, 'pair-3')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(message(pair, 'pair-1')).toBeFocused();
    await page.keyboard.press('End');
    await expect(message(pair, 'pair-4')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(message(pair, 'pair-4').getByRole('button', { name: 'Retry' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(message(pair, 'pair-4')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(composer(pair)).toBeFocused();
  });

  test('UIC-CHAT-4.2 UIC-CHAT-3.4 streams a reply with its status, queues a follow-up and stops', async ({
    page,
  }) => {
    await openChat(page);
    const assistant = await ask(page, 'Answer with tools and sources', 'Plan a weekend in Lisbon');
    await expect(assistant.locator('.ui-chat__status')).toHaveText(/…$/);
    await expect(assistant.locator('.ui-chat-header__status')).toHaveText(/…$/);
    await page.keyboard.type('And the budget?');
    await page.keyboard.press('Enter');
    const queue = assistant.getByRole('list', { name: '1 queued message' });
    await expect(queue).toContainText('And the budget?');
    await expect(assistant.getByText('Two days in Lisbon')).toBeVisible();
    await assistant.getByRole('button', { name: 'Stop' }).click();
    const reply = assistant.locator('article[data-status="cancelled"]');
    await expect(reply.locator('.ui-chat-message__stopped')).toHaveText('Stopped');
    await expect(reply).toContainText('Two days in Lisbon');
    await expect(assistant.locator('.ui-chat__status')).toHaveCount(0);
    await assistant.getByRole('button', { name: 'Remove queued message 1' }).click();
    await expect(assistant.locator('.ui-chat__queue')).toHaveCount(0);
    await expect(composer(assistant)).toBeFocused();
  });

  test('UIC-CHAT-1.5 streams steps, a cited answer and its sources to the end', async ({
    page,
  }) => {
    await openChat(page, 8);
    const assistant = await ask(page, 'Answer with tools and sources', 'Plan a weekend');
    const reply = assistant.locator('article[data-status="complete"]').last();
    await expect(reply.getByRole('button', { name: /^Worked for/ })).toBeVisible();
    await expect(
      reply.getByRole('link', { name: 'Source 1: Lisbon weather in spring' }),
    ).toBeVisible();
    await expect(reply.getByRole('table')).toBeVisible();
    await expect(reply.locator('.ui-code-block')).toBeVisible();
    await rateAndCopy(page, reply);
  });

  test('UIC-CHAT-1.4 approves a booking awaited in the stream by keyboard', async ({
    page,
    lab,
  }) => {
    await openChat(page, 8);
    const assistant = await ask(page, 'Approval, awaited', 'Book dinner');
    const approve = assistant.getByRole('button', { name: 'Approve' });
    await expect(approve).toBeVisible();
    const reply = assistant.locator('article').last();
    await expect(reply).not.toHaveAttribute('aria-busy');
    await page.keyboard.press('Shift+Tab');
    await expect(reply).toBeFocused();
    await page.keyboard.press('Enter');
    while (!(await approve.evaluate((button) => button === document.activeElement))) {
      await page.keyboard.press('Tab');
    }
    await lab.expectAccessible('[data-lab-section="Assistant, live"]');
    await page.keyboard.press('Enter');
    await expect(reply).toContainText('Booked: Casa do Rio, Saturday at 20:00.');
    await expect(reply.locator('.ui-chat-tool-call__decision')).toHaveText('Approved');
  });

  test('UIC-CHAT-1.5 denies a next-turn approval with a reason, and always allows', async ({
    page,
  }) => {
    await openChat(page, 8);
    const assistant = await ask(page, 'Approval, next turn', 'Tidy my bookings');
    await assistant.getByRole('button', { name: 'Deny' }).click();
    await page.keyboard.type('I still need it');
    await page.keyboard.press('Enter');
    await expect(lastReply(assistant)).toContainText('I kept the old booking.');
    await expect(lastReply(assistant).locator('.ui-chat-tool-call__decision')).toHaveText(
      'Denied: I still need it',
    );
    await ask(page, 'Approval, awaited', 'Book dinner');
    await assistant.getByRole('button', { name: 'Always allow in this trip' }).click();
    await expect(lastReply(assistant)).toContainText('Booked: Casa do Rio, Saturday at 20:00.');
    await expect(page.locator('[data-lab-output="allowed"]')).toHaveText('book_table');
  });

  test('UIC-CHAT-1.5 answers a card of questions with previews', async ({ page }) => {
    await openChat(page, 8);
    const assistant = await ask(page, 'Questions with previews', 'Help me plan');
    const card = assistant.locator('.ui-chat-question');
    await card.getByText('Packed', { exact: true }).click();
    await expect(card.getByRole('radio', { name: /^Packed/ })).toBeChecked();
    await expect(card.locator('.ui-chat-question__preview')).toContainText('Fado at 21');
    await card.getByRole('button', { name: 'Next' }).click();
    await card.getByText('Seafood', { exact: true }).click();
    await expect(card.getByRole('checkbox', { name: /^Seafood/ })).toBeChecked();
    await card.getByRole('button', { name: 'Next' }).click();
    await card.getByRole('textbox').fill('One of us is vegetarian');
    await card.getByRole('button', { name: 'Submit' }).click();
    await expect(lastReply(assistant)).toContainText(
      'Noted: packed, seafood, One of us is vegetarian.',
    );
    await expect(card).toHaveAttribute('data-status', 'answered');
  });

  test('UIC-CHAT-1.4 retries a reply that failed, and runs a plan with a diff and a terminal block', async ({
    page,
  }) => {
    await openChat(page, 8);
    const assistant = await ask(page, 'Fails once', 'Ferry times?');
    await expect(assistant.getByRole('alert')).toHaveText(
      'The timetable service is busy. Try again.',
    );
    await assistant.getByRole('button', { name: 'Retry' }).click();
    await expect(lastReply(assistant)).toContainText('ferries cross every 20 minutes');
    await ask(page, 'Plan, diff and terminal', 'Save the plan');
    await expect(assistant.getByText('4 of 4 done')).toBeVisible();
    await expect(assistant.locator('.ui-text-diff')).toBeVisible();
    await expect(assistant.locator('.ui-code-block[data-variant="terminal"]')).toBeVisible();
    await expect(assistant.locator('[data-lab-custom="weather-card"]')).toContainText('Lisbon');
  });

  test('UIC-CHAT-3.3 UIC-CHAT-3.5 recalls a prompt with Up and uploads a file that fails once', async ({
    page,
  }) => {
    await openChat(page);
    const assistant = section(page, 'Assistant, live');
    await composer(assistant).click();
    await page.keyboard.press('ArrowUp');
    await expect(composer(assistant)).toHaveText('Which day is best for the castle?');
    const chooser = page.waitForEvent('filechooser');
    await assistant.getByRole('button', { name: 'Attach files' }).click();
    const file = { name: 'broken-map.png', mimeType: 'image/png', buffer: Buffer.from('png') };
    await (await chooser).setFiles(file);
    const files = assistant.getByRole('list', { name: 'Attachments' });
    await expect(files.getByRole('alert')).toContainText('did not arrive');
    await files.getByRole('button', { name: 'Retry' }).click();
    await expect(files.locator('.ui-chat-attachment[data-status="complete"]')).toBeVisible();
  });

  test('UIC-CHAT-2.4 UIC-CHAT-2.5 replies with a quote and edits it between two people', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const pair = section(page, 'Between two people');
    await message(pair, 'pair-3').hover();
    await message(pair, 'pair-3').getByRole('button', { name: 'Reply' }).click();
    await expect(pair.locator('.ui-chat__banner')).toContainText('Replying to');
    await expect(composer(pair)).toBeFocused();
    await lab.expectAccessible('[data-lab-section="Between two people"]');
    await page.keyboard.type('Great, thanks!');
    await page.keyboard.press('Enter');
    const reply = pair.locator('article', { hasText: 'Great, thanks!' });
    await expect(reply.getByRole('button', { name: /^Quote from Ana Lopez/ })).toBeVisible();
    await expect(reply).toHaveAttribute('data-delivery', 'read', { timeout: 15_000 });
    await expect(lastReply(pair)).toContainText('Sounds good!');
    await composer(pair).click();
    await page.keyboard.press('ArrowUp');
    await expect(pair.locator('.ui-chat__banner')).toHaveText('Editing your message');
    await page.keyboard.type(' See you!');
    await page.keyboard.press('Enter');
    await expect(reply).toContainText('Great, thanks! See you!');
    await expect(reply.locator('.ui-chat-message__edited')).toHaveText('Edited');
  });

  test('UIC-CHAT-3.1 keeps the draft of a conversation across a reload', async ({ page, lab }) => {
    await lab.open('chat');
    const pair = section(page, 'Between two people');
    await composer(pair).click();
    await page.keyboard.type('Half a thought');
    await page.reload();
    await waitForLab(page);
    await expect(composer(section(page, 'Between two people'))).toHaveText('Half a thought');
  });

  test('UIC-CHAT-1.6 UIC-CHAT-5.1 lays out days, unread and receipts, and loads older history', async ({
    page,
  }) => {
    await openChat(page);
    const team = section(page, 'Group conversation');
    await expect(team.getByRole('heading', { name: 'Hiking group' })).toBeVisible();
    await expect(team.locator('.ui-chat-unread-divider')).toHaveText('New messages');
    await expect(team.locator('.ui-chat-transcript__unread')).toContainText('6 unread');
    await expect(team.getByRole('group', { name: 'Seen by Ana Lopez and Mia Chen' })).toBeVisible();
    await team.getByRole('button', { name: 'Jump' }).click();
    await expect(message(team, 'team-9')).toBeFocused();
    await message(team, 'team-10')
      .getByRole('button', { name: /^Quote from Mia Chen/ })
      .click();
    await expect(message(team, 'team-4')).toHaveAttribute('data-highlighted', 'true');
    await page.keyboard.press('Home');
    await expect(message(team, 'team-older-3')).toBeAttached({ timeout: 5_000 });
    await expect(team.locator('.ui-chat-date-separator').first()).toContainText('April 17');
  });

  test('UIC-CHAT-5.3 finds a message the virtualized history has not mounted', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const long = section(page, 'Very long history');
    await expect(message(long, 'long-41')).toHaveCount(0);
    await long.getByRole('button', { name: 'Search this conversation' }).click();
    const box = long.getByRole('searchbox', { name: 'Search this conversation' });
    await expect(box).toBeFocused();
    await page.keyboard.type('lighthouse');
    await expect(long.locator('.ui-find-bar__status')).toHaveText('1 of 1');
    await expect(message(long, 'long-41')).toHaveAttribute('data-highlighted', 'true');
    await expect(message(long, 'long-41')).toBeInViewport();
    await expect(message(long, 'long-41').locator('mark')).toHaveText('lighthouse');
    await expect(box).toBeFocused();
    await lab.expectAccessible('[data-lab-section="Very long history"]');
    await page.keyboard.press('Escape');
    await expect(message(long, 'long-41')).toBeFocused();
  });

  test('UIC-CHAT-5.2 UIC-CHAT-5.3 shows the header, switches conversations and searches one', async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const chrome = section(page, 'Header, search and conversation list');
    await chrome.getByRole('row', { name: /^Ana Lopez/ }).click();
    await expect(chrome.getByRole('heading', { name: 'Ana Lopez' })).toBeVisible();
    await expect(chrome.getByRole('img', { name: 'Ana Lopez, Active' }).last()).toBeVisible();
    await chrome.getByRole('button', { name: 'Search this conversation' }).click();
    await page.keyboard.type('boat');
    await expect(chrome.locator('mark')).toHaveText('boat');
    await chrome.getByRole('button', { name: 'Close' }).click();
    await chrome.getByRole('row', { name: /^Weekend team/ }).click();
    await chrome
      .locator('.ui-chat-header')
      .getByRole('button', { name: /Ana Lopez/ })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Away');
  });

  test('UIC-CHAT-1.2 opens in a drawer and from a floating launcher', async ({ page, lab }) => {
    await lab.open('chat');
    const surfaces = section(page, 'Surfaces');
    await surfaces.getByRole('button', { name: 'Open the trip planner' }).first().click();
    const drawer = page.getByRole('dialog', { name: 'Trip planner' });
    await expect(drawer.getByText('Ask about trains, weather or where to eat.')).toBeVisible();
    await expect(page.locator('[data-lab-surface="drawer"]')).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('[data-lab-surface="drawer"]');
    await page.keyboard.press('Escape');
    await surfaces.locator('[data-lab-demo="launcher"]').getByRole('button').click();
    const popover = page.getByRole('dialog', { name: 'Trip planner' });
    await expect(popover.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await lab.expectAccessible('[data-lab-surface="popover"]');
  });
});

/** Rates a finished reply with a reason and copies it, checking what the host receives. */
async function rateAndCopy(page: Page, reply: Locator) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  });
  await reply.hover();
  await reply.getByRole('button', { name: 'Bad response' }).click();
  await page.getByRole('button', { name: 'Too long' }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('[data-lab-output="assistant-log"]')).toContainText(
    'rated down Too long',
  );
  await reply.hover();
  await reply.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.locator('[data-lab-output="assistant-log"]')).toContainText('copied');
}
