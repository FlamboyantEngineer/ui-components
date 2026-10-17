import { expect, test } from './fixtures.js';

test.describe('User Card lab', () => {
  test('UIC-USER-CARD-1.1 UIC-USER-CARD-1.2 UIC-USER-CARD-1.5 draws every part within the card width', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    const full = page.locator('[data-lab-cell="content=details and actions avatar=picture"]');
    const card = full.getByRole('dialog', { name: 'Maria Santos' });
    await expect(card.locator('.ui-user-identity__description')).toHaveText('maria@example.com');
    await expect(card.locator('.ui-user-card__status-label')).toHaveText('Away until 14:00');
    await expect(card.locator('.ui-user-card__details dt')).toHaveText(['Team', 'Local time']);
    await expect(card.getByRole('button')).toHaveText(['Message', 'View profile']);
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(200);
    expect(box?.width).toBeLessThanOrEqual(280);
    const minimal = page.locator('[data-lab-cell="content=name only avatar=group"]');
    await expect(minimal.locator('.ui-avatar__glyph')).toBeVisible();
    await expect(minimal.locator('.ui-user-card__status')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-USER-CARD-2.1 UIC-USER-CARD-2.2 opens a card from the keyboard and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    const trigger = page.locator('[data-lab-trigger="name"]');
    await expect(trigger).toHaveAccessibleName('Lena Ortiz');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const card = page.getByRole('dialog', { name: 'Lena Ortiz' });
    await expect(card).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const triggerBox = await trigger.boundingBox();
    const cardBox = await card.boundingBox();
    const below = (cardBox?.y ?? 0) >= (triggerBox?.y ?? 0) + (triggerBox?.height ?? 0);
    const above = (cardBox?.y ?? 0) + (cardBox?.height ?? 0) <= (triggerBox?.y ?? 0);
    expect(below || above).toBe(true);
    await expect(card.locator(':focus')).toHaveCount(0);
    expect(await card.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await lab.expectAccessible('.ui-user-card__popover');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press(' ');
    await expect(card).toBeVisible();
    await page.mouse.click(5, 300);
    await expect(card).toHaveCount(0);
  });

  test('UIC-USER-CARD-1.4 closes the card before reporting an action', async ({ page, lab }) => {
    await lab.open('user-card');
    const trigger = page.locator('[data-lab-trigger="identity"]');
    await trigger.click();
    const card = page.getByRole('dialog', { name: 'Jon Berg' });
    await card.getByRole('button', { name: 'View profile' }).click();
    await expect(card).toHaveCount(0);
    await expect(page.locator('[data-lab-output="action"]')).toHaveText('profile for Jon Berg');
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-lab-trigger="disabled"]')).toBeDisabled();
  });

  test('UIC-USER-CARD-2.2 opens cards from a presence strip and passes axe in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card', { theme: 'dark' });
    await lab.expectAccessible();
    const strip = page.locator('[data-lab-strip="cards"]');
    await strip.getByRole('button', { name: 'Sam Okafor, Idle' }).click();
    const card = page.getByRole('dialog', { name: 'Sam Okafor' });
    await expect(card).toBeVisible();
    await lab.expectAccessible('.ui-user-card__popover');
  });
});
