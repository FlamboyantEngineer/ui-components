import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const statuses = [
  ['pending', 'Pending'],
  ['running', 'Running'],
  ['approval-requested', 'Needs approval'],
  ['succeeded', 'Done'],
  ['failed', 'Failed'],
  ['denied', 'Denied'],
  ['cancelled', 'Cancelled'],
] as const;

const card = (page: Page, cell: string) => matrixCell(page, cell).locator(`.ui-chat-tool-call`);

const demo = (page: Page) => page.locator('[data-lab-demo="approval"]');

const triggerOf = (scope: ReturnType<Page['locator']>) =>
  scope.locator('.ui-chat-tool-call__heading').getByRole('button');

test.describe('Chat Tool Call lab', () => {
  test('UIC-CHAT-TOOL-CALL-1.8 draws a call as a card or a quiet row', async ({ page, lab }) => {
    await lab.open('chat-tool-call');
    for (const status of ['running', 'succeeded', 'failed']) {
      const cardCall = card(page, `variant=card status=${status}`);
      const row = card(page, `variant=row status=${status}`);
      await expect(cardCall).toHaveAttribute('data-variant', 'card');
      await expect(cardCall).toHaveCSS('border-top-width', '1px');
      await expect(row).toHaveAttribute('data-variant', 'row');
      await expect(row).toHaveCSS('border-top-width', '0px');
      await expect(triggerOf(row)).toHaveAccessibleName(/^Read notes\/menu\.md/);
    }
    await lab.expectAccessible('[data-lab-section="Variants"]');
  });

  test('UIC-CHAT-TOOL-CALL-1.1 UIC-CHAT-TOOL-CALL-1.3 UIC-CHAT-TOOL-CALL-1.5 UIC-CHAT-TOOL-CALL-2.5 draws every status accessibly', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    for (const [status, text] of statuses) {
      const call = card(page, `status=${status} details=none expansion=collapsed`);
      await expect(call).toHaveAttribute('data-status', status);
      await expect(triggerOf(call)).toHaveAccessibleName(new RegExp(`^Search recipes ${text}`));
    }
    await expect(card(page, 'status=running details=none expansion=collapsed')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    const failed = card(page, 'status=failed details=none expansion=collapsed');
    await expect(failed.locator('.ui-chat-tool-call__error')).toBeHidden();
    await expect(
      card(page, 'status=failed details=none expansion=expanded').locator(
        '.ui-chat-tool-call__error',
      ),
    ).toHaveText('The recipe service did not answer in time.');
    await expect(card(page, 'status=succeeded').locator('.ui-chat-tool-call__badge')).toHaveText(
      'Auto-approved',
    );
    await lab.expectAccessible();
  });

  test('UIC-CHAT-TOOL-CALL-3.1 expands and collapses a card from its trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const call = card(page, 'status=succeeded details=args and result expansion=collapsed');
    const trigger = triggerOf(call);
    const result = call.getByRole('group', { name: 'Result' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(result).toBeHidden();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(result).toBeVisible();
    await expect(result).toContainText('"title": "Red lentil soup"');
    await lab.expectAccessible('[data-lab-section="Statuses"]');
    await page.keyboard.press('Enter');
    await expect(result).toBeHidden();
    await expect(
      card(page, 'status=approval-requested details=args and result expansion=collapsed'),
    ).toBeVisible();
    await expect(
      triggerOf(card(page, 'status=failed details=none expansion=expanded')),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('UIC-CHAT-TOOL-CALL-2.1 UIC-CHAT-TOOL-CALL-2.3 shows a custom body and scrolls a long result by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const custom = page.locator('[data-lab-demo="custom-body"]');
    await expect(custom.locator('[data-lab-forecast="porto"]')).toContainText('Sunny, 24 °C');
    await expect(custom.getByRole('group', { name: 'Arguments' })).toHaveCount(0);
    const view = page.locator('[data-lab-demo="long-result"]').getByRole('group', {
      name: 'Result',
    });
    await expect(view).toContainText('"train": "IC 549"');
    expect(await view.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await view.focus();
    await page.keyboard.press('End');
    await expect(async () => {
      expect(await view.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    }).toPass();
  });

  test('UIC-CHAT-TOOL-CALL-4.1 offers only the decisions the host handles', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const buttonsOf = (options: string, scope: string) =>
      card(page, `options=${options} scope=${scope}`).locator('.ui-chat-tool-call__action');
    await expect(buttonsOf('approve', 'none')).toHaveText(['Approve']);
    await expect(buttonsOf('deny always', 'none')).toHaveText(['Deny', 'Always allow']);
    await expect(buttonsOf('approve deny always', 'this conversation')).toHaveText([
      'Approve',
      'Deny',
      'Always allow in this conversation',
    ]);
    await expect(
      card(page, 'options=approve scope=none').getByRole('group', {
        name: 'Allow “Send the shopping list to Ana”?',
      }),
    ).toBeVisible();
  });

  test('UIC-CHAT-TOOL-CALL-4.3 UIC-CHAT-TOOL-CALL-4.4 approves with Ctrl+Enter and keeps the decision', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('chat-tool-call');
    const call = demo(page).locator('.ui-chat-tool-call');
    await expect(call.getByRole('button', { name: 'Approve' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Enter',
    );
    await lab.expectAccessible('[data-lab-demo="approval"]');
    await triggerOf(call).focus();
    await page.keyboard.press('Control+Enter');
    await expect(call.locator('.ui-chat-tool-call__decision')).toHaveText('Approved');
    await expect(call).toHaveAttribute('data-status', 'running');
    await expect(demo(page).getByRole('list', { name: 'Callbacks' })).toHaveText('onApprove()');
    await expect(call.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await page.clock.runFor(1600);
    await expect(call).toHaveAttribute('data-status', 'succeeded');
    await expect(call.locator('.ui-chat-tool-call__decision')).toHaveText('Approved');
    await lab.expectAccessible('[data-lab-demo="approval"]');
  });

  test('UIC-CHAT-TOOL-CALL-4.2 UIC-CHAT-TOOL-CALL-4.3 UIC-CHAT-TOOL-CALL-4.5 denies with a reason from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const call = demo(page).locator('.ui-chat-tool-call');
    await triggerOf(call).focus();
    await page.keyboard.press('Escape');
    const deny = call.getByRole('button', { name: 'Deny' });
    await expect(deny).toBeFocused();
    await page.keyboard.press('Enter');
    const reason = call.getByRole('textbox', { name: 'Reason (optional)' });
    await expect(reason).toBeFocused();
    await lab.expectAccessible('[data-lab-demo="approval"]');
    await page.keyboard.type('Keep the drafts until Friday');
    await page.keyboard.press('Enter');
    await expect(call.locator('.ui-chat-tool-call__decision')).toHaveText(
      'Denied: Keep the drafts until Friday',
    );
    await expect(call).toHaveAttribute('data-status', 'denied');
    await expect(deny).toBeFocused();
    await expect(deny).toHaveAttribute('aria-disabled', 'true');
    await expect(demo(page).getByRole('list', { name: 'Callbacks' })).toHaveText(
      'onDeny("Keep the drafts until Friday")',
    );
    await lab.expectAccessible('[data-lab-demo="approval"]');
    await page.keyboard.press('Tab');
    await expect(call.getByRole('button', { name: /^Always allow/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(call.getByRole('button', { name: 'Deny' })).toHaveCount(0);
  });

  test('UIC-CHAT-TOOL-CALL-4.2 starts the next call in the same card without the earlier denial draft', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const queue = page.locator('[data-lab-demo="queue"]');
    await queue.getByRole('button', { name: 'Deny' }).click();
    const reason = queue.getByRole('textbox', { name: 'Reason (optional)' });
    await expect(reason).toBeFocused();
    await page.keyboard.type('Reason for the first call');
    await queue.getByRole('button', { name: 'Next call' }).click();
    await expect(queue.getByRole('group', { name: 'Allow “Delete file”?' })).toBeVisible();
    await expect(reason).toHaveCount(0);
    await queue.getByRole('button', { name: 'Deny' }).click();
    await expect(reason).toHaveValue('');
    await page.keyboard.press('Enter');
    await expect(queue.locator('[data-lab-events="queue"] li')).toHaveText([
      'queued-delete: onDeny()',
    ]);
  });

  test('UIC-CHAT-TOOL-CALL-4.5 keeps a pressed button focused and disabled once decided', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    const call = demo(page).locator('.ui-chat-tool-call');
    const always = call.getByRole('button', { name: 'Always allow in this conversation' });
    await always.focus();
    await page.keyboard.press('Enter');
    await expect(call.locator('.ui-chat-tool-call__decision')).toHaveText('Always allowed');
    await expect(always).toBeFocused();
    await expect(always).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    await expect(demo(page).getByRole('list', { name: 'Callbacks' })).toHaveText('onAlwaysAllow()');
  });

  test('UIC-CHAT-TOOL-CALL-1.1 wraps a long label beside the glyph, which stays on the first line', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-tool-call');
    for (const status of ['succeeded', 'running', 'failed']) {
      const heading = page.locator(`#long-label-${status} .ui-chat-tool-call__heading`);
      const box = async (selector: string) => {
        const found = await heading.locator(selector).boundingBox();
        if (!found) throw new Error(`${selector} has no box`);
        return found;
      };
      const glyph = await box('.ui-chat-tool-call__status-glyph');
      const indicator = await box('.ui-disclosure__indicator');
      const summary = await box('.ui-chat-tool-call__summary');
      const statusBox = await box('.ui-chat-tool-call__status');
      const lineHeight = await heading
        .locator('.ui-chat-tool-call__summary')
        .evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
      // The label wraps onto more than one line inside the summary.
      expect(summary.height).toBeGreaterThan(lineHeight * 1.5);
      // The glyph and the indicator are centred on the first line, beside the summary.
      expect(Math.abs(glyph.y + glyph.height / 2 - (summary.y + lineHeight / 2))).toBeLessThan(2);
      expect(
        Math.abs(indicator.y + indicator.height / 2 - (glyph.y + glyph.height / 2)),
      ).toBeLessThan(1);
      expect(glyph.x + glyph.width).toBeLessThanOrEqual(summary.x);
      // The status follows the label inside the summary, not on a line of its own past it.
      expect(statusBox.x).toBeGreaterThan(summary.x);
      expect(statusBox.y + statusBox.height).toBeLessThanOrEqual(summary.y + summary.height + 1);
    }
  });
});
