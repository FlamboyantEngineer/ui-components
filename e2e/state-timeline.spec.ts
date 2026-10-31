import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-state-timeline`;

test.describe('State Timeline lab', () => {
  test('UIC-STATE-TIMELINE-1.1 UIC-STATE-TIMELINE-1.2 UIC-STATE-TIMELINE-1.3 reads each change', async ({
    page,
    lab,
  }) => {
    await lab.open('state-timeline');
    const list = page.locator(cell('upcoming=none direction=ascending'));
    const entries = list.locator('.ui-state-timeline__entry');
    await expect(entries).toHaveCount(4);
    await expect(list.locator('.ui-state-timeline__state')).toHaveText([
      'Draft',
      'In review',
      'Changes requested',
      'Approved',
    ]);
    await expect(entries.nth(0).locator('.ui-state-timeline__attribution')).toHaveText(
      '6 days ago by Maria Santos',
    );
    await expect(entries.nth(1).locator('.ui-state-timeline__attribution')).toHaveText(
      '18 hours ago by Jon Berg',
    );
    await expect(entries.nth(3).locator('.ui-state-timeline__attribution')).toHaveText(
      '12 minutes ago by Maria Santos',
    );
    await expect(entries.nth(1).locator('.ui-state-timeline__comment')).toHaveText(
      'Two figures need their units checked.',
    );
    const dates = page.locator(cell('avatar=name fallback=1 day'));
    await expect(dates.locator('.ui-state-timeline__attribution').first()).toHaveText(
      /^Apr 14, 2026.* by Maria Santos$/,
    );
    await expect(
      page
        .locator(cell('avatar=avatar fallback=7 days'))
        .locator('.ui-attribution__avatar')
        .first(),
    ).toBeVisible();
  });

  test('UIC-STATE-TIMELINE-1.4 UIC-STATE-TIMELINE-1.5 marks the current state and orders the list', async ({
    page,
    lab,
  }) => {
    await lab.open('state-timeline');
    const ascending = page.locator(cell('upcoming=two direction=ascending'));
    const statuses = (list: typeof ascending) =>
      list
        .locator('.ui-state-timeline__entry')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-status')));
    expect(await statuses(ascending)).toEqual([
      'past',
      'past',
      'past',
      'current',
      'upcoming',
      'upcoming',
    ]);
    const current = ascending.locator('[aria-current="step"]');
    await expect(current.locator('.ui-state-timeline__current')).toHaveText('Current');
    await expect(current.locator('.ui-state-timeline__state')).toHaveText('Approved');
    const descending = page.locator(cell('upcoming=two direction=descending'));
    await expect(descending).toHaveAttribute('data-direction', 'descending');
    expect(await statuses(descending)).toEqual([
      'upcoming',
      'upcoming',
      'current',
      'past',
      'past',
      'past',
    ]);
    const box = async (index: number) =>
      requireDefined(
        await descending.locator('.ui-state-timeline__marker').nth(index).boundingBox(),
      );
    expect((await box(1)).y).toBeGreaterThan((await box(0)).y);
    expect(Math.round((await box(1)).x)).toBe(Math.round((await box(0)).x));
  });

  test('UIC-STATE-TIMELINE-1.4 adds live changes as the new current state', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('state-timeline');
    await page.clock.pauseAt(Date.now() + 1000);
    const demo = page.locator('[data-lab-demo="live"]');
    const list = demo.getByRole('list', { name: 'Task history' });
    await expect(list.locator('[aria-current="step"] .ui-state-timeline__state')).toHaveText(
      'Open',
    );
    await demo.getByRole('button', { name: 'Move to In progress' }).click();
    await expect(list.locator('[aria-current="step"] .ui-state-timeline__state')).toHaveText(
      'In progress',
    );
    await expect(list.locator('[aria-current="step"] .ui-state-timeline__attribution')).toHaveText(
      'Now by Jon Berg',
    );
    await expect(list.locator('[data-status="upcoming"]')).toHaveCount(2);
  });

  test('UIC-STATE-TIMELINE-2.1 names each list and passes axe', async ({ page, lab }) => {
    await lab.open('state-timeline');
    await expect(
      page.getByRole('list', { name: 'History, ascending, two upcoming' }),
    ).toBeVisible();
    await lab.expectAccessible();
  });
});
