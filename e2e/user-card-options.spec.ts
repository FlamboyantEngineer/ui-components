import { expect, matrixCell, test } from './fixtures.js';

test.describe('User Card lab statuses, avatar options and badges', () => {
  test('UIC-USER-CARD-1.2 shows every status with default and caller words', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    for (const status of ['active', 'away', 'busy', 'idle']) {
      const card = matrixCell(page, `label=default status=${status}`).locator('.ui-user-card');
      await expect(card).toHaveAttribute('data-status', status);
      await expect(card.locator('.ui-user-card__status-label')).not.toBeEmpty();
    }
    await expect(
      matrixCell(page, 'label=caller status=busy').locator('.ui-user-card__status-label'),
    ).toHaveText('In a meeting');
  });

  test('UIC-USER-CARD-1.1 passes avatar options and badges to its identity', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    const square = matrixCell(page, 'option=initials shape=square').locator('.ui-avatar');
    await expect(square).toHaveAttribute('data-shape', 'square');
    await expect(square.locator('.ui-avatar__initials')).toHaveText('MF');
    await expect(
      matrixCell(page, 'option=color\\ slot shape=rounded').locator('.ui-avatar'),
    ).toHaveAttribute('data-color', '4');
    const statusCard = matrixCell(page, 'badge=labelled status=active placement=bottom-end');
    // The card's status is a row of its own, so the avatar's status corner stays free.
    await expect(statusCard.locator('.ui-avatar__badge')).toHaveAttribute(
      'data-placement',
      'bottom-end',
    );
    await expect(statusCard.locator('.ui-user-card__status')).toBeVisible();
    await expect(statusCard.getByRole('img', { name: 'France' })).toHaveCount(1);
    await expect(
      matrixCell(page, 'badge=decorative status=none placement=bottom-start').locator(
        '.ui-avatar__badge',
      ),
    ).toHaveAttribute('data-placement', 'bottom-start');
  });
});
