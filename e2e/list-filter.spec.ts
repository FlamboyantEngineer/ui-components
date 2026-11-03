import { expect, test } from './fixtures.js';

test('UIC-LIST-FILTER-1.1 UIC-LIST-FILTER-1.2 UIC-LIST-FILTER-1.3 keyboard selection and actions keep independent focus and counts', async ({
  page,
  lab,
}) => {
  await lab.open('list-filter');
  const demo = page.locator('[data-lab-filter="Header"]');
  const unread = demo.getByRole('radio', { name: 'Unread, 7' });
  await unread.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(demo.getByRole('radio', { name: 'All, 7' })).toBeChecked();
  await expect(demo.getByRole('status')).toHaveText('all');
  await page.keyboard.press('Tab');
  const action = demo.getByRole('button', { name: 'Mark all read' });
  await expect(action).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(demo.getByRole('radio', { name: 'All, 0' })).toBeChecked();
  await expect(demo.getByRole('radio', { name: 'Mentions, 0' })).toBeVisible();
  await expect(action).toBeFocused();
  await demo.getByRole('button', { name: 'More', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Export list' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('UIC-LIST-FILTER-1.4 rejects a change with host feedback and restores the previous controlled filter', async ({
  page,
  lab,
}) => {
  await lab.open('list-filter');
  const demo = page.locator('[data-lab-filter="Header"]');
  await demo.getByLabel('Reject next change').check();
  await demo.getByRole('radio', { name: 'All, 7' }).click();
  await expect(demo.getByRole('alert')).toHaveText('Change unavailable. Try again.');
  await expect(demo.getByRole('radio', { name: 'Unread, 7' })).toBeChecked();
  await expect(demo.getByRole('radiogroup')).not.toHaveAttribute('data-pending');
});

test('UIC-LIST-FILTER-1.5 follows content, counts, fonts and size without host measurements and honors reduced motion', async ({
  page,
  lab,
}) => {
  await lab.open('list-filter');
  const demo = page.locator('[data-lab-filter="Header"]');
  const group = demo.getByRole('radiogroup');
  const selected = group.locator('[aria-checked="true"]');
  const indicator = selected.locator('.ui-segmented-choice__indicator');
  const expectIndicator = async () => {
    await expect(async () => {
      const button = await selected.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const left = parseFloat(style.borderLeftWidth);
        const right = parseFloat(style.borderRightWidth);
        const top = parseFloat(style.borderTopWidth);
        const bottom = parseFloat(style.borderBottomWidth);
        return {
          x: box.x + left,
          width: box.width - left - right,
          height: box.height - top - bottom,
        };
      });
      const thumb = await indicator.boundingBox();
      expect(button).not.toBeNull();
      expect(thumb?.x).toBeCloseTo(button?.x ?? 0, 0);
      expect(thumb?.width).toBeCloseTo(button?.width ?? 0, 0);
      expect(thumb?.height).toBeCloseTo(button?.height ?? 0, 0);
    }).toPass();
  };
  await expectIndicator();
  await demo.getByRole('button', { name: 'Change counts' }).click();
  await expect(
    group.getByRole('radio', { name: 'Unread, 128' }).locator('.ui-segmented-choice__count'),
  ).toHaveText('99+');
  await expectIndicator();
  await group.evaluate((element) => {
    element.setAttribute('data-size', 'lg');
    element.style.fontFamily = 'monospace';
    element.querySelector<HTMLElement>('.ui-segmented-choice__label')?.append(' updated');
  });
  await page.evaluate(() => document.fonts.ready);
  await expectIndicator();
  await group.getByRole('radio', { name: 'All, 128' }).click();
  await expectIndicator();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(indicator).toHaveCSS('transition-duration', '0s');
});

test('UIC-LIST-FILTER-1.5 keeps narrow and RTL rows bounded with focus revealing clipped filters', async ({
  page,
  lab,
}) => {
  await lab.open('list-filter');
  const demo = page.locator('[data-lab-demo="narrow-filter"]');
  const row = demo.locator('.ui-list-filter');
  const action = demo.getByRole('button', { name: 'Mark all read' });
  const radio = demo.getByRole('radio', { name: 'Mentions, 0' });
  await radio.focus();
  await expect(radio).toBeInViewport();
  await expect(async () => {
    const outer = await row.boundingBox();
    const button = await action.boundingBox();
    expect((button?.x ?? 0) + (button?.width ?? 0)).toBeLessThanOrEqual(
      (outer?.x ?? 0) + (outer?.width ?? 0),
    );
    const bounds = await row.evaluate((element) => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
    }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.client);
  }).toPass();
  const rtl = page.locator('[data-lab-filter="RTL"]');
  await rtl.getByRole('radio').first().focus();
  await page.keyboard.press('ArrowLeft');
  await expect(rtl.getByRole('radio').nth(1)).toBeFocused();
});

test('UIC-LIST-FILTER-1.1 UIC-LIST-FILTER-1.3 works below DockPanel tabs for notifications and comments', async ({
  page,
  lab,
}) => {
  await lab.open('dock-panel');
  const dock = page.locator('[data-lab-demo="filter-dock"]');
  await dock.getByRole('button', { name: 'Mark all read' }).click();
  await expect(dock.getByRole('radio', { name: 'Unread, 0' })).toBeChecked();
  await dock.getByRole('tab', { name: /Comments/ }).click();
  await expect(dock.getByRole('radiogroup', { name: 'Comments filters' })).toBeVisible();
});

test('UIC-LIST-FILTER-1.5 bounds a long action list in its overflow menu without changing selection', async ({
  page,
  lab,
}) => {
  await lab.open('list-filter');
  const demo = page.locator('[data-lab-demo="many-filter-actions"]');
  const row = demo.locator('.ui-list-filter');
  await expect(async () => {
    expect(await row.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }).toPass();
  await demo.getByRole('button', { name: /more/i }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(demo.getByRole('radio', { name: 'All, 7' })).toBeChecked();
});
