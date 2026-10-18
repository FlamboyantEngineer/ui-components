import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-attribution`;

test.describe('Attribution lab', () => {
  test('UIC-ATTRIBUTION-1.1 UIC-ATTRIBUTION-1.2 reads each sentence with its time', async ({
    page,
    lab,
  }) => {
    await lab.open('attribution');
    await expect(page.locator(cell('template=default person=name'))).toHaveText(
      '18 minutes ago by Maria Santos',
    );
    await expect(page.locator(cell('template=edited person=name'))).toHaveText(
      'Edited 18 minutes ago by Maria Santos',
    );
    await expect(page.locator(cell('template=person first person=name'))).toHaveText(
      'Maria Santos commented 18 minutes ago',
    );
    await expect(page.locator(cell('time=yesterday template=default'))).toHaveText(
      'Yesterday by Maria Santos',
    );
    await expect(page.locator(cell('time=yesterday template=edited'))).toHaveText(
      'Edited yesterday by Maria Santos',
    );
    await expect(page.locator(cell('time=absolute template=edited'))).toHaveText(
      'Edited Jan 14, 2026 by Maria Santos',
    );
    await expect(page.locator(cell('time=missing template=edited'))).toHaveText(
      'Edited unknown time by Maria Santos',
    );
    await expect(page.locator(cell('fallback=7 days'))).toHaveText('Yesterday');
    await expect(page.locator(cell('fallback=1 day'))).toHaveText('Apr 19, 2026');
  });

  test('UIC-ATTRIBUTION-1.3 UIC-ATTRIBUTION-1.4 draws the avatar and opens the person card', async ({
    page,
    lab,
  }) => {
    await lab.open('attribution');
    const withAvatar = page.locator(cell('template=default person=avatar'));
    const avatar = withAvatar.locator('.ui-attribution__avatar');
    await expect(avatar).toBeVisible();
    expect((await avatar.boundingBox())?.width).toBe(20);
    const trigger = page
      .locator(cell('template=default person=card'))
      .getByRole('button', { name: 'Maria Santos' });
    await trigger.click();
    const card = page.getByRole('dialog', { name: 'Maria Santos' });
    await expect(card).toContainText('maria@example.com');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-ATTRIBUTION-1.2 keeps live times current and previews the author on hover', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('attribution');
    await page.clock.pauseAt(Date.now() + 1000);
    await page.getByRole('button', { name: 'Add a note' }).click();
    const note = page.locator('[data-lab-note="2"]');
    await expect(note).toHaveText('added now by Jon Berg');
    // Step the clock so each render can schedule the next wake on the shared timer.
    for (let step = 0; step < 24; step += 1) await page.clock.runFor(5000);
    await expect(note).toHaveText('added 2 minutes ago by Jon Berg');
    await page.mouse.move(5, 5);
    await note.getByRole('button', { name: 'Jon Berg' }).hover();
    await page.clock.runFor(1000);
    await expect(page.getByRole('dialog', { name: 'Jon Berg' })).toContainText('Field research');
    await page.clock.resume();
  });

  test('UIC-ATTRIBUTION-1.6 adds no role and passes axe in both themes', async ({ page, lab }) => {
    await lab.open('attribution');
    await expect(page.locator('#lab-root .ui-attribution[role]')).toHaveCount(0);
    await lab.expectAccessible();
    await lab.open('attribution', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
