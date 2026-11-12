import { expect, test } from './fixtures.js';

test.describe('Announcer lab', () => {
  test('UIC-ANNOUNCER-1.1 UIC-ANNOUNCER-1.2 reads moves politely and a lost connection at once', async ({
    page,
    lab,
  }) => {
    await lab.open('announcer');
    const demo = page.locator('[data-lab-demo="page"]');
    const regions = demo.locator('[data-lab-announcer="page"]');
    await expect(regions.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await expect(regions.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    await expect(regions).toHaveCSS('position', 'absolute');
    await demo.getByRole('button', { name: 'Move Apples down' }).click();
    await expect(demo.getByRole('listitem').nth(1)).toContainText('Apples');
    await expect(regions.getByRole('status')).toHaveText('Apples moved to position 2 of 4.');
    await demo.getByRole('button', { name: 'Lose the connection' }).click();
    await expect(regions.getByRole('alert')).toHaveText('Connection lost. Changes are kept here.');
    await demo.getByRole('button', { name: 'Show what page holds' }).click();
    await expect(demo.locator('[data-lab-output="page"]')).toContainText(
      'Polite: “Apples moved to position 2 of 4.” Assertive: “Connection lost. Changes are kept here.”',
    );
    await lab.expectAccessible('[data-lab-demo="page"]');
  });

  test('UIC-ANNOUNCER-1.1 keeps an inner announcer to its own panel', async ({ page, lab }) => {
    await lab.open('announcer');
    const demo = page.locator('[data-lab-demo="scoped"]');
    await demo.getByRole('button', { name: 'Move Pears up' }).click();
    await expect(demo.locator('[data-lab-announcer="inner"] .ui-announcer__polite')).toHaveText(
      'Pears moved to position 1 of 4.',
    );
    await expect(demo.locator('[data-lab-announcer="outer"] > .ui-announcer__polite')).toHaveText(
      '',
    );
  });
});
