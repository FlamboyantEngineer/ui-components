import { cellSelector, expect, matrixCell, test } from './fixtures.js';

test.describe('Loading Overlay lab', () => {
  test('UIC-LOADING-OVERLAY-1.1 UIC-LOADING-OVERLAY-1.2 UIC-LOADING-OVERLAY-1.4 draws status cards with one bar each', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const cells = page.locator('table[data-lab-matrix="extras progress"] td[data-lab-cell]');
    expect(await cells.count()).toBe(3 * 2);
    const measured = matrixCell(page, 'extras=hint and step progress=determinate');
    const status = measured.getByRole('status');
    await expect(status).toContainText('Loading report');
    await expect(status.getByRole('progressbar')).toHaveCount(1);
    await expect(status.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    await expect(measured.locator('.ui-loading-card__value')).toHaveText('42%');
    await expect(measured.locator('.ui-loading-card__step')).toHaveText('6 of 9');
    const plain = matrixCell(page, 'extras=label only progress=indeterminate');
    await expect(plain.locator('.ui-loading-card__value')).toHaveCount(0);
    await expect(plain.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  test('UIC-LOADING-OVERLAY-1.5 keeps a cut hint whole in a tooltip', async ({ page, lab }) => {
    await lab.open('loading-overlay');
    const hint = page.locator(
      `${cellSelector('extras=hint and step progress=determinate')} .ui-loading-card__hint`,
    );
    expect(await hint.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await hint.hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Measuring the layout of every page in the quarterly report',
    );
  });

  test('UIC-LOADING-OVERLAY-2.1 UIC-LOADING-OVERLAY-2.2 covers its bounded surface', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    for (const presentation of ['card', 'scrim']) {
      const cell = page.locator(
        cellSelector(`presentation=${presentation} progress=indeterminate`),
      );
      const surface = await cell.locator('[data-lab-surface]').boundingBox();
      const overlay = await cell.locator('.ui-loading-overlay').boundingBox();
      expect(overlay).toEqual(surface);
    }
    const scrim = matrixCell(page, 'presentation=scrim progress=determinate');
    await expect(scrim.locator('.ui-loading-overlay')).toHaveAttribute('aria-hidden', 'true');
    await expect(scrim.getByRole('status')).toHaveCount(0);
    const card = matrixCell(page, 'presentation=card progress=determinate');
    await expect(card.getByRole('status')).toBeVisible();
  });

  test('UIC-LOADING-OVERLAY-3.1 blocks a form while loading and releases it after', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="region"]');
    const region = demo.locator('.ui-loading-region');
    const input = demo.getByRole('textbox', { name: 'City' });
    const toggle = demo.getByRole('button', { name: 'Start loading' });
    await toggle.click();
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(demo.getByRole('status')).toContainText('Saving city');
    await expect(region).not.toHaveAttribute('aria-busy');
    await expect(demo.locator('[aria-busy] [role="status"]')).toHaveCount(0);
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute('inert', '');
    expect(
      await input.evaluate((node: HTMLElement) => {
        node.focus();
        return document.activeElement === node;
      }),
    ).toBe(false);
    const overlay = await region.locator('.ui-loading-overlay').boundingBox();
    const content = await region.locator('.ui-loading-region__content').boundingBox();
    expect(overlay).toEqual(content);
    await demo.getByRole('button', { name: 'Stop loading' }).click();
    await expect(region.locator('.ui-loading-region__content')).not.toHaveAttribute('aria-busy');
    await input.focus();
    await expect(input).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-LOADING-OVERLAY-3.3 keeps and returns focus inside a shadow root', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="shadow-region"]');
    const note = demo.getByRole('textbox', { name: 'Note' });
    const region = demo.locator('.ui-loading-region');
    const content = region.locator('.ui-loading-region__content');
    await note.focus();
    // Starts the save without moving focus, as work finishing elsewhere would.
    await page.getByRole('button', { name: 'Save note' }).dispatchEvent('click');
    await expect(content).toHaveAttribute('aria-busy', 'true');
    await expect(region).toBeFocused();
    await expect(content).not.toHaveAttribute('aria-busy');
    await expect(note).toBeFocused();
  });

  test('UIC-LOADING-OVERLAY-3.1 keeps keyboard focus on the region while it blocks and returns it', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="region"]');
    const region = demo.locator('.ui-loading-region');
    const apply = demo.getByRole('button', { name: 'Apply' });
    await demo.getByRole('textbox', { name: 'City' }).focus();
    await page.keyboard.press('Tab');
    await expect(apply).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(region).toBeFocused();
    await expect(region.locator('.ui-loading-region__content')).not.toHaveAttribute('aria-busy');
    await expect(apply).toBeFocused();
    await expect(region).not.toHaveAttribute('tabindex');
  });

  for (const [save, first, tabs] of [
    ['Save, note first', 'inner', 1],
    ['Save, panel first', 'outer', 2],
  ] as const) {
    test(`UIC-LOADING-OVERLAY-3.4 returns focus from nested regions when the ${first} one ends first`, async ({
      page,
      lab,
    }) => {
      await lab.open('loading-overlay');
      const demo = page.locator('[data-lab-demo="nested-regions"]');
      const outer = demo.locator('[data-lab-region="outer"]');
      const inner = demo.locator('[data-lab-region="inner"]');
      const button = demo.getByRole('button', { name: save });
      await demo.getByRole('textbox', { name: 'Note' }).focus();
      for (let tab = 0; tab < tabs; tab += 1) await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(outer).toBeFocused();
      const ended = first === 'inner' ? inner : outer;
      await expect(ended).not.toHaveAttribute('data-loading');
      const still = first === 'inner' ? outer : inner;
      await expect(still).toHaveAttribute('data-loading');
      await expect(still).toBeFocused();
      await expect(still).not.toHaveAttribute('data-loading');
      await expect(button).toBeFocused();
    });
  }

  test('UIC-LOADING-OVERLAY-3.5 closes a focused menu when its region starts loading', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="menu-in-region"]');
    const region = demo.locator('.ui-loading-region');
    const trigger = demo.getByRole('button', { name: 'Actions' });
    await demo.getByRole('button', { name: 'Refresh in a second' }).click();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Run action' })).toBeFocused();
    await expect(region).toHaveAttribute('data-loading');
    await expect(region).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(region).not.toHaveAttribute('data-loading');
    await expect(trigger).toBeFocused();
    await expect(demo.getByText('Last action: none')).toBeVisible();
  });

  test('UIC-LOADING-OVERLAY-2.4 UIC-ENTER-EXIT-1.3 fades the region cover out before removing it', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    // Slow the reference transitions so each phase holds until the test finishes it.
    await page.addStyleTag({
      content:
        '[data-lab-demo="region"] .ui-loading-overlay { animation-duration: 60s !important; transition-duration: 60s !important; }',
    });
    const demo = page.locator('[data-lab-demo="region"]');
    const cover = demo.locator('.ui-loading-overlay');
    const finish = () =>
      cover.evaluate((node) => {
        const running = node.getAnimations();
        for (const animation of running) animation.finish();
        return running.length;
      });
    await demo.getByRole('button', { name: 'Start loading' }).click();
    await expect(cover).toHaveAttribute('data-entering', 'true');
    expect(await finish()).toBeGreaterThan(0);
    await expect(cover).not.toHaveAttribute('data-entering');
    await demo.getByRole('button', { name: 'Stop loading' }).click();
    await expect(cover).toHaveAttribute('data-exiting', 'true');
    await expect(demo.locator('.ui-loading-region__content')).not.toHaveAttribute('aria-busy');
    expect(await cover.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe('none');
    expect(await finish()).toBeGreaterThan(0);
    await expect(cover).toHaveCount(0);
  });

  test('UIC-LOADING-OVERLAY-3.2 blocks only once a search outlasts the delay', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('loading-overlay');
    // A paused clock keeps each step observable on a busy machine.
    await page.clock.pauseAt(Date.now() + 1000);
    const demo = page.locator('[data-lab-demo="delay"]');
    const region = demo.locator('.ui-loading-region');
    await demo.getByRole('button', { name: 'Start searching' }).click();
    await page.clock.runFor(400);
    await expect(region.locator('.ui-loading-region__content')).not.toHaveAttribute('aria-busy');
    await expect(region.locator('.ui-loading-overlay')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Stop searching' }).click();
    await page.clock.runFor(1000);
    await expect(region.locator('.ui-loading-overlay')).toHaveCount(0);

    await demo.getByRole('button', { name: 'Start searching' }).click();
    await page.clock.runFor(500);
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(region.getByRole('status')).toContainText('Searching recipes');
    await expect(region.locator('.ui-loading-region__content')).toHaveAttribute('inert', '');
    // Axe times itself with timers, so the clock runs again before checking.
    await page.clock.resume();
    await lab.expectAccessible();
  });

  test('UIC-LOADING-OVERLAY-2.3 covers the whole viewport in full-screen mode', async ({
    page,
    lab,
  }) => {
    await lab.open('loading-overlay');
    const demo = page.locator('[data-lab-demo="fullscreen"]');
    await demo.getByRole('button', { name: 'Open the cookbook' }).click();
    const cover = page.locator('[data-lab-overlay="fullscreen"]');
    await expect(cover).toHaveAttribute('data-fullscreen', 'true');
    await expect(demo.locator('.ui-loading-overlay')).toHaveCount(0);
    const viewport = page.viewportSize();
    const box = await cover.boundingBox();
    expect(box).toEqual({ x: 0, y: 0, width: viewport?.width, height: viewport?.height });
    await expect(
      page.getByRole('status').filter({ hasText: 'Opening the cookbook' }),
    ).toBeVisible();
    await lab.expectAccessible('.ui-loading-overlay[data-fullscreen]');
    await page.keyboard.press('Escape');
    await expect(cover).toHaveCount(0);
  });
});
