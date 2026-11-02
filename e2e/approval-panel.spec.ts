import { cellSelector, expect, test } from './fixtures.js';

const cell = (id: string) => `${cellSelector(id)} .ui-approval-panel`;

test.describe('Approval Panel lab', () => {
  test('UIC-APPROVAL-PANEL-1.1 UIC-APPROVAL-PANEL-1.2 UIC-APPROVAL-PANEL-1.3 UIC-APPROVAL-PANEL-1.4 reads each outcome', async ({
    page,
    lab,
  }) => {
    await lab.open('approval-panel');
    const pending = page.locator(cell('outcome=pending required=all'));
    await expect(pending).toHaveAttribute('data-outcome', 'pending');
    await expect(pending.locator('.ui-segmented-bar__label')).toHaveText('1 of 3 approvals');
    await expect(page.locator(cell('outcome=pending required=one'))).toHaveAttribute(
      'data-outcome',
      'approved',
    );
    await expect(page.locator(cell('outcome=approved required=all'))).toHaveAttribute(
      'data-outcome',
      'pending',
    );
    const rejected = page.locator(cell('outcome=rejected required=one'));
    await expect(rejected).toHaveAttribute('data-outcome', 'rejected');
    await expect(rejected.locator('.ui-approval-panel__outcome')).toHaveText('Rejected');
    const jon = rejected.locator('.ui-approval-panel__approver', { hasText: 'Jon Berg' });
    await expect(jon).toHaveAttribute('data-decision', 'rejected');
    await expect(jon.locator('.ui-approval-panel__time')).toHaveText('2 hours ago');
    await expect(jon.locator('.ui-approval-panel__comment')).toHaveText(
      'The oven temperature is missing.',
    );
    const segments = pending.locator('.ui-segmented-bar__segment');
    await expect(segments).toHaveCount(2);
    const group = page
      .locator(cell('outcome=approved required=all'))
      .locator('.ui-approval-panel__approver', { hasText: 'Kitchen team' });
    await expect(group.locator('.ui-avatar')).toHaveAttribute('data-kind', 'group');
    await expect(group.locator('.ui-approval-panel__decision')).toHaveText('Abstained');
  });

  test('UIC-APPROVAL-PANEL-1.5 UIC-APPROVAL-PANEL-1.6 UIC-APPROVAL-PANEL-1.7 reminds, asks again and records the reader decision', async ({
    page,
    lab,
  }) => {
    await lab.open('approval-panel');
    const panel = page.locator('[data-lab-decide]');
    const lena = panel.locator('.ui-approval-panel__approver', { hasText: 'Lena Ortiz' });
    await expect(lena).toHaveAttribute('data-current', 'true');
    await expect(lena.locator('.ui-approval-panel__you')).toHaveText('You');
    await panel.getByRole('button', { name: 'Remind Lena Ortiz' }).click();
    await expect(page.locator('[data-lab-log]')).toHaveText('Reminded lena');
    await panel.getByRole('button', { name: 'Request again from Jon Berg' }).click();
    const jon = panel.locator('.ui-approval-panel__approver', { hasText: 'Jon Berg' });
    await expect(jon).toHaveAttribute('data-decision', 'pending');
    await expect(panel.getByRole('button', { name: 'Remind Jon Berg' })).toBeVisible();
    const actions = panel.locator('.ui-approval-panel__actions');
    await actions.getByRole('radio', { name: 'Approve' }).click();
    await actions.getByRole('button', { name: 'Submit' }).click();
    await expect(lena).toHaveAttribute('data-decision', 'approved');
    await expect(panel).toHaveAttribute('data-outcome', 'approved');
    await expect(panel.locator('.ui-segmented-bar__label')).toHaveText('2 of 2 approvals');
    await expect(actions).toHaveCount(0);
  });

  test('UIC-APPROVAL-PANEL-2.1 names each panel and passes axe', async ({ page, lab }) => {
    await lab.open('approval-panel');
    await expect(page.getByRole('region', { name: 'Recipe 42 sign-off' })).toBeVisible();
    await lab.expectAccessible();
  });
});

test.describe('Approval Panel time zones', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('UIC-APPROVAL-PANEL-1.4 reads decision times in the chosen zone and threshold', async ({
    page,
    lab,
  }) => {
    await lab.open('approval-panel');
    const demo = page.locator('[data-lab-demo="approval-zones"]');
    const time = (name: string) =>
      demo
        .locator('.ui-approval-panel__approver', { hasText: name })
        .locator('.ui-approval-panel__time');
    const choose = (group: string, name: string) =>
      demo.getByRole('radiogroup', { name: group }).getByRole('radio', { name }).click();
    await expect(time('Maria Santos')).toHaveText('Yesterday');
    await expect(time('Jon Berg')).toHaveText('3 days ago');

    await choose('Provider time zone', 'London');
    await expect(time('Maria Santos')).toHaveText('2 days ago');
    await expect(time('Jon Berg')).toHaveText('4 days ago');

    await choose('Dates after', '2 days');
    await expect(time('Maria Santos')).toHaveText(/^Apr 19, 2026, 11:00\sPM$/);
    await expect(time('Jon Berg')).toHaveText(/^Apr 17, 2026, 1:00\sPM$/);

    await choose('Override time zone', 'UTC');
    await expect(time('Maria Santos')).toHaveText('Yesterday');
    await expect(time('Jon Berg')).toHaveText(/^Apr 17, 2026, 12:00\sPM$/);

    await choose('Dates after', '1 day');
    await expect(time('Maria Santos')).toHaveText(/^Apr 19, 2026, 10:00\sPM$/);
    await lab.expectAccessible('[data-lab-demo="approval-zones"]');
  });
});
