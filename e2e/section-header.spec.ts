import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

test.describe('Section Header lab', () => {
  test('UIC-SECTION-HEADER-1.1 UIC-SECTION-HEADER-1.6 keeps actions beside the text and wraps them in a narrow column', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const wide = page.locator('[data-lab-section-header="description and actions 420"]');
    const content = await box(wide.locator('.ui-section-header__content'));
    const actions = await box(wide.locator('.ui-section-header__actions'));
    expect(actions.y).toBe(content.y);
    expect(actions.x).toBeGreaterThanOrEqual(content.x + content.width + 16);

    const narrow = page.locator('[data-lab-section-header="description and actions 220"]');
    const narrowContent = await box(narrow.locator('.ui-section-header__content'));
    const narrowActions = await box(narrow.locator('.ui-section-header__actions'));
    expect(Math.round(narrowActions.y - (narrowContent.y + narrowContent.height))).toBe(8);
    expect(await narrow.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);

    const title = page.locator('[data-lab-section-header="title 420"]');
    await expect(title.locator('.ui-section-header__description')).toHaveCount(0);
    await expect(title.locator('.ui-section-header__actions')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-SECTION-HEADER-1.3 names each section by its title only', async ({ page, lab }) => {
    await lab.open('section-header');
    const region = page.getByRole('region', { name: 'Meadow, 2xl gap', exact: true });
    await expect(region).toBeVisible();
    const heading = region.getByRole('heading', { name: 'Meadow, 2xl gap' });
    await expect(region).toHaveAttribute('aria-labelledby', (await heading.getAttribute('id'))!);
    const header = await box(region.locator('.ui-section-header'));
    const body = await box(region.locator('p'));
    expect(Math.round(body.y - (header.y + header.height))).toBe(16);
  });

  test('UIC-SECTION-HEADER-1.4 keeps content and actions working across updates', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const notes = page.getByRole('textbox', { name: 'Notes' });
    await notes.fill('Kyoto in autumn');
    await page.getByRole('button', { name: 'Add city' }).last().click();
    const region = page.getByRole('region', { name: 'Cities (4)' });
    await expect(region).toBeVisible();
    await expect(notes).toHaveValue('Kyoto in autumn');
    await page.keyboard.press('Tab');
    await expect(region.getByRole('button', { name: 'Hide description' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(region.locator('.ui-section-header__description')).toHaveCount(0);
    await expect(notes).toHaveValue('Kyoto in autumn');
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-SECTION-HEADER-1.7 frames a section as a card with the same header and name in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('section-header', { theme });
      const metrics = (frame: string) =>
        page.locator(`[data-lab-frame="${frame}"]`).evaluate((root) => {
          const title = root.querySelector('h3') as HTMLElement;
          const description = title.nextElementSibling as HTMLElement;
          const actions = title.closest('header')?.lastElementChild as HTMLElement;
          const style = (node: HTMLElement) => {
            const { fontSize, fontWeight, lineHeight, color } = getComputedStyle(node);
            return { fontSize, fontWeight, lineHeight, color };
          };
          const titleBox = title.getBoundingClientRect();
          const descriptionBox = description.getBoundingClientRect();
          const actionsBox = actions.getBoundingClientRect();
          return {
            title: style(title),
            description: style(description),
            gap: Math.round(descriptionBox.top - titleBox.bottom),
            besideText: Math.round(actionsBox.top) === Math.round(titleBox.top),
            headers: root.querySelectorAll('header').length,
          };
        });
      const section = await metrics('section 420');
      const card = await metrics('card 420');
      expect(card).toEqual(section);
      expect(card.headers).toBe(1);
      expect(card.gap).toBe(4);
      expect(card.besideText).toBe(true);

      const region = page.getByRole('region', { name: 'Harbour, card 420', exact: true });
      const heading = region.getByRole('heading', { level: 3 });
      await expect(region).toHaveAttribute('aria-labelledby', (await heading.getAttribute('id'))!);
      const narrow = page.locator('[data-lab-frame="card 220"]');
      expect(await narrow.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect((await metrics('card 220')).besideText).toBe(false);
      await lab.expectAccessible();
    });
  }
});
