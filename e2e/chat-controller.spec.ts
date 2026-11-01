import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="controller"]');
const transcript = (page: Page) => page.getByRole('feed', { name: 'Conversation with the helper' });
const lastMessage = (page: Page) => transcript(page).getByRole('article').last();

/** Picks the agent's behaviour from the keyboard, clear of the sticky lab toolbar. */
async function choose(page: Page, behaviour: string) {
  const radio = demo(page).getByRole('radio', { name: behaviour });
  await radio.focus();
  await page.keyboard.press('Space');
  await expect(radio).toBeChecked();
}

async function sendMessage(page: Page, text: string) {
  const input = demo(page).getByRole('textbox', { name: 'Message the helper' });
  await input.fill(text);
  await input.press('Enter');
}

test.describe('Chat Controller lab', () => {
  test('UIC-CHAT-CONTROLLER-5.1 renders the conversation, the log and the reducer matrix accessibly', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await expect(transcript(page).getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('list', { name: 'Sent prompts' })).toContainText(
      'What can you cook with beans?',
    );
    await expect(matrixCell(page, 'ending=error events=end')).toContainText(
      'The recipe service is busy.',
    );
    await expect(matrixCell(page, 'ending=finish events=end')).toContainText(
      'Black bean chili takes an hour.',
    );
    await lab.expectAccessible();
  });

  test('UIC-CHAT-CONTROLLER-2.3 stops a streaming reply and keeps its text', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await sendMessage(page, 'How do I cook black beans?');
    const reply = lastMessage(page);
    await expect(reply).toContainText('Soak the black beans');
    await demo(page).getByRole('button', { name: 'Stop' }).click();
    await expect(reply).toHaveAttribute('data-status', 'cancelled');
    await expect(reply).toContainText('Stopped');
    await expect(reply).not.toContainText('once the beans are tender.');
    await expect(page.getByRole('region', { name: 'Event log' })).toContainText('text-delta');
    await lab.expectAccessible();
  });

  test('UIC-CHAT-CONTROLLER-2.4 shows a failed reply and retries it', async ({ page, lab }) => {
    await lab.open('chat-controller');
    await choose(page, 'Fails once');
    await sendMessage(page, 'What is in the pantry?');
    const reply = lastMessage(page);
    await expect(reply.getByRole('alert')).toHaveText('The pantry service is busy. Try again.');
    await expect(reply).toHaveAttribute('data-status', 'error');
    await lab.expectAccessible();
    await reply.getByRole('button', { name: 'Retry' }).click();
    await expect(lastMessage(page)).toContainText('you have rice, lentils and two onions.');
    await expect(lastMessage(page)).toHaveAttribute('data-status', 'complete');
    await expect(transcript(page).getByRole('article')).toHaveCount(4);
  });

  test('UIC-CHAT-CONTROLLER-3.1 UIC-CHAT-CONTROLLER-3.5 hands an awaited approval to the running reply', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await choose(page, 'Approval, awaited');
    await sendMessage(page, 'Clean up my drafts');
    const approval = page.getByRole('group', { name: 'Allow “Delete the old spring menu”?' });
    await expect(approval).toBeVisible();
    await expect(lastMessage(page)).not.toHaveAttribute('aria-busy', 'true');
    await expect(demo(page).locator('.ui-chat-status-line__text')).toHaveText(
      'Waiting for your approval…',
    );
    await lab.expectAccessible();
    await page.getByRole('button', { name: 'Send the wrong kind of response' }).click();
    await expect(page.getByRole('region', { name: 'Event log' })).toContainText(
      'Sent the wrong kind of response',
    );
    await expect(page.getByRole('region', { name: 'Event log' })).not.toContainText(
      'waitFor(call-',
    );
    await expect(lastMessage(page).locator('.ui-chat-tool-call')).toHaveAttribute(
      'data-status',
      'approval-requested',
    );
    await approval.getByRole('button', { name: /Approve/ }).click();
    await expect(lastMessage(page)).toContainText('Done: the old spring menu is gone.');
    await expect(lastMessage(page).locator('.ui-chat-tool-call')).toHaveAttribute(
      'data-status',
      'succeeded',
    );
    await expect(page.getByRole('region', { name: 'Event log' })).toContainText('waitFor(call-');
  });

  test('UIC-CHAT-CONTROLLER-3.3 always allows a tool and approves it later without asking', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await choose(page, 'Approval, awaited');
    await sendMessage(page, 'Clean up my drafts');
    await page.getByRole('button', { name: 'Always allow in this conversation' }).click();
    await expect(lastMessage(page)).toContainText('Done: the old spring menu is gone.');
    await expect(demo(page)).toContainText('Always allowed: delete_draft');
    await sendMessage(page, 'And the summer one');
    await expect(lastMessage(page).locator('.ui-chat-tool-call')).toHaveAttribute(
      'data-auto-approved',
      'true',
    );
    await expect(lastMessage(page)).toContainText('Done: the old spring menu is gone.');
  });

  test('UIC-CHAT-CONTROLLER-2.5 queues messages sent during a reply and sends them in order', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await sendMessage(page, 'First question');
    await expect(lastMessage(page)).toContainText('Soak');
    await sendMessage(page, 'Second question');
    await sendMessage(page, 'Third question');
    const queue = page.getByRole('list', { name: 'Queued messages' });
    await expect(queue.getByRole('listitem')).toHaveCount(2);
    await lab.expectAccessible();
    await queue.getByRole('button', { name: 'Remove queued message 2' }).click();
    await queue.getByRole('textbox', { name: 'Queued message 1' }).fill('Second, edited');
    await expect(transcript(page).getByText('Second, edited')).toBeVisible({ timeout: 20_000 });
    await expect(queue).toHaveCount(0);
    await expect(transcript(page).getByText('Third question')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Sent prompts' })).toContainText('Second, edited');
  });

  test('UIC-CHAT-CONTROLLER-5.3 clears a streaming conversation and never sends its queue', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-controller');
    await sendMessage(page, 'First question');
    await expect(lastMessage(page)).toContainText('Soak');
    await sendMessage(page, 'Queued question');
    await expect(page.getByRole('list', { name: 'Queued messages' })).toBeVisible();
    await demo(page).getByRole('button', { name: 'Clear the conversation' }).click();
    await expect(transcript(page).getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Queued messages' })).toHaveCount(0);
    await expect(demo(page).getByRole('button', { name: 'Stop' })).toBeDisabled();
    // A fresh turn runs as long as the old reply would have; the old queue never follows it.
    await sendMessage(page, 'Fresh question');
    await expect(demo(page).getByRole('button', { name: 'Stop' })).toBeDisabled({
      timeout: 20_000,
    });
    await expect(transcript(page).getByRole('article')).toHaveCount(2);
    await expect(transcript(page).getByText('Queued question')).toHaveCount(0);
  });
});
