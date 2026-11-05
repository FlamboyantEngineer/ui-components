import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

function inspector(page: Page) {
  return page.getByRole('region', { name: 'Inspector', exact: true });
}

function frame(page: Page, name: string) {
  return page.locator(`[data-lab-frame="${name}"]`);
}

/** Scrolls the separator into view and presses its middle, holding the button. */
async function press(page: Page, separator: Locator) {
  await separator.scrollIntoViewIfNeeded();
  const rect = await box(separator);
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { x, y };
}

test.describe('Dock Panel lab', () => {
  test('UIC-DOCK-PANEL-1.1 UIC-DOCK-PANEL-1.2 UIC-DOCK-PANEL-1.3 lays out every edge and state from the reference sheet', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    for (const position of ['start', 'end', 'bottom']) {
      const expanded = matrixCell(page, `position=${position} state=expanded`);
      const panel = expanded.locator('.ui-dock-panel');
      await expect(panel).toHaveCSS('flex-direction', 'column');
      const strip = panel.locator('.ui-dock-panel__strip');
      const toggle = panel.getByRole('button', { name: /^Collapse/ });
      // The toggle sits beside the strip, outside it, on the same row.
      const stripBox = await box(strip);
      const toggleBox = await box(toggle);
      expect(toggleBox.x).toBeGreaterThanOrEqual(stripBox.x + stripBox.width - 1);
      expect(
        Math.abs(toggleBox.y + toggleBox.height / 2 - (stripBox.y + stripBox.height / 2)),
      ).toBeLessThan(2);
      expect(
        await strip.evaluate(
          (node, toggleNode) => node.contains(toggleNode),
          await toggle.elementHandle(),
        ),
      ).toBe(false);

      const collapsed = matrixCell(page, `position=${position} state=collapsed`);
      const rail = collapsed.locator('.ui-dock-panel');
      await expect(rail).toHaveCSS('flex-direction', 'column');
      const railBox = await box(rail);
      expect(Math.round(position === 'bottom' ? railBox.height : railBox.width)).toBe(40);
      const expand = rail.getByRole('button', { name: /^Expand/ });
      const launcher = rail.getByRole('button', { name: /^Outline/ });
      const expandBox = await box(expand);
      const launcherBox = await box(launcher);
      if (position === 'bottom') {
        expect(expandBox.x + expandBox.width).toBeLessThanOrEqual(launcherBox.x + 1);
        await expect(launcher).toHaveCSS('writing-mode', 'horizontal-tb');
      } else {
        expect(expandBox.y + expandBox.height).toBeLessThanOrEqual(launcherBox.y + 1);
        await expect(launcher).toHaveCSS('writing-mode', 'vertical-rl');
        // Read bottom to top: the icon sits below the label, upright.
        const icon = await box(launcher.locator('.ui-dock-panel__launcher-icon'));
        const label = await box(launcher.locator('.ui-dock-panel__launcher-label'));
        expect(icon.y).toBeGreaterThan(label.y);
        await expect(launcher.locator('.ui-dock-panel__launcher-icon')).toHaveCSS(
          'writing-mode',
          'horizontal-tb',
        );
        await expect(launcher).not.toHaveAttribute('aria-hidden');
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-DOCK-PANEL-1.2 UIC-DOCK-PANEL-1.3 caps counts at 9+ and keeps the full count accessible', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const expanded = matrixCell(page, 'position=end state=expanded');
    const activity = expanded.getByRole('tab', { name: /Activity/ });
    await expect(activity).toContainText('9+');
    await expect(activity).toHaveAccessibleDescription('128 items');
    const collapsed = matrixCell(page, 'position=end state=collapsed');
    const launcher = collapsed.getByRole('button', { name: 'Activity (End collapsed)' });
    await expect(launcher.locator('.ui-dock-panel__count')).toHaveText('9+');
    await expect(launcher).toHaveAccessibleDescription('128 items');
    await expect(
      collapsed.getByRole('button', { name: 'People (End collapsed)' }),
    ).toHaveAccessibleDescription('3 items');
  });

  test('UIC-DOCK-PANEL-2.2 UIC-DOCK-PANEL-2.3 UIC-DOCK-PANEL-2.4 switches by keyboard, collapses and expands with focus following', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    const properties = panel.getByRole('tab', { name: 'Properties', exact: true });
    await properties.focus();
    await page.keyboard.press('ArrowRight');
    const search = panel.getByRole('tab', { name: 'Search', exact: true });
    await expect(search).toHaveAttribute('aria-selected', 'true');
    await page.locator('[data-lab-input="search"]').fill('Quarterly');
    await search.focus();
    await page.keyboard.press('End');
    await expect(panel.getByRole('tab', { selected: true })).toContainText('Activity');
    await page.keyboard.press('Home');
    await expect(properties).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    const toggle = panel.getByRole('button', { name: 'Collapse Inspector' });
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel).not.toHaveAttribute('data-expanded');
    await expect(panel.getByRole('button', { name: 'Expand Inspector' })).toBeFocused();
    await page.keyboard.press('Tab');
    const launchers = panel.getByRole('toolbar', { name: 'Inspector panes' });
    await expect(launchers.getByRole('button', { name: 'Properties' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(launchers.getByRole('button', { name: 'Search' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(launchers.getByRole('button', { name: 'Activity' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(launchers.getByRole('button', { name: 'Properties' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    await expect(search).toBeFocused();
    await expect(page.locator('[data-lab-input="search"]')).toHaveValue('Quarterly');
    await lab.expectAccessible();
  });

  test('UIC-DOCK-PANEL-2.5 scrolls the tab strip freely with the wheel and fades its hidden edges', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = frame(page, 'overflow-expanded').locator('.ui-dock-panel');
    const list = panel.getByRole('tablist');
    const selected = panel.getByRole('tab', { selected: true });
    await expect(selected).toContainText('Change history');
    // The selected tab shows clear of both fades.
    await expect
      .poll(async () => {
        const tab = await box(selected);
        const strip = await box(list);
        return tab.x >= strip.x + 26 - 1 && tab.x + tab.width <= strip.x + strip.width - 26 + 1;
      })
      .toBe(true);
    const fades = panel.locator('.ui-dock-panel__fade');
    await expect(fades.first()).toBeVisible();
    await expect(fades.first()).toHaveCSS('width', '26px');
    // A vertical wheel scrolls it sideways, with no snapping, and keeps the offset.
    await list.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await expect(panel.locator('.ui-dock-panel__fade[data-edge="start"]')).toBeHidden();
    await list.hover();
    await page.mouse.wheel(0, 37);
    await expect.poll(() => list.evaluate((node) => node.scrollLeft)).toBe(37);
    await expect(panel.locator('.ui-dock-panel__fade[data-edge="start"]')).toBeVisible();
    await page.waitForTimeout(200);
    expect(await list.evaluate((node) => node.scrollLeft)).toBe(37);
    expect(await list.evaluate((node) => getComputedStyle(node).scrollSnapType)).toBe('none');
    await expect(panel.locator('.ui-tabs__scroll-button')).toHaveCount(0);
  });

  test('UIC-DOCK-PANEL-2.5 reveals the selected tab when the panel expands', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = frame(page, 'overflow-collapsed').locator('.ui-dock-panel');
    const rail = panel.getByRole('toolbar');
    // A short rail keeps its labels and scrolls natively.
    expect(await rail.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await expect(rail.getByRole('button', { name: 'Reviewers' })).toHaveText(/Reviewers/);
    await panel.getByRole('button', { name: 'Expand Project collapsed' }).click();
    const list = panel.getByRole('tablist');
    const selected = panel.getByRole('tab', { selected: true });
    await expect(selected).toContainText('Change history');
    const tab = await box(selected);
    const strip = await box(list);
    expect(tab.x).toBeGreaterThanOrEqual(strip.x + 25);
    expect(tab.x + tab.width).toBeLessThanOrEqual(strip.x + strip.width - 25);
  });

  test('UIC-DOCK-PANEL-3.1 UIC-DOCK-PANEL-3.2 UIC-DOCK-PANEL-3.4 resizes the main content in the same frame and saves once', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    const main = frame(page, 'workspace').locator(':scope > div').first();
    const separator = panel.getByRole('separator', { name: 'Resize Inspector' });
    const before = await box(panel);
    await page.evaluate(() => {
      // Firefox keeps an own `setItem` on the storage as an item, so the prototype counts writes.
      const writes: string[] = [];
      const original = Storage.prototype.setItem;
      Object.assign(window, { writes });
      Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
        writes.push(key);
        original.call(this, key, value);
      };
    });
    const { x, y } = await press(page, separator);
    for (const step of [10, 20, 30, 40]) await page.mouse.move(x - step, y);
    // The panel and the content beside it share one frame's geometry.
    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[data-lab-frame="workspace"]');
      const panelNode = root?.querySelector('.ui-dock-panel');
      const mainNode = root?.firstElementChild;
      return panelNode && mainNode
        ? mainNode.getBoundingClientRect().right - panelNode.getBoundingClientRect().left
        : NaN;
    });
    expect(Math.abs(geometry)).toBeLessThanOrEqual(1);
    await expect(panel).toHaveAttribute('data-resizing', 'true');
    await page.mouse.up();
    await expect(panel).not.toHaveAttribute('data-resizing');
    const after = await box(panel);
    expect(Math.round(after.width - before.width)).toBe(40);
    expect((await box(main)).width).toBeGreaterThan(0);
    const writes = await page.evaluate(() => (window as unknown as { writes: string[] }).writes);
    expect(writes.filter((key) => key.endsWith(':size'))).toHaveLength(1);
    await expect(page.locator('[data-lab-output="workspace"]')).toHaveText(
      `size ${String(Math.round(after.width))}px`,
    );
  });

  test('UIC-DOCK-PANEL-3.3 expands a collapsed panel in the same drag, in both reading directions', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    for (const rtl of [false, true]) {
      const host = frame(page, rtl ? 'drag-rtl' : 'drag');
      const panel = host.locator('.ui-dock-panel');
      const separator = panel.getByRole('separator');
      await separator.scrollIntoViewIfNeeded();
      await expect(separator).toHaveAttribute('tabindex', '-1');
      await expect(panel).not.toHaveAttribute('data-expanded');
      const { x, y } = await press(page, separator);
      // Toward the main content: leftward for an end panel, rightward right to left.
      const toward = rtl ? 1 : -1;
      await page.mouse.move(x + toward * 5, y);
      await expect(panel).toHaveAttribute('data-expanded', 'true');
      await expect.poll(async () => Math.round((await box(panel)).width)).toBe(245);
      await page.mouse.move(x + toward * 65, y, { steps: 4 });
      await expect.poll(async () => Math.round((await box(panel)).width)).toBe(305);
      await page.mouse.up();
      const output = page.locator(`[data-lab-output="${rtl ? 'drag-rtl' : 'drag'}"]`);
      await expect(output).toHaveText('ended at 305px');
      await expect(separator).toHaveAttribute('tabindex', '0');
      await panel.getByRole('button', { name: /^Collapse/ }).click();
    }
  });

  test('UIC-DOCK-PANEL-3.4 cancels a drag on lost capture and rolls a controlled host back', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = page.getByRole('region', { name: 'Navigator', exact: true });
    const separator = panel.getByRole('separator');
    const before = Math.round((await box(panel)).width);
    await separator.evaluate((node) => {
      node.addEventListener('pointerdown', (event) => {
        Object.assign(window, { pressedPointer: (event as PointerEvent).pointerId });
      });
    });
    const { x, y } = await press(page, separator);
    await page.mouse.move(x + 50, y, { steps: 3 });
    await expect.poll(async () => Math.round((await box(panel)).width)).toBe(before + 50);
    // The browser cancels the gesture, as when a touch turns into a page scroll.
    await separator.evaluate((node) => {
      const pointerId = (window as unknown as { pressedPointer: number }).pressedPointer;
      node.dispatchEvent(
        new PointerEvent('pointercancel', { bubbles: true, pointerId, isPrimary: true }),
      );
    });
    await expect(panel).not.toHaveAttribute('data-resizing');
    await expect.poll(async () => Math.round((await box(panel)).width)).toBe(before);
    await page.mouse.up();
    await expect(page.locator('[data-lab-output="controlled-ends"]')).toHaveText(
      '0 ends, 1 cancels',
    );
  });

  test('UIC-DOCK-PANEL-3.2 resizes a bottom panel by keyboard and follows a scaled pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = page.getByRole('region', { name: 'Console', exact: true });
    const separator = panel.getByRole('separator', { name: 'Resize Console' });
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await separator.focus();
    await page.keyboard.press('ArrowUp');
    await expect(separator).toHaveAttribute('aria-valuenow', '160');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(separator).toHaveAttribute('aria-valuenow', '158');
    await page.keyboard.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '240');
    await page.keyboard.press('Home');
    await expect(separator).toHaveAttribute('aria-valuenow', '100');
    await frame(page, 'console').evaluate((node) => {
      (node as HTMLElement).style.transform = 'scale(0.5)';
      (node as HTMLElement).style.transformOrigin = '0 0';
    });
    const { x, y } = await press(page, separator);
    await page.mouse.move(x, y - 20, { steps: 2 });
    await page.mouse.up();
    // Twenty viewport pixels are forty of the panel's own under a half scale.
    await expect(separator).toHaveAttribute('aria-valuenow', '140');
  });

  test('UIC-DOCK-PANEL-3.5 restores the selection and size after a reload', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    await panel.getByRole('tab', { name: /People/ }).click();
    const separator = panel.getByRole('separator', { name: 'Resize Inspector' });
    await separator.focus();
    await page.keyboard.press('ArrowLeft');
    await page.reload();
    await expect(inspector(page).getByRole('tab', { selected: true })).toContainText('People');
    expect(Math.round((await box(inspector(page))).width)).toBe(330);
  });

  test('UIC-DOCK-PANEL-4.1 opens a pane in a drawer on a narrow frame', async ({ page, lab }) => {
    await lab.open('dock-panel');
    const panel = page.getByRole('region', { name: 'Helper', exact: true });
    await expect(panel).toHaveAttribute('data-overlay', 'true');
    await panel.getByRole('button', { name: 'Links' }).click();
    const dialog = page.getByRole('dialog', { name: 'Links' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Link draft' }).fill('Kept');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(panel.getByRole('button', { name: 'Links' })).toBeFocused();
    await page.getByRole('button', { name: 'Widen the frame' }).click();
    await expect(panel).not.toHaveAttribute('data-overlay');
    await panel.getByRole('tab', { name: /Links/ }).click();
    await expect(panel.getByRole('textbox', { name: 'Link draft' })).toHaveValue('Kept');
  });

  test('UIC-DOCK-PANEL-1.1 is as tall as its selected pane in a host with no height, and fills a host with one', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = page.getByRole('region', { name: 'Tasks', exact: true });
    const button = page.getByRole('button', { name: 'New task' });
    await expect(button).toBeVisible();
    const rect = await box(panel);
    const end = await box(button);
    expect(end.y + end.height).toBeLessThanOrEqual(rect.y + rect.height);
    const workspace = await box(frame(page, 'workspace'));
    expect(Math.round((await box(inspector(page))).height)).toBe(Math.round(workspace.height));
  });
});
