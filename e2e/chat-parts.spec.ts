import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const section = (page: Page, title: string) => page.locator(`[data-lab-section="${title}"]`);
const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

test.describe('Chat Parts lab', () => {
  test('UIC-CHAT-PARTS-2.1 UIC-CHAT-PARTS-2.3 UIC-CHAT-PARTS-2.4 draws text in both formats with token pills', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const markdown = matrixCell(page, 'content=tokens format=markdown');
    await expect(markdown.locator('.ui-chat-parts__text')).toHaveAttribute(
      'data-format',
      'markdown',
    );
    await expect(markdown.locator('.ui-chat-parts__token[data-kind="command"]')).toHaveText(
      '/plan',
    );
    await expect(markdown.locator('strong .ui-chat-parts__token')).toHaveText('@Ana Lopez');
    await expect(markdown.locator('code', { hasText: '@Ana' })).toHaveText('@Ana');
    await expect(markdown.locator('.ui-chat-parts__token')).toHaveCount(2);
    const plain = matrixCell(page, 'content=tokens format=plain');
    await expect(plain.locator('.ui-chat-parts__token')).toHaveCount(3);
    for (const format of ['markdown', 'plain']) {
      const literal = matrixCell(page, `content=literal format=${format}`);
      await expect(literal.locator('.ui-chat-parts__token')).toHaveCount(1);
      await expect(literal).toContainText('pasted \uFFF90\uFFFB from');
    }
    await expect(plain.locator('.ui-chat-parts__text')).toContainText('**');
    await expect(matrixCell(page, 'content=lines format=plain').locator('br')).toHaveCount(3);
    await lab.expectAccessible('[data-lab-section="Text and tokens"]');
  });

  test('UIC-CHAT-PARTS-2.5 draws record references as chips in both formats', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    for (const format of ['markdown', 'plain']) {
      const references = matrixCell(page, `content=references format=${format}`);
      const chips = references.locator('.ui-chat-parts__token[data-kind="reference"]');
      await expect(chips).toHaveCount(4);
      await expect(chips.first().getByRole('link')).toHaveText('TRIP-4 Lisbon weekend');
      await expect(chips.nth(2)).toHaveText('Missing item');
      await expect(chips.nth(3)).toHaveText('Restricted item');
    }
    const linked = matrixCell(page, 'content=linked format=markdown');
    const outer = linked.getByRole('link', { name: /^the plans for TRIP-4/ });
    await expect(outer).toHaveAttribute('href', 'https://example.com/plans');
    await expect(outer.locator('.ui-chat-parts__token[data-kind="reference"]')).toHaveCount(1);
    await expect(outer.locator('a')).toHaveCount(0);
    await expect(
      matrixCell(page, 'content=linked format=plain').locator('.ui-chat-parts__token a'),
    ).toHaveCount(1);
    await lab.expectAccessible('[data-lab-section="Text and tokens"]');
  });

  test('UIC-CHAT-PARTS-2.2 UIC-CHAT-PARTS-5.2 streams an answer: the steps run, collapse, and the citations preview', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const stream = demo(page, 'stream');
    const next = stream.getByRole('button', { name: 'Next event' });
    await expect(stream.getByRole('button', { name: 'Thinking…' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await next.click();
    await next.click();
    const working = stream.getByRole('button', { name: 'Working…' });
    await expect(working).toHaveAttribute('aria-expanded', 'true');
    await expect(stream.locator('.ui-chat-steps .ui-chat-tool-call')).toHaveAttribute(
      'data-status',
      'running',
    );
    await next.click();
    const worked = stream.getByRole('button', { name: 'Ran a search' });
    await expect(worked).toHaveAttribute('aria-expanded', 'false');
    await expect(stream.locator('.ui-chat-steps__panel')).toBeHidden();
    await next.click();
    await next.click();
    await expect(next).toBeDisabled();
    const citation = stream.getByRole('link', { name: /^Source 2: Lisbon to Porto timetable/ });
    await expect(citation.locator('.ui-chat-citation__marker')).toHaveText('[2]');
    // From the steps' trigger, Tab reaches the first citation by keyboard, which opens its preview.
    await worked.focus();
    await page.keyboard.press('Tab');
    await expect(citation).toBeFocused();
    const card = page.getByRole('dialog', { name: 'Lisbon to Porto timetable' });
    await expect(card).toBeVisible();
    await expect(card).not.toHaveAttribute('data-entering');
    await expect(card.locator('.ui-chat-citation__snippet')).toContainText('the 8:05 arrives');
    await lab.expectAccessible('[data-lab-section="Streamed answer"]');
  });

  test('UIC-CHAT-PARTS-5.4 shows a failed step as a quiet row with its error closed', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    await expect(
      matrixCell(page, 'state=failed parts=rendered').locator('.ui-chat-steps'),
    ).not.toHaveAttribute('data-expanded', 'true');
    const opened = matrixCell(page, 'state=failed-opened parts=rendered');
    const failedRow = opened.locator('.ui-chat-tool-call[data-status="failed"]');
    const quietRow = opened.locator('.ui-chat-tool-call[data-status="succeeded"]').first();
    await expect(failedRow).toHaveCSS('border-top-width', '0px');
    await expect(failedRow).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const rowFont = await quietRow.evaluate((row) => getComputedStyle(row).fontSize);
    await expect(failedRow).toHaveCSS('font-size', rowFont);
    await expect(failedRow.locator('.ui-chat-tool-call__status')).toHaveCSS('position', 'absolute');
    await expect(failedRow.locator('.ui-chat-tool-call__error')).toBeVisible();
    const run = demo(page, 'failed-run');
    const next = run.getByRole('button', { name: 'Next event' });
    const group = run.getByRole('button', { name: /^(Working…|Ran searches, fetched a page)$/ });
    const hotels = run.getByRole('button', { name: /^Search hotels in Porto Failed/ });
    const error = run.getByText('did not answer within 10 seconds');
    await next.click();
    await next.click();
    await expect(group).toHaveAccessibleName('Working…');
    await expect(hotels).toHaveAttribute('aria-expanded', 'false');
    await expect(error).toBeHidden();
    await next.click();
    await expect(group).toHaveAccessibleName('Ran searches, fetched a page');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await next.click();
    await expect(next).toBeDisabled();
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.click();
    await hotels.focus();
    await page.keyboard.press('Enter');
    await expect(hotels).toHaveAttribute('aria-expanded', 'true');
    await expect(error).toBeVisible();
    await lab.expectAccessible('[data-lab-section="Failed step"]');
    await page.keyboard.press('Enter');
    await expect(error).toBeHidden();
    await expect(hotels).toBeFocused();
  });

  test('UIC-CHAT-PARTS-5.4 keeps a group the reader closed closed when a call fails', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const run = demo(page, 'failed-run');
    const next = run.getByRole('button', { name: 'Next event' });
    const group = run.getByRole('button', { name: /^(Working…|Ran searches, fetched a page)$/ });
    await next.click();
    await expect(group).toHaveAccessibleName('Working…');
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await next.click();
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await next.click();
    await next.click();
    await expect(next).toBeDisabled();
    await expect(group).toHaveAccessibleName('Ran searches, fetched a page');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await expect(run.locator('.ui-chat-steps__panel')).toBeHidden();
  });

  test('UIC-CHAT-PARTS-3.3 draws tool renderers in the card body and in place of the card', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const renderers = demo(page, 'tool-renderers');
    const forecast = renderers.locator('.ui-chat-tool-call [data-lab-forecast="porto"]');
    await expect(forecast).toContainText('Sunny, 24 °C');
    await expect(renderers.locator('.ui-chat-tool-call')).toHaveCount(2);
    await expect(
      renderers.locator('.ui-chat-tool-call').filter({ hasText: 'Convert the notes to text' }),
    ).toBeVisible();
    const booking = renderers.getByRole('region', { name: 'Train booking' });
    await booking.getByRole('button', { name: 'Book it' }).click();
    await expect(booking).toHaveAttribute('data-lab-booking', 'approved');
    await expect(booking).toContainText('Booked.');
    await renderers.getByRole('button', { name: 'Ask again' }).click();
    await booking.getByRole('button', { name: 'Not now' }).click();
    await expect(booking).toHaveAttribute('data-lab-booking', 'denied');
    await lab.expectAccessible('[data-lab-section="Tool renderers"]');
  });

  test('UIC-CHAT-PARTS-1.2 keeps the DOM ids of hyphenated message ids apart', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const ids = demo(page, 'hyphenated-ids');
    await expect(ids.locator('.ui-chat-tool-call')).toHaveCount(2);
    await expect(page.locator('[id="m%2D1-p"]')).toContainText('Searched the first list');
    await expect(page.locator('[id="m-1-p"]')).toContainText('Searched the second list');
    await lab.expectAccessible('[data-lab-section="Hyphenated message ids"]');
  });

  test('UIC-CHAT-PARTS-1.2 UIC-CHAT-PARTS-3.2 UIC-CHAT-PARTS-3.4 UIC-CHAT-PARTS-5.3 records decisions in a mixed message', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const conversation = demo(page, 'conversation');
    const log = conversation.locator('[data-lab-log="conversation"]');
    const booking = page.locator('#m2-call-booking');
    await expect(booking).toHaveAttribute('data-status', 'approval-requested');
    const group = conversation.locator('#m2 .ui-chat-steps');
    await expect(group).toHaveAttribute('data-expanded', 'true');
    await lab.expectAccessible('[data-lab-section="Mixed message"]');
    await booking.getByRole('button', { name: /^Approve/ }).click();
    await expect(log).toContainText('onApprove(call-booking)');
    await expect(booking).toHaveAttribute('data-status', 'succeeded');
    await expect(booking.locator('.ui-chat-tool-call__decision')).toHaveText('Approved');
    const question = page.locator('#m2-ask-1');
    await question.getByRole('radio', { name: /^Packed/ }).focus();
    await page.keyboard.press('Space');
    await question.getByRole('button', { name: 'Submit' }).click();
    await expect(log).toContainText('onAnswerQuestion(ask-1, [{"questionId":"pace"');
    await expect(question).toHaveAttribute('data-status', 'answered');
    await conversation.getByRole('button', { name: 'Retry' }).click();
    await expect(log).toContainText('onRetryAttachment(text)');
    await lab.expectAccessible('[data-lab-section="Mixed message"]');
  });

  test('UIC-CHAT-PARTS-5.1 UIC-CHAT-PARTS-5.2 UIC-CHAT-TOOL-CALL-1.7 sums up each run of a working session between its notes', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const session = demo(page, 'working-session');
    const groups = session.locator('.ui-chat-steps__trigger');
    await expect(groups).toHaveText([
      'Read files, edited files, ran commands',
      'Read a file, edited a file, ran a command',
      'Read a file, ran a command',
    ]);
    await expect(session.locator('.ui-chat-parts > .ui-markdown')).toHaveCount(3);
    const last = session.locator('.ui-chat-steps').last();
    await expect(last).toHaveAttribute('data-expanded', 'true');
    await expect(last.locator('.ui-chat-steps__glyph')).toHaveAttribute('data-glyph', 'file-text');
    const build = last.getByRole('button', { name: /^Ran npm run build Done/ });
    await expect(
      last.locator('[data-kind="command"] .ui-chat-tool-call__status-glyph'),
    ).toHaveAttribute('data-glyph', 'terminal');
    await build.click();
    await expect(last.getByRole('group', { name: 'Result' })).toContainText('Built in 2.4 s');
    await lab.expectAccessible('[data-lab-section="Working session"]');
  });

  test('UIC-CHAT-PARTS-6.1 keeps the reader’s choices across a remount', async ({ page, lab }) => {
    await lab.open('chat-parts');
    const kept = demo(page, 'kept-expansion');
    const group = kept.getByRole('button', { name: 'Fetched a page' });
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await group.click();
    await expect(kept.locator('[data-lab-expanded]')).toHaveText('{"steps:r1":false,"r1":true}');
    await kept.getByRole('button', { name: 'Remount' }).click();
    await expect(kept.getByRole('button', { name: 'Fetched a page' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('UIC-CHAT-PARTS-3.2 UIC-CHAT-TOOL-CALL-1.8 draws a call alone as the same quiet row as in a group', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    const grouped = matrixCell(page, 'state=failed-opened parts=rendered')
      .locator('.ui-chat-tool-call[data-status="succeeded"]')
      .first();
    for (const state of ['single', 'single-done']) {
      const alone = matrixCell(page, `state=${state} parts=rendered`).locator('.ui-chat-tool-call');
      await expect(alone).toHaveAttribute('data-variant', 'row');
      await expect(alone).toHaveCSS('border-top-width', '0px');
      await expect(alone).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      for (const property of ['font-size', 'color']) {
        const value = await grouped.evaluate(
          (row, name) => getComputedStyle(row).getPropertyValue(name),
          property,
        );
        await expect(alone).toHaveCSS(property, value);
      }
    }
    await expect(
      matrixCell(page, 'state=single-done parts=rendered').locator('.ui-chat-tool-call__status'),
    ).toHaveCSS('position', 'absolute');
  });

  test('UIC-CHAT-PARTS-1.1 UIC-CHAT-PARTS-5.1 passes axe on every part type and state of the steps', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-parts');
    await expect(section(page, 'Part types').locator('.ui-chat-parts')).toHaveCount(12);
    await expect(
      matrixCell(page, 'state=single parts=rendered').locator('.ui-chat-steps'),
    ).toHaveCount(0);
    await lab.expectAccessible('[data-lab-section="Part types"]');
    await lab.expectAccessible('[data-lab-section="Steps"]');
    await lab.expectAccessible('[data-lab-section="Kept expansion"]');
  });
});
