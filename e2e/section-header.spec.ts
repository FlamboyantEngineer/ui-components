import type { Locator } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, familySelector, test } from './fixtures.js';

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
    await expect(region).toHaveAttribute(
      'aria-labelledby',
      requireDefined(await heading.getAttribute('id')),
    );
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
    test(`UIC-SECTION-HEADER-1.7 frames a section with matching typography and a separate card action row in the ${theme} theme`, async ({
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
            heading: {
              title: style(title),
              description: style(description),
              gap: Math.round(descriptionBox.top - titleBox.bottom),
              headers: root.querySelectorAll('header').length,
            },
            besideText: Math.round(actionsBox.top) === Math.round(titleBox.top),
            actionsBelow: actionsBox.top >= descriptionBox.bottom + 8 - 0.5,
          };
        });
      const section = await metrics('section 420');
      const card = await metrics('card 420');
      expect(card.heading).toEqual(section.heading);
      expect(card.heading.headers).toBe(1);
      expect(card.heading.gap).toBe(4);
      expect(section.besideText).toBe(true);
      expect(section.actionsBelow).toBe(false);
      expect(card.besideText).toBe(false);
      expect(card.actionsBelow).toBe(true);

      const region = page.getByRole('region', { name: 'Harbour, card 420', exact: true });
      const heading = region.getByRole('heading', { level: 3 });
      await expect(region).toHaveAttribute(
        'aria-labelledby',
        requireDefined(await heading.getAttribute('id')),
      );
      const narrow = page.locator('[data-lab-frame="card 220"]');
      expect(await narrow.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      const narrowCard = await metrics('card 220');
      expect(narrowCard.besideText).toBe(false);
      expect(narrowCard.actionsBelow).toBe(true);
      await lab.expectAccessible();
    });
  }

  test('UIC-SECTION-HEADER-2.1 steps nested headings down from the host level', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const nested = page.locator('[data-lab-nested]');
    for (const [name, level] of [
      ['Garden', 2],
      ['Orchard', 3],
      ['Apples', 4],
      ['Pears', 4],
      ['Conference', 5],
    ] as const) {
      await expect(nested.getByRole('heading', { name, level, exact: true })).toBeVisible();
    }
  });

  test('UIC-SECTION-HEADER-2.3 keeps the content while collapsibility changes', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const demo = page.locator('[data-lab-demo="collapsible-switch"]');
    const note = demo.getByRole('textbox', { name: 'Note' });
    await note.fill('Leave at the door');
    await demo.getByRole('checkbox', { name: 'Collapsible' }).check();
    const trigger = demo.getByRole('button', { name: 'Delivery notes' });
    await trigger.click();
    await expect(note).toBeHidden();
    await trigger.click();
    await expect(note).toHaveValue('Leave at the door');
    await demo.getByRole('checkbox', { name: 'Collapsible' }).uncheck();
    await expect(trigger).toHaveCount(0);
    await expect(note).toHaveValue('Leave at the door');
  });

  test('UIC-SECTION-HEADER-2.2 toggles a collapsible section by pointer and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const section = page.locator('[data-lab-collapsible="expanded 420"]');
    const trigger = section.getByRole('button', { name: 'Vineyard, expanded 420' });
    const content = section.getByText('Merlot, Syrah and Grenache.');
    await expect(section).toHaveRole('region');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();
    await section.getByRole('button', { name: 'Add city' }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await expect(section).not.toHaveAttribute('data-expanded');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(content).toBeVisible();
    await page.keyboard.press('Space');
    await expect(content).toBeHidden();

    const collapsed = page.locator('[data-lab-collapsible="collapsed 220"]');
    await expect(collapsed.getByText('Merlot, Syrah and Grenache.')).toBeHidden();
    expect(await collapsed.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await lab.expectAccessible();
  });

  test('UIC-SECTION-HEADER-1.6 spaces the content by every step of the scale', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    let previous = -1;
    for (const space of ['none', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']) {
      const section = page.locator(`[data-lab-space="${space}"]`);
      await expect(section).toHaveAttribute('data-space', space);
      const header = await box(section.locator('.ui-section-header'));
      const panel = await box(section.locator('.ui-section__panel'));
      const gap = Math.round(panel.y - (header.y + header.height));
      if (space === 'none') expect(gap).toBe(0);
      else expect(gap).toBeGreaterThan(previous);
      previous = gap;
    }
  });

  test('UIC-SECTION-HEADER-1.5 grows, fills or clips the section in a bounded host', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const contained = (name: string) => page.locator(`[data-lab-containment="${name}"]`);
    await expect(contained('grow')).toHaveAttribute('data-grow', 'true');
    expect((await box(contained('grow'))).height).toBeCloseTo(90, 0);
    await expect(contained('fill')).toHaveAttribute('data-fill', 'true');
    await expect(contained('clip')).toHaveAttribute('data-clip', 'true');
    expect(await contained('clip').evaluate((node) => getComputedStyle(node).overflow)).toBe(
      'hidden',
    );
    for (const name of ['none', 'grow', 'fill']) {
      await expect(contained(name)).not.toHaveAttribute('data-clip');
    }
  });

  test('UIC-SECTION-HEADER-2.2 follows a page that owns expansion', async ({ page, lab }) => {
    await lab.open('section-header');
    const demo = page.locator('[data-lab-demo="controlled-section"]');
    const trigger = demo.getByRole('button', { name: 'Greenhouse' });
    const content = demo.getByText('Water twice a day in summer.');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await demo.getByRole('button', { name: 'Expand from the page' }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();
    await expect(demo.locator('[data-lab-output="requests"] li')).toHaveText([
      'title: collapse',
      'page: expand',
    ]);

    const refusing = page.locator('[data-lab-demo="refusing-section"]');
    const archive = refusing.getByRole('button', { name: 'Archive' });
    await archive.click();
    await expect(archive).toHaveAttribute('aria-expanded', 'false');
    await archive.click();
    await expect(refusing.locator('[data-lab-output="requests"]')).toHaveText('2');
    await expect(archive).toHaveAttribute('aria-expanded', 'false');
  });

  test('UIC-SECTION-HEADER-2.1 levels a host heading with useHeadingLevel', async ({
    page,
    lab,
  }) => {
    await lab.open('section-header');
    const demo = page.locator('[data-lab-demo="host-headings"]');
    for (const [name, level] of [
      ['Allotment', 2],
      ['Inferred inside a level 2 section', 3],
      ['Beds', 3],
      ['Inferred inside a level 3 section', 4],
      ['Explicitly level 5', 5],
      ['Carrots', 4],
    ] as const) {
      await expect(demo.getByRole('heading', { name, level })).toBeVisible();
    }
    await lab.expectAccessible(familySelector('section-header-host-cases'));
  });
});
