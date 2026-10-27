import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const cell = (page: Page, id: string) => page.locator(`[data-lab-cell="${id}"]`);
const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
const sim = (page: Page, part: string) => page.locator(`[data-lab-sim="${part}"]`);

test.describe('Chat Activity lab', () => {
  test('UIC-CHAT-ACTIVITY-1.1 UIC-CHAT-ACTIVITY-1.2 UIC-CHAT-ACTIVITY-1.3 UIC-CHAT-ACTIVITY-1.4 UIC-CHAT-ACTIVITY-1.5 draws reasoning in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-activity');
    const streaming = cell(page, 'format=markdown state=streaming');
    const thinking = streaming.getByRole('button', { name: 'Thinking…' });
    await expect(thinking).toHaveAttribute('aria-expanded', 'true');
    await expect(streaming.locator('.ui-chat-reasoning__spinner')).toBeVisible();
    const panel = streaming.getByRole('group', { name: 'Thinking…' });
    await expect(panel).toHaveAttribute('aria-busy', 'true');
    await expect(panel.locator('strong')).toHaveText('Porto');
    await expect(
      cell(page, 'format=plain state=streaming').getByRole('group', { name: 'Thinking…' }),
    ).toContainText('**Porto**');
    const complete = cell(page, 'format=markdown state=complete');
    await expect(complete.getByRole('button', { name: 'Thought for 4 s' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(complete.locator('.ui-chat-reasoning__panel')).toBeHidden();
    await expect(
      cell(page, 'format=markdown state=no-duration').getByRole('button', {
        name: 'Thought for a moment',
      }),
    ).toBeVisible();
    const opened = cell(page, 'format=markdown state=reader-opened');
    await expect(opened.getByRole('button', { name: 'Thought for 1 min 5 s' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(opened.getByRole('group')).toBeVisible();
    const closed = cell(page, 'format=markdown state=reader-closed');
    await expect(closed.getByRole('button', { name: 'Thinking…' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(closed.locator('.ui-chat-reasoning__spinner')).toBeVisible();
    await lab.expectAccessible('[data-lab-section="Reasoning"]');
  });

  test('UIC-CHAT-ACTIVITY-2.1 UIC-CHAT-ACTIVITY-2.2 UIC-CHAT-ACTIVITY-2.3 UIC-CHAT-ACTIVITY-2.4 draws steps in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-activity');
    const running = cell(page, 'state=running');
    await expect(running.locator('.ui-chat-steps')).toHaveAttribute('data-running', 'true');
    const working = running.getByRole('button', { name: 'Working…' });
    await expect(working).toHaveAttribute('aria-expanded', 'true');
    await expect(running.getByRole('group', { name: 'Working…' })).toContainText(
      'Searched trains to Porto',
    );
    await expect(
      cell(page, 'state=reader-closed').getByRole('button', { name: 'Working…' }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(
      cell(page, 'state=finished').getByRole('button', { name: 'Ran a search, read a file' }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(
      cell(page, 'state=reader-opened').getByRole('button', {
        name: 'Ran a search, read a file',
      }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
      cell(page, 'state=one-step').getByRole('button', { name: 'Ran a search' }),
    ).toBeVisible();
    await lab.expectAccessible('[data-lab-section="Steps"]');
  });

  test('UIC-CHAT-ACTIVITY-3.1 UIC-CHAT-ACTIVITY-3.2 UIC-CHAT-ACTIVITY-3.3 draws a plan in every step status', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-activity');
    const titled = cell(page, 'title=titled');
    const list = titled.getByRole('list', { name: 'Saturday in Porto' });
    await expect(list).toHaveAccessibleDescription('1 of 5 done');
    await expect(list.getByRole('listitem')).toHaveText([
      'Find trains to Porto Done',
      'Check the timetable In progress',
      'Compare the fares Pending',
      'Reserve the tile museum Failed',
      'Find a café near the station Skipped',
    ]);
    await expect(list.getByRole('listitem').nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(list.locator('.ui-chat-plan__spinner')).toHaveCount(1);
    await expect(list.locator('.ui-chat-plan__glyph')).toHaveCount(4);
    await expect(cell(page, 'title=untitled').getByRole('list', { name: 'Plan' })).toBeVisible();
    await lab.expectAccessible('[data-lab-section="Plan"]');
  });

  test('UIC-CHAT-ACTIVITY-4.1 UIC-CHAT-ACTIVITY-4.2 shows the status line only while running', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-activity');
    const running = cell(page, 'running=running content=text');
    await expect(running.locator('.ui-chat-status-line__text')).toHaveText(
      'Searching trains to Porto…',
    );
    await expect(running.getByRole('status')).toHaveText('Searching trains to Porto…');
    const thinking = cell(page, 'running=running content=thinking');
    await expect(thinking.locator('.ui-chat-status-line__text')).toHaveText('Thinking…');
    await expect(thinking.locator('.ui-chat-status-line__text')).toHaveCSS(
      'animation-name',
      /shimmer/,
    );
    const icon = cell(page, 'running=running content=icon');
    await expect(icon.locator('.ui-chat-status-line__icon .ui-icon')).toBeVisible();
    await expect(icon.locator('.ui-chat-status-line__spinner')).toHaveCount(0);
    for (const content of ['text', 'thinking', 'icon']) {
      await expect(
        cell(page, `running=stopped content=${content}`).locator('.ui-chat-status-line'),
      ).toHaveCount(0);
    }
    await lab.expectAccessible('[data-lab-section="Status line"]');
  });

  test('UIC-CHAT-ACTIVITY-1.5 UIC-CHAT-ACTIVITY-2.4 expands and collapses by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-activity');
    const reasoning = cell(page, 'format=markdown state=complete');
    const trigger = reasoning.getByRole('button', { name: 'Thought for 4 s' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(reasoning.getByRole('group', { name: 'Thought for 4 s' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const steps = cell(page, 'state=running');
    const working = steps.getByRole('button', { name: 'Working…' });
    await working.focus();
    await page.keyboard.press('Enter');
    await expect(working).toHaveAttribute('aria-expanded', 'false');
    await expect(steps.locator('.ui-chat-steps__panel')).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(cell(page, 'state=reader-closed').getByRole('button')).toBeFocused();
  });

  test('UIC-CHAT-ACTIVITY-1.5 follows a controlled state', async ({ page, lab }) => {
    await lab.open('chat-activity');
    const demo = page.locator('[data-lab-demo="controlled"]');
    const trigger = demo.getByRole('button', { name: 'Thought for 4 s' });
    const toggle = section(page, 'Controlled reasoning').getByRole('switch', {
      name: 'Show the reasoning',
    });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).not.toBeChecked();
  });

  test('UIC-CHAT-ACTIVITY-1.2 UIC-CHAT-ACTIVITY-2.2 UIC-CHAT-ACTIVITY-2.3 UIC-CHAT-ACTIVITY-3.4 UIC-CHAT-ACTIVITY-4.2 streams a reply and collapses it when the run ends', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-activity');
    await page.getByRole('button', { name: 'Run the reply' }).click();
    const steps = sim(page, 'steps');
    const group = steps.getByRole('button', { name: 'Working…' });
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(sim(page, 'reasoning').getByRole('button', { name: 'Thinking…' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(sim(page, 'status').getByRole('status')).toHaveText('Thinking about the trip…');
    await lab.expectAccessible('[data-lab-section="Streaming reply"]');
    await page.clock.runFor(2400);
    await expect(
      sim(page, 'reasoning').getByRole('button', { name: 'Thought for 2 s' }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(steps.getByRole('button', { name: 'Working…' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(sim(page, 'status').locator('.ui-chat-status-line__text')).toHaveText(
      'Searching trains to Porto…',
    );
    await page.clock.runFor(1200);
    await expect(sim(page, 'plan').getByRole('status')).toHaveText(
      'Find trains to Porto: done. Check the timetable: in progress',
    );
    await page.clock.runFor(3200);
    const summary = steps.getByRole('button', { name: 'Ran a search, read a file, used a tool' });
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
    await expect(sim(page, 'status')).toHaveCount(0);
    await expect(sim(page, 'plan').locator('.ui-chat-plan__progress')).toHaveText('4 of 4 done');
    await expect(sim(page, 'message')).toContainText('Take the 8:05 from Lisbon');
    await lab.expectAccessible('[data-lab-section="Streaming reply"]');
  });

  test('UIC-CHAT-ACTIVITY-2.4 keeps the reader’s choice over the end of the run', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-activity');
    const run = page.getByRole('button', { name: /^Run/ });
    await run.click();
    await page.clock.runFor(2400);
    const trigger = sim(page, 'steps').locator('.ui-chat-steps__trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.clock.runFor(4400);
    await expect(trigger).toHaveAccessibleName('Ran a search, read a file, used a tool');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await run.click();
    await page.clock.runFor(1200);
    await sim(page, 'steps').locator('.ui-chat-steps__trigger').click();
    await expect(sim(page, 'steps').locator('.ui-chat-steps__trigger')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.clock.runFor(6000);
    await expect(sim(page, 'steps').locator('.ui-chat-steps__trigger')).toHaveAccessibleName(
      'Ran a search, read a file, used a tool',
    );
    await expect(sim(page, 'steps').locator('.ui-chat-steps__trigger')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('UIC-CHAT-ACTIVITY-1.1 UIC-CHAT-ACTIVITY-2.1 UIC-CHAT-ACTIVITY-3.1 UIC-CHAT-ACTIVITY-4.1 passes axe in both themes', async ({
    lab,
  }) => {
    await lab.open('chat-activity');
    await lab.expectAccessible();
    await lab.open('chat-activity', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
