import { expect, test } from './fixtures.js';

test.describe('User Card lab', () => {
  test('UIC-USER-CARD-1.1 UIC-USER-CARD-1.2 UIC-USER-CARD-1.5 draws every part within the card width', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    await expect(page.locator('.ui-user-card:focus, .ui-user-card :focus')).toHaveCount(0);
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

  test('UIC-USER-CARD-1.3 keeps a detail value when the details are reordered', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    const section = page.locator('[data-lab-reordered]');
    const note = section.getByRole('textbox', { name: 'Note for Maria' });
    await note.fill('Call after lunch');
    await section.getByRole('button', { name: 'Reverse details' }).click();
    await expect(section.locator('dt')).toHaveText(['Note', 'Team']);
    await expect(note).toHaveValue('Call after lunch');
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

  test('UIC-USER-CARD-2.3 opens on hover after the delay, keeps focus and stays open on the way in', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('user-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const trigger = page.locator('[data-lab-trigger="hover-avatar"]');
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    // React Aria opens previews for a pointer it has already seen move.
    await page.mouse.move(5, 5);
    await trigger.hover();
    await page.clock.runFor(599);
    await expect(card).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(card).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(card.locator(':focus')).toHaveCount(0);
    await expect(card.locator('xpath=..')).toHaveAttribute('data-trigger', 'PreviewTrigger');
    const box = await card.boundingBox();
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20, { steps: 8 });
    await page.clock.runFor(1000);
    await expect(card).toBeVisible();
    await page.mouse.move(5, 5);
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    await page.clock.resume();
  });

  test('UIC-USER-CARD-1.4 UIC-USER-CARD-2.3 closes a hover card before reporting its action', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    const trigger = page.locator('[data-lab-trigger="hover-avatar"]');
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    await page.mouse.move(5, 5);
    await trigger.hover();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Message' }).click();
    await expect(card).toHaveCount(0);
    await expect(page.locator('[data-lab-output="hover-action"]')).toHaveText(
      'message for Priya Nair',
    );
    await expect(trigger).toBeFocused();

    // From the keyboard, focus returns without reopening the card.
    await page.clock.install();
    await page.mouse.move(5, 5);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Message' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.clock.runFor(2000);
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-lab-output="hover-action"]')).toHaveText(
      'message for Priya Nair',
    );
  });

  test('UIC-USER-CARD-1.4 UIC-USER-CARD-1.5 leaves a containing modal open', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    await page.locator('[data-lab-trigger="editor"]').click();
    const editor = page.getByRole('dialog', { name: 'Editor' });
    const draft = editor.getByRole('textbox', { name: 'Draft' });
    await expect(draft).toBeFocused();
    await draft.fill('Notes');
    const card = editor.getByRole('dialog', { name: 'Maria Santos' });
    await card.getByRole('button', { name: 'Message' }).click();
    await expect(page.locator('[data-lab-output="modal-action"]')).toHaveText(
      'message for Maria Santos',
    );
    await expect(editor).toBeVisible();
    await expect(draft).toHaveValue('Notes');
    await expect(card.getByRole('button', { name: 'Message' })).toBeFocused();
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-USER-CARD-2.3 opens on keyboard focus, lets Tab in and returns focus on Escape', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('user-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const trigger = page.locator('[data-lab-trigger="hover-name"]');
    const card = page.getByRole('dialog', { name: 'Tom Li' });
    await page.locator('[data-lab-trigger="hover-avatar"]').focus();
    await page.clock.runFor(100);
    await page.keyboard.press('Tab');
    await expect(trigger).toBeFocused();
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Message' })).toBeFocused();
    await page.keyboard.press('Escape');
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    // Focus returns in an animation frame once the card has gone.
    await page.clock.runFor(100);
    await expect(trigger).toBeFocused();
    await page.clock.resume();
    await page.clock.runFor(600);
    await lab.expectAccessible();
  });

  test('UIC-USER-CARD-1.7 UIC-USER-CARD-2.4 loads a card on opening and follows a controlled state', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('user-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const skeleton = page.locator(
      '[data-lab-cell="content=loading avatar=initials"] .ui-user-card',
    );
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
    await expect(skeleton.locator('.ui-user-card__skeleton')).toBeVisible();
    await expect(skeleton.locator('.ui-user-card__status')).toHaveCount(0);

    await page.mouse.move(5, 5);
    await page.locator('[data-lab-trigger="loading"]').hover();
    await page.clock.runFor(600);
    const loading = page.getByRole('dialog', { name: 'Ines Duarte' });
    await expect(loading).toHaveAttribute('data-loading', 'true');
    await expect(loading.locator('.ui-user-card__skeleton')).toBeVisible();
    await page.clock.runFor(800);
    await expect(loading).not.toHaveAttribute('data-loading');
    await expect(loading.locator('.ui-user-card__details dt')).toHaveText(['Team', 'Local time']);
    await page.mouse.move(5, 5);
    await page.clock.runFor(1000);
    await page.clock.resume();

    const output = page.locator('[data-lab-output="controlled"]');
    await expect(output).toHaveText('closed');
    await page.getByRole('button', { name: "Show Kofi's card" }).click();
    const controlled = page.getByRole('dialog', { name: 'Kofi Mensah' });
    await expect(controlled).toBeVisible();
    await expect(output).toHaveText('open');
    await expect(page.locator('[data-lab-trigger="controlled"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.keyboard.press('Escape');
    await expect(controlled).toHaveCount(0);
    await expect(output).toHaveText('closed');
  });
});
