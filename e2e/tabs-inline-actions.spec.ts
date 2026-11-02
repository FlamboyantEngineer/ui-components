import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function attribute(element: Locator, name: string): Promise<string> {
  const value = await element.getAttribute(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function checkPanel(demo: Locator) {
  const selected = demo.getByRole('tab', { selected: true });
  const panel = demo.getByRole('tabpanel');
  await expect(selected).toHaveAttribute('aria-controls', await attribute(panel, 'id'));
  await expect(panel).toHaveAttribute('aria-labelledby', await attribute(selected, 'id'));
}

async function stableIds(demo: Locator) {
  return {
    list: await attribute(demo.locator('.ui-tabs__list'), 'id'),
    tabs: await demo
      .getByRole('tab')
      .evaluateAll((nodes) =>
        Object.fromEntries(nodes.map((node) => [node.textContent?.trim() ?? '', node.id])),
      ),
  };
}

async function checkIds(demo: Locator, ids: Awaited<ReturnType<typeof stableIds>>) {
  await expect(demo.locator('.ui-tabs__list')).toHaveAttribute('id', ids.list);
  for (const tab of await demo.getByRole('tab').all()) {
    const name = (await tab.textContent())?.trim() ?? '';
    const id = ids.tabs[name];
    if (!id) throw new Error(`Unexpected mounted tab: ${name}`);
    await expect(tab).toHaveAttribute('id', id);
  }
  await checkOwnership(demo);
}

async function checkOwnership(demo: Locator) {
  const owner = demo.getByRole('tablist');
  await expect
    .poll(async () => (await owner.getAttribute('aria-owns'))?.split(' '))
    .toEqual(await demo.getByRole('tab').evaluateAll((nodes) => nodes.map((node) => node.id)));
  expect(await owner.ariaSnapshot()).not.toContain('button');
  await checkPanel(demo);
}

test('UIC-TABS-3.11 ordinary actions keep DOM order, keyboard and actual tab ownership', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-scroll"]');
  await checkOwnership(demo);
  const order = await demo
    .locator('.ui-tabs__list')
    .locator(':scope > *')
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        node.matches('.ui-tabs__action') ? 'Add item' : node.textContent?.trim(),
      ),
    );
  expect(order).toEqual(['Inbox', 'Drafts', 'Add item', 'Archive', 'Settings']);
  await lab.expectAccessible('[data-lab-demo="inline-action-scroll"]');
  const inbox = demo.getByRole('tab', { name: 'Inbox', exact: true });
  await inbox.focus();
  await page.keyboard.press('ArrowRight');
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(demo.getByRole('tab', { name: 'Settings', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(inbox).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(demo.getByRole('button', { name: 'Add item' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(demo.locator('[data-lab-output="selection"]')).toHaveText('Selected inbox; added 1');
});

test('UIC-TABS-3.11 action stays visible and separate when its tab collapses', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-menu"]');
  const ids = await stableIds(demo);
  const draftsId = await attribute(demo.getByRole('tab', { name: 'Drafts', exact: true }), 'id');
  await demo.evaluate((element) => {
    element.style.width = '160px';
  });
  const action = demo.getByRole('button', { name: 'Add item' });
  await expect(action).toBeVisible();
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toHaveCount(0);
  await checkIds(demo, ids);
  await lab.expectAccessible('[data-lab-demo="inline-action-menu"]');
  await action.click();
  await expect(demo.locator('[data-lab-output="selection"]')).toHaveText('Selected inbox; added 1');
  await demo.getByRole('button', { name: /more items/ }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Add item' })).toHaveCount(0);
  await menu.getByRole('menuitem', { name: 'Drafts', exact: true }).click();
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toHaveAttribute(
    'id',
    draftsId,
  );
  await checkIds(demo, ids);
  await demo.evaluate((element) => {
    element.style.removeProperty('width');
  });
  await expect(demo.getByRole('tab')).toHaveCount(4);
  await checkIds(demo, ids);
});

test('UIC-TABS-3.11 dynamic controlled tabs remove stale ownership and preserve default output', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-scroll"]');
  const inbox = demo.getByRole('tab', { name: 'Inbox', exact: true });
  const originalId = await attribute(inbox, 'id');
  await demo.getByRole('tab', { name: 'Drafts', exact: true }).click();
  const removedId = await attribute(demo.getByRole('tab', { name: 'Drafts', exact: true }), 'id');
  await demo.getByRole('button', { name: 'Change items' }).click();
  await expect(inbox).toHaveAttribute('aria-selected', 'true');
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toHaveCount(0);
  await checkOwnership(demo);
  expect(await demo.getByRole('tablist').getAttribute('aria-owns')).not.toContain(removedId);
  await demo.getByRole('tab', { name: 'Reports', exact: true }).click();
  await expect(demo.getByRole('tabpanel')).toHaveText('Report messages.');
  await demo.getByRole('button', { name: 'Toggle action' }).click();
  await expect(demo.getByRole('button', { name: 'Add item' })).toHaveCount(0);
  await expect(demo.getByRole('tablist')).toHaveClass(/ui-tabs__list/);
  await expect(demo.getByRole('tablist')).not.toHaveAttribute('aria-owns');
  await expect(inbox).toHaveAttribute('id', originalId);
  await lab.expectAccessible('[data-lab-demo="inline-action-scroll"]');
  await demo.getByRole('button', { name: 'Toggle action' }).click();
  await checkOwnership(demo);
  await expect(inbox).toHaveAttribute('id', originalId);
  await lab.expectAccessible('[data-lab-demo="inline-action-scroll"]');
});

test('UIC-TABS-3.11 disabled tabs, RTL arrows and ordinary action keys stay separate', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-scroll"]');
  const action = demo.getByRole('button', { name: 'Add item' });
  await demo.getByRole('button', { name: 'Toggle direction' }).click();
  await demo.getByRole('tab', { name: 'Inbox', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toBeFocused();
  await action.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(action).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toBeFocused();
  await demo.getByRole('button', { name: 'Toggle disabled' }).click();
  for (const tab of await demo.getByRole('tab').all())
    await expect(tab).toHaveAttribute('aria-disabled', 'true');
  await action.click();
  await expect(demo.locator('[data-lab-output="selection"]')).toHaveText(
    'Selected drafts; added 1',
  );
  await checkOwnership(demo);
  await lab.expectAccessible('[data-lab-demo="inline-action-scroll"]');
});

test('UIC-TABS-3.11 very narrow and oversized actions scroll without hiding parts, then recover menu overflow', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-menu"]');
  const bar = demo.locator('.ui-tabs__bar');
  const ids = await stableIds(demo);
  const action = demo.getByRole('button', { name: 'Add item' });
  await action.focus();
  await expect(action).toBeFocused();
  const actionId = await attribute(action, 'id');
  await demo.evaluate((element) => {
    element.style.width = '80px';
  });
  await expect(bar).toHaveAttribute('data-overflow', 'scroll');
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute('id', actionId);
  await checkIds(demo, ids);
  await expect(demo.getByRole('tab')).toHaveCount(4);
  await expect(action).toHaveCount(1);
  await checkOwnership(demo);
  await action.focus();
  await expect(action).toBeFocused();
  await action.click();
  await expect(demo.locator('[data-lab-output="selection"]')).toHaveText('Selected inbox; added 1');
  await lab.expectAccessible('[data-lab-demo="inline-action-menu"]');
  await demo.evaluate((element) => {
    element.style.width = '160px';
  });
  await expect(bar).toHaveAttribute('data-overflow', 'menu');
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute('id', actionId);
  await checkIds(demo, ids);
  await expect(demo.getByRole('tab', { name: 'Drafts', exact: true })).toHaveCount(0);
  await action.evaluate((element) => {
    element.style.width = '240px';
  });
  await expect(bar).toHaveAttribute('data-overflow', 'scroll');
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute('id', actionId);
  await checkIds(demo, ids);
  await checkOwnership(demo);
  await expect(demo.getByRole('tab')).toHaveCount(4);
  await action.focus();
  await expect(action).toBeFocused();
  await lab.expectAccessible('[data-lab-demo="inline-action-menu"]');
  await action.evaluate((element) => {
    element.style.removeProperty('width');
  });
  await expect(bar).toHaveAttribute('data-overflow', 'menu');
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute('id', actionId);
  await checkIds(demo, ids);
  await checkOwnership(demo);
  await lab.expectAccessible('[data-lab-demo="inline-action-menu"]');
});

test('UIC-TABS-3.11 menu actions and a pinned external toolbar fit supported widths in both directions', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-menu"]');
  for (const rtl of [false, true]) {
    if (rtl) await demo.getByRole('button', { name: 'Toggle direction' }).click();
    for (const width of [300, 420, 520]) {
      await demo.evaluate((element, size) => {
        element.style.width = `${size}px`;
      }, width);
      await expect(demo.getByRole('button', { name: 'Add item' })).toBeVisible();
      await expect(demo.getByRole('button', { name: 'Refresh' })).toBeVisible();
      const box = (element: Locator) =>
        element.evaluate((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        });
      const toolbar = await box(demo.getByRole('toolbar', { name: 'Mailbox actions' }));
      const refresh = await box(demo.getByRole('button', { name: 'Refresh' }));
      const list = await box(demo.locator('.ui-tabs__list'));
      const bounds = await box(demo);
      expect(
        Math.abs(refresh.y + refresh.height / 2 - (list.y + list.height / 2)),
      ).toBeLessThanOrEqual(1);
      expect(toolbar.x).toBeGreaterThanOrEqual(bounds.x - 1);
      expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      expect(
        Math.abs(rtl ? refresh.x - bounds.x : refresh.x + refresh.width - bounds.x - bounds.width),
      ).toBeLessThanOrEqual(1);
      await checkOwnership(demo);
    }
  }
  await lab.expectAccessible('[data-lab-demo="inline-action-menu"]');
});

test('UIC-TABS-3.11 a menu list that falls back to scrolling takes the wheel in both directions', async ({
  page,
  lab,
}) => {
  await lab.open('tabs');
  const demo = page.locator('[data-lab-demo="inline-action-menu"]');
  const bar = demo.locator('.ui-tabs__bar');
  const list = demo.locator('.ui-tabs__list');
  const wheel = (deltaY: number) =>
    list.evaluate((element, delta) => {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: delta });
      element.querySelector('[role="tab"]')?.dispatchEvent(event);
      return { held: event.defaultPrevented, left: element.scrollLeft };
    }, deltaY);
  for (const rtl of [false, true]) {
    if (rtl) await demo.getByRole('button', { name: 'Toggle direction' }).click();
    await demo.evaluate((element) => {
      element.style.width = '80px';
    });
    await expect(bar).toHaveAttribute('data-overflow', 'scroll');
    await list.evaluate((element) => {
      element.scrollLeft = 0;
    });
    // The vertical wheel scrolls toward the inline end: leftward, so negative, right to left.
    const first = await wheel(40);
    expect(first.held).toBe(true);
    expect(rtl ? first.left < 0 : first.left > 0).toBe(true);
    // At the far end the list keeps the wheel, so the page behind it stays put.
    await wheel(10_000);
    const end = await list.evaluate((element) => element.scrollLeft);
    const past = await wheel(100);
    expect(past.held).toBe(true);
    expect(past.left).toBe(end);
    await demo.evaluate((element) => {
      element.style.removeProperty('width');
    });
    await expect(bar).toHaveAttribute('data-overflow', 'menu');
    // A menu list that hides tabs no longer scrolls, so it leaves the wheel to the page.
    expect((await wheel(40)).held).toBe(false);
    await expect(demo.getByRole('button', { name: 'Add item' })).toHaveCount(1);
  }
});
