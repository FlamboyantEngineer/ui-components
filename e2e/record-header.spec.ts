import { cellSelector, expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `${cellSelector(id)} .ui-record-header`;

test.describe('Record Header lab', () => {
  test('UIC-RECORD-HEADER-1.1 UIC-RECORD-HEADER-1.2 UIC-RECORD-HEADER-1.4 UIC-RECORD-HEADER-2.1 lays out the parts', async ({
    page,
    lab,
  }) => {
    await lab.open('record-header');
    const plain = page.locator(cell('parts=identity and title title=static'));
    await expect(plain.locator('.ui-record-header__label')).toHaveText('REQ-12');
    await expect(plain.getByRole('heading', { level: 3 })).toHaveText('Cooling rack for bread');
    await expect(plain.locator('.ui-record-header__status')).toHaveCount(0);
    const complete = page.locator(cell('parts=complete title=static'));
    await expect(complete.locator('.ui-record-header__meta')).toHaveText(
      '2 days ago by Maria Santos · Kitchen tools',
    );
    await expect(complete.getByRole('button', { name: 'Delete' })).toBeVisible();
    const identity = requireDefined(
      await complete.locator('.ui-record-header__identity').boundingBox(),
    );
    const title = requireDefined(await complete.locator('.ui-record-header__title').boundingBox());
    const actions = requireDefined(
      await complete.locator('.ui-record-header__actions').boundingBox(),
    );
    expect(identity.y).toBeLessThan(title.y);
    expect(actions.x).toBeGreaterThan(title.x);
  });

  test('UIC-RECORD-HEADER-1.1 copies the identifier', async ({ page, lab, baseURL }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL ?? 'http://127.0.0.1/').origin,
    });
    await lab.open('record-header');
    const demo = page.locator('[data-lab-demo="requirement"]');
    await demo.getByRole('button', { name: 'Copy REQ-42' }).click();
    await expect(demo.locator('.ui-record-header__copy')).toHaveAttribute('data-copied', 'true');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('REQ-42');
  });

  test('UIC-RECORD-HEADER-1.3 renames the title in place and moves the state', async ({
    page,
    lab,
  }) => {
    await lab.open('record-header');
    const demo = page.locator('[data-lab-demo="requirement"]');
    const heading = demo.getByRole('heading', { level: 3 });
    await expect(demo.locator('.ui-record-header')).toHaveAttribute('data-editable', 'true');
    await heading.getByRole('button', { name: /^Edit Title/ }).click();
    await page.keyboard.type('Cooling rack holds sixteen loaves');
    await page.keyboard.press('Enter');
    await expect(heading.locator('.ui-inline-edit__value')).toHaveText(
      'Cooling rack holds sixteen loaves',
    );
    await demo.getByRole('button', { name: /^Status: Open/ }).click();
    await page.getByRole('menuitem', { name: 'Done' }).click();
    await expect(demo.locator('.ui-transition-menu__badge')).toHaveText('Done');
    await demo.getByRole('button', { name: 'Edit details' }).click();
    await expect(demo.locator('[data-lab-output="log"]')).toHaveText('Last action: Edit details');
    await lab.expectAccessible();
  });

  test('UIC-RECORD-HEADER-1.3 keeps a rename with its record when the header moves on', async ({
    page,
    lab,
  }) => {
    await lab.open('record-header');
    const demo = page.locator('[data-lab-demo="requirement"]');
    const title = demo.locator('.ui-record-header__title');
    await title.getByRole('button', { name: /^Edit Title/ }).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('Rack for rye');
    await page.keyboard.press('Enter');
    await demo.getByRole('button', { name: 'Show REQ-43' }).click();
    await expect(demo.locator('.ui-record-header__label')).toHaveText('REQ-43');
    await expect(title.locator('.ui-inline-edit')).not.toHaveAttribute('data-pending');
    await expect(title.locator('.ui-inline-edit__value')).toHaveText(
      'Proofing basket lined with linen',
    );
    await demo.getByRole('button', { name: 'Show REQ-42' }).click();
    await expect(title.locator('.ui-inline-edit__value')).toHaveText('Rack for rye');
  });
});

test('UIC-RECORD-HEADER-1.3 an empty editable title shows its prompt until a title is saved', async ({
  page,
  lab,
}) => {
  await lab.open('record-header');
  const demo = page.locator('[data-lab-demo="untitled"]');
  const heading = demo.getByRole('heading', { level: 3 });
  const prompt = heading.locator('.ui-inline-edit__placeholder');
  const value = heading.locator('.ui-inline-edit__value');
  await expect(prompt).toHaveText('Name this recipe');
  await expect(value).toHaveCount(0);
  await heading.getByRole('button', { name: /^Edit Title/ }).click();
  await page.keyboard.type('Plum crumble');
  await page.keyboard.press('Enter');
  await expect(value).toHaveText('Plum crumble');
  await expect(demo.getByRole('heading', { name: 'Plum crumble', level: 3 })).toBeVisible();
  await expect(demo.locator('[data-lab-output="title"]')).toHaveText('"Plum crumble"');
  await expect(prompt).toHaveCount(0);
  await demo.getByRole('button', { name: 'Clear the title' }).click();
  await expect(prompt).toHaveText('Name this recipe');
  await expect(demo.locator('[data-lab-output="title"]')).toHaveText('""');
  await lab.expectAccessible('[data-lab-demo="untitled"]');
});
