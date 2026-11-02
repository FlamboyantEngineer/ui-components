import { expect, matrixCell, test } from './fixtures.js';

test.describe('User Identity lab avatar options and badges', () => {
  test('UIC-USER-IDENTITY-1.4 passes initials, shapes, colours and image props to the avatar', async ({
    page,
    lab,
  }) => {
    await lab.open('user-identity');
    for (const shape of ['circle', 'rounded', 'square']) {
      const avatar = matrixCell(page, `option=initials shape=${shape}`).locator('.ui-avatar');
      await expect(avatar).toHaveAttribute('data-shape', shape);
      await expect(avatar.locator('.ui-avatar__initials')).toHaveText('MF');
    }
    await expect(
      matrixCell(page, 'option=color\\ slot shape=circle').locator('.ui-avatar'),
    ).toHaveAttribute('data-color', '4');
    const image = matrixCell(page, 'option=image\\ props shape=circle').locator(
      '.ui-avatar__image',
    );
    await expect(image).toHaveAttribute('srcset', /1x, .* 2x$/);
    await expect(image).toHaveAttribute('loading', 'lazy');
  });

  test('UIC-USER-IDENTITY-1.4 keeps a keyed colour across renames and options across a fallback', async ({
    page,
    lab,
  }) => {
    await lab.open('user-identity');
    const demo = page.locator('[data-lab-demo="stable-identity"]');
    const avatars = demo.locator('.ui-avatar');
    const keyed = await avatars.nth(0).getAttribute('data-color');
    const named = await avatars.nth(1).getAttribute('data-color');
    await demo.getByRole('textbox', { name: 'Display name' }).fill('Maria Fernanda');
    await expect(avatars.nth(0)).toHaveAttribute('data-color', keyed ?? '');
    await expect
      .poll(async () => [named, await avatars.nth(1).getAttribute('data-color')])
      .not.toEqual([named, named]);
    await demo.getByRole('button', { name: 'Break the optioned picture' }).click();
    const fallback = demo.locator('[data-lab-identity="options-fallback"] .ui-avatar');
    await expect(fallback.locator('.ui-avatar__initials')).toHaveText('MF');
    await expect(fallback).toHaveAttribute('data-shape', 'square');
    await expect(fallback).toHaveAttribute('data-color', '4');
  });

  test('UIC-USER-IDENTITY-1.8 places labelled and decorative badges beside the status', async ({
    page,
    lab,
  }) => {
    await lab.open('user-identity');
    const labelled = matrixCell(page, 'badge=labelled status=none placement=top-start');
    await expect(labelled.locator('.ui-avatar__badge')).toHaveAttribute(
      'data-placement',
      'top-start',
    );
    await expect(labelled.getByRole('img', { name: 'France' })).toHaveCount(1);
    const decorative = matrixCell(page, 'badge=decorative status=none placement=top-start');
    await expect(decorative.locator('.ui-user-identity__badge-label')).toHaveCount(0);
    const moved = matrixCell(page, 'badge=labelled status=busy placement=bottom-end');
    await expect(moved.locator('.ui-avatar__badge')).toHaveAttribute('data-placement', 'top-end');
  });
});
