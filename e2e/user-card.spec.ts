import { expect, test, matrixCell } from './fixtures.js';

test.describe('User Card lab', () => {
  test('UIC-USER-CARD-1.1 UIC-USER-CARD-1.2 UIC-USER-CARD-1.5 draws every part within the card width', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card');
    await expect(page.locator('.ui-user-card:focus, .ui-user-card :focus')).toHaveCount(0);
    const full = matrixCell(page, 'content=details and actions avatar=picture');
    const card = full.getByRole('dialog', { name: 'Maria Santos' });
    await expect(card.locator('.ui-user-identity__description')).toHaveText('maria@example.com');
    await expect(card.locator('.ui-user-card__status-label')).toHaveText('Away until 14:00');
    await expect(card.locator('.ui-user-card__details dt')).toHaveText(['Team', 'Local time']);
    await expect(card.getByRole('button')).toHaveText(['Message', 'View profile']);
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(200);
    expect(box?.width).toBeLessThanOrEqual(280);
    const minimal = matrixCell(page, 'content=name only avatar=group');
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

  test('UIC-USER-CARD-1.7 draws a loading card as a busy skeleton', async ({ page, lab }) => {
    await lab.open('user-card');
    const skeleton = page.locator(
      '[data-lab-cell="content=loading avatar=initials"] .ui-user-card',
    );
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
    await expect(skeleton.locator('.ui-user-card__skeleton')).toBeVisible();
    await expect(skeleton.locator('.ui-user-card__status')).toHaveCount(0);
  });
});
