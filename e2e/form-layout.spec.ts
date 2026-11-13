import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-demo="designer"]');
const canvas = (page: Page) => demo(page).locator('.ui-form-layout-designer__canvas');
const node = (page: Page, name: string) => canvas(page).getByRole('group', { name, exact: true });
const handle = (page: Page, id: string) =>
  canvas(page).locator(
    `[data-key="${id}"] > .ui-form-layout-designer__header > .ui-form-layout-designer__handle`,
  );

/** The ids of the canvas's nodes in document order. */
async function order(page: Page): Promise<string[]> {
  return canvas(page)
    .locator('.ui-form-layout-designer__node')
    .evaluateAll((nodes) => nodes.map((element) => (element as HTMLElement).dataset.key ?? ''));
}

/** Drags from `from`'s centre to a point in `to`, `fraction` of the way down. */
async function dragTo(page: Page, from: Locator, to: Locator, fraction: number) {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Nothing to drag');
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 5, start.y + start.height / 2 + 5, {
    steps: 4,
  });
  await page.mouse.move(end.x + end.width / 2, end.y + end.height * fraction, { steps: 12 });
  await page.mouse.up();
}

test.describe('Form Layout lab', () => {
  // A drag reaches only what the viewport shows: fit the designer's sources and targets in it.
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1600 });
  });

  test('UIC-FORM-LAYOUT-2.1 UIC-FORM-LAYOUT-3.1 draws the designer and the rendered form', async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    await expect(demo(page).getByRole('group', { name: 'Add to form' })).toBeVisible();
    await expect(node(page, 'Contact')).toBeVisible();
    const form = page.getByRole('form', { name: 'Rendered form' });
    const options = form.locator('[data-key="options"] .ui-form-layout__children');
    await expect(options).toHaveAttribute('data-arrangement', 'grid');
    const boxes = await options
      .locator(':scope > .ui-form-layout__node')
      .evaluateAll((nodes) => nodes.map((element) => element.getBoundingClientRect().top));
    // Two grid columns: both toggles share a row.
    expect(boxes[0]).toBe(boxes[1]);
    await expect(
      matrixCell(page, 'state=empty').locator('.ui-form-layout-designer__canvas'),
    ).toHaveAttribute('data-empty', 'true');
    await lab.expectAccessible();
  });

  test('UIC-FORM-LAYOUT-3.3 moves, removes and announces with the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    const status = demo(page).locator('.ui-form-layout-designer__status');
    await node(page, 'Contact').focus();
    await page.keyboard.press('ArrowDown');
    await expect(node(page, 'Full name')).toBeFocused();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(status).toHaveText('Full name moved to Place, position 1');
    await expect(node(page, 'Full name')).toBeFocused();
    expect(await order(page)).toEqual([
      'contact',
      'place',
      'name',
      'city',
      'zip',
      'prefs',
      'options',
      'news',
      'sms',
      'terms',
    ]);
    await page.keyboard.press('Delete');
    await expect(status).toHaveText('Full name removed');
    await expect(node(page, 'City')).toBeFocused();
    await expect(
      page.getByRole('form', { name: 'Rendered form' }).getByRole('textbox', { name: 'Full name' }),
    ).toHaveCount(0);
  });

  test("UIC-FORM-LAYOUT-3.4 places a drop on a row node's right half before it, right to left", async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    const rtl = page.locator('[data-lab-demo="rtl"]');
    const rtlNode = (name: string) => rtl.getByRole('group', { name, exact: true });
    const city = rtlNode('City');
    await rtl.scrollIntoViewIfNeeded();
    const from = await rtl
      .locator(
        '[data-key="zip"] > .ui-form-layout-designer__header > .ui-form-layout-designer__handle',
      )
      .boundingBox();
    const to = await city.boundingBox();
    if (!from || !to) throw new Error('Nothing to drag');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 - 5, from.y + from.height / 2 + 5, { steps: 4 });
    // The right quarter of City: before it in a right-to-left row.
    await page.mouse.move(to.x + to.width * 0.75, to.y + to.height / 2, { steps: 12 });
    await expect(city).toHaveAttribute('data-position', 'before');
    await page.mouse.up();
    await expect
      .poll(() =>
        rtl
          .locator('.ui-form-layout-designer__node')
          .evaluateAll((nodes) => nodes.map((element) => (element as HTMLElement).dataset.key)),
      )
      .toEqual(['contact', 'name', 'place', 'zip', 'city']);
  });

  test('UIC-FORM-LAYOUT-3.4 drags nodes by their handles and refuses forbidden drops', async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    // Below City, inside the row: City and Postcode swap.
    await dragTo(page, handle(page, 'zip'), node(page, 'City'), 0.5);
    await expect
      .poll(() => order(page))
      .toEqual([
        'contact',
        'name',
        'place',
        'zip',
        'city',
        'prefs',
        'options',
        'news',
        'sms',
        'terms',
      ]);
    // A section never goes inside a section: the drop is refused and nothing changes.
    await dragTo(page, handle(page, 'prefs'), node(page, 'Full name'), 0.9);
    await expect(demo(page).locator('[data-lab-output="Last change"]')).toContainText('"zip"');
    expect((await order(page))[0]).toBe('contact');
    // Pressing and dragging in a preview field never moves its node.
    await dragTo(
      page,
      node(page, 'City').getByRole('textbox', { name: 'City' }),
      node(page, 'Contact'),
      0.1,
    );
    await expect
      .poll(() => order(page))
      .toEqual([
        'contact',
        'name',
        'place',
        'zip',
        'city',
        'prefs',
        'options',
        'news',
        'sms',
        'terms',
      ]);
  });

  test('UIC-FORM-LAYOUT-3.5 adds from the palette by press and by drag, and edits in the inspector', async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    await node(page, 'Place')
      .locator(':scope > .ui-form-layout-designer__header > .ui-form-layout-designer__title')
      .click();
    await demo(page).getByRole('button', { name: 'Text field' }).click();
    await expect(node(page, 'New text')).toBeFocused();
    expect(await order(page)).toEqual([
      'contact',
      'name',
      'place',
      'city',
      'zip',
      'text-1',
      'prefs',
      'options',
      'news',
      'sms',
      'terms',
    ]);
    const label = demo(page).getByRole('textbox', { name: 'Label' });
    await label.fill('Region');
    await expect(node(page, 'Region')).toBeVisible();
    await expect(
      page.getByRole('form', { name: 'Rendered form' }).getByRole('textbox', { name: 'Region' }),
    ).toBeVisible();
    // Dragging a palette entry onto the end of the Preferences section adds it there.
    await dragTo(
      page,
      demo(page).getByRole('button', { name: 'Toggle', exact: true }),
      node(page, 'Preferences').locator(
        ':scope > .ui-form-layout-designer__body > .ui-form-layout-designer__children > .ui-form-layout-designer__slot',
      ),
      0.5,
    );
    await expect.poll(() => order(page)).toContain('toggle-2');
    expect((await order(page)).at(-1)).toBe('toggle-2');
  });

  test('UIC-FORM-LAYOUT-2.2 submits the rendered form with Form validation', async ({
    page,
    lab,
  }) => {
    await lab.open('form-layout');
    const form = page.getByRole('form', { name: 'Rendered form' });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.getByRole('textbox', { name: 'Full name' })).toBeFocused();
    await expect(demo(page).locator('[data-lab-output="Submitted"]')).toBeEmpty();
    await page.keyboard.type('Ada');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(demo(page).locator('[data-lab-output="Submitted"]')).toContainText('"name":"Ada"');
  });
});
