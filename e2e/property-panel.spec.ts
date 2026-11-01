import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function cell(page: Page, id: string): Locator {
  return matrixCell(page, id);
}

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no box');
  return result;
}

test.describe('Property Panel lab', () => {
  test('UIC-PROPERTY-PANEL-1.1 UIC-PROPERTY-PANEL-1.2 UIC-PROPERTY-PANEL-3.1 puts labels on a column or stacks them in a narrow responsive panel', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    await expect(page.getByRole('region', { name: 'Rows plain responsive wide' })).toBeVisible();

    const wide = cell(page, 'row=plain layout=responsive width=wide');
    const wideLabel = await box(wide.locator('.ui-property-row__label'));
    const wideControl = await box(wide.locator('.ui-property-row__control'));
    // The label column is as wide as the label, so the control follows it after the gap.
    expect(wideLabel.width).toBeLessThan(60);
    expect(Math.round(wideControl.x - (wideLabel.x + wideLabel.width))).toBe(8);

    const stacked = cell(page, 'row=plain layout=responsive width=narrow');
    const stackedLabel = await box(stacked.locator('.ui-property-row__label'));
    const stackedControl = await box(stacked.locator('.ui-property-row__control'));
    expect(stackedControl.y).toBeGreaterThanOrEqual(stackedLabel.y + stackedLabel.height - 1);
    expect(Math.round(stackedControl.x)).toBe(Math.round(stackedLabel.x));

    const inline = cell(page, 'row=plain layout=inline width=narrow');
    const inlineLabel = await box(inline.locator('.ui-property-row__label'));
    const inlineControl = await box(inline.locator('.ui-property-row__control'));
    expect(inlineControl.x).toBeGreaterThan(inlineLabel.x + inlineLabel.width);

    const units = cell(page, 'row=unit and hint layout=responsive width=wide');
    const unit = await box(units.locator('.ui-property-row__unit'));
    const hint = await box(units.locator('.ui-property-row__hint'));
    expect(hint.y).toBeGreaterThan(unit.y);
  });

  test('UIC-PROPERTY-PANEL-3.2 UIC-PROPERTY-PANEL-3.3 focuses the control from its label and lays a wide row out over the full width', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const plain = cell(page, 'row=plain layout=inline width=wide');
    await plain.locator('label.ui-property-row__label').click();
    await expect(plain.getByRole('textbox', { name: 'Width' })).toBeFocused();

    const wide = cell(page, 'row=wide layout=inline width=wide');
    const label = await box(wide.locator('.ui-property-row__label'));
    const control = await box(wide.locator('.ui-property-row__control'));
    expect(control.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
    expect(Math.round(control.x)).toBe(Math.round(label.x));
    expect(control.width).toBeGreaterThan(300);
    await expect(wide.locator('.ui-property-row')).toHaveAttribute('data-wide', 'true');
  });

  test('UIC-PROPERTY-PANEL-2.1 UIC-PROPERTY-PANEL-2.3 toggles a section from the keyboard, not from its actions', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const section = cell(page, 'section=actions layout=responsive');
    const trigger = section.getByRole('button', { name: /^Colours/ });
    const content = section.locator('.ui-property-section__content');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(section.getByRole('button', { name: /^Add colour/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await section.getByRole('button', { name: /^Add colour/ }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await lab.expectAccessible();
  });

  test('UIC-PROPERTY-PANEL-2.4 remembers a section across reloads', async ({ page, lab }) => {
    await lab.open('property-panel');
    const remembered = page.locator('[data-lab-remembered]');
    const trigger = remembered.getByRole('button', { name: /^Print/ });
    await expect(remembered.getByRole('heading', { level: 2, name: /^Print/ })).toBeVisible();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(
      page.locator('[data-lab-remembered]').getByRole('button', { name: /^Print/ }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  test('UIC-PROPERTY-PANEL-2.6 opens a card and keeps its action outside the trigger', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const card = cell(page, 'card=actions layout=inline');
    const trigger = card.getByRole('button', { name: 'Heading', exact: true });
    await card.getByRole('button', { name: /^Reset heading/ }).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(card.getByRole('textbox', { name: 'Font' })).toBeVisible();
  });

  test('UIC-PROPERTY-PANEL-3.6 frames separate buttons one by one and a segmented run once', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const separate = cell(page, 'variant=separate layout=inline').locator(
      '.ui-property-icon-group',
    );
    const segmented = cell(page, 'variant=segmented layout=inline').locator(
      '.ui-property-icon-group',
    );
    const borderOf = (locator: Locator) =>
      locator.evaluate((element) => getComputedStyle(element).borderTopWidth);
    expect(await borderOf(separate)).toBe('0px');
    expect(await borderOf(segmented)).toBe('1px');
    expect(await borderOf(separate.locator('button').first())).toBe('1px');
    await expect(segmented).toHaveAttribute('role', 'group');
  });

  test('UIC-PROPERTY-PANEL-1.4 opens sections one at a time or all together', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const accordion = page.locator('[data-lab-grouped="accordion"]');
    const trigger = (area: Locator, title: string) =>
      area.getByRole('button', { name: new RegExp(`^${title}`) });
    await expect(trigger(accordion, 'Page')).toHaveAttribute('aria-expanded', 'true');
    await trigger(accordion, 'Text').click();
    await expect(trigger(accordion, 'Text')).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(accordion, 'Page')).toHaveAttribute('aria-expanded', 'false');
    await expect(accordion.getByRole('textbox', { name: 'Paper size' })).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(accordion.locator('[data-lab-output]')).toHaveText('Open: none');

    const all = page.locator('[data-lab-grouped="all"]');
    await all.getByRole('button', { name: 'Expand all' }).click();
    for (const title of ['Page', 'Text', 'Print']) {
      await expect(trigger(all, title)).toHaveAttribute('aria-expanded', 'true');
    }
    await all.getByRole('button', { name: 'Collapse all' }).click();
    await expect(all.locator('.ui-property-section[data-expanded]')).toHaveCount(0);
    await expect(all.locator('[data-lab-output]')).toHaveText('Open: none');
    await lab.expectAccessible('[data-lab-grouped="all"]');
  });

  test('UIC-PROPERTY-PANEL-1.4 keeps a draft when the panel switches to and from an accordion', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const area = page.locator('[data-lab-switching]');
    const title = area.getByRole('textbox', { name: 'Title' });
    await title.fill('Draft title');
    const accordion = area.getByRole('switch', { name: 'Accordion' });
    await accordion.focus();
    await page.keyboard.press('Space');
    await expect(accordion).toBeChecked();
    await expect(title).toHaveValue('Draft title');
    await area.getByRole('button', { name: /^Text/ }).click();
    await expect(area.getByRole('button', { name: /^Page/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await accordion.focus();
    await page.keyboard.press('Space');
    await expect(accordion).not.toBeChecked();
    await expect(area.getByRole('button', { name: /^Page/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(title).toHaveValue('Draft title');
    await lab.expectAccessible('[data-lab-switching]');
  });

  test('UIC-PROPERTY-PANEL-2.8 reveals and focuses an invalid field that a query and a closed section hide', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const form = page.locator('[data-lab-revealing]');
    const title = form.getByRole('textbox', { name: /^Title/ });
    await expect(title).toBeHidden();
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(title).toBeVisible();
    await expect(title).toBeFocused();
    await expect(form.getByRole('searchbox')).toHaveValue('');
    await expect(form.getByRole('button', { name: /^Page/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(form.locator('[data-lab-output]')).toHaveText('Not saved');
    await title.fill('Report');
    // Enter submits from the field; a click would land after its error leaves, moving the button.
    await title.press('Enter');
    await expect(form.locator('[data-lab-output]')).toHaveText('Saved');
    await lab.expectAccessible('[data-lab-revealing]');
  });

  test('UIC-PROPERTY-PANEL-1.5 locks every field of a disabled or read-only panel', async ({
    page,
    lab,
  }) => {
    await lab.open('property-panel');
    const disabled = matrixCell(page, 'lock=disabled');
    await expect(disabled.locator('.ui-property-panel')).toHaveAttribute('data-disabled', 'true');
    await expect(disabled.getByRole('textbox', { name: 'Width' })).toBeDisabled();
    const readOnly = matrixCell(page, 'lock=read-only');
    const height = readOnly.getByRole('textbox', { name: 'Height' });
    await expect(height).toHaveAttribute('readonly', '');
    await height.focus();
    await page.keyboard.type('9');
    await expect(height).toHaveValue('200');
    const frame = readOnly.getByRole('button', { name: /^Frame/ });
    await frame.click();
    await expect(frame).toHaveAttribute('aria-expanded', 'false');
    const editable = matrixCell(page, 'lock=editable').getByRole('textbox', {
      name: 'Width',
    });
    await expect(editable).toBeEditable();
    await lab.expectAccessible();
  });
});

test('UIC-PROPERTY-PANEL-3.1 sizes the label column to the longest label and lines the controls up', async ({
  page,
  lab,
}) => {
  await lab.open('property-filter');
  // The second filtered panel is wide enough to keep its labels beside the controls.
  const section = page
    .locator('.ui-property-panel:has(.ui-property-section .ui-property-row)')
    .nth(1)
    .locator('.ui-property-section__content:has(.ui-property-row)')
    .first();
  await section.scrollIntoViewIfNeeded();
  const rows = await section.locator('.ui-property-row').evaluateAll((nodes) =>
    nodes.map((row) => {
      const label = row.querySelector('.ui-property-row__label');
      const control = row.querySelector('.ui-property-row__control');
      if (!label || !control) throw new Error('A row has no label or control.');
      const range = document.createRange();
      range.selectNodeContents(label);
      return {
        text: range.getBoundingClientRect().right,
        control: control.getBoundingClientRect().left,
      };
    }),
  );
  expect(rows.length).toBeGreaterThan(1);
  const starts = rows.map((row) => Math.round(row.control));
  expect(new Set(starts).size).toBe(1);
  // The longest label ends 8 pixels before the controls; none sits farther than its own width away.
  const longest = Math.max(...rows.map((row) => row.text));
  expect(Math.round((starts[0] ?? 0) - longest)).toBe(8);
});

test('UIC-PROPERTY-PANEL-2.2 draws the section count quieter than the title', async ({
  page,
  lab,
}) => {
  await lab.open('property-filter');
  const count = page.locator('.ui-property-section__count').first();
  const title = page.locator('.ui-property-section__title').first();
  const style = (locator: Locator) =>
    locator.evaluate((node) => {
      const computed = getComputedStyle(node);
      return { color: computed.color, weight: computed.fontWeight, fill: computed.backgroundColor };
    });
  const [badge, heading] = [await style(count), await style(title)];
  expect(Number(badge.weight)).toBeLessThan(Number(heading.weight));
  expect(badge.color).not.toBe(heading.color);
  const muted = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ref-muted)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(badge.color).toBe(muted);
});
