import type { Locator, Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

function assembly(page: Page) {
  return page.getByRole('group', { name: 'Editable assembly' });
}

function surface(viewport: Locator) {
  return viewport.locator('.ui-canvas-viewport__surface');
}

function world(viewport: Locator) {
  return viewport.locator('.ui-canvas-viewport__world');
}

async function centre(target: Locator) {
  const bounds = requireDefined(await target.boundingBox());
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

async function drag(page: Page, from: Locator, delta: { x: number; y: number }, release = true) {
  await from.scrollIntoViewIfNeeded();
  const point = await centre(from);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + delta.x, point.y + delta.y, { steps: 5 });
  if (release) await page.mouse.up();
}

async function camera(viewport: Locator) {
  return world(viewport).evaluate((layer) => {
    const matrix = new DOMMatrix(getComputedStyle(layer).transform);
    return { x: matrix.e, y: matrix.f, scale: matrix.a };
  });
}

test('UIC-CANVAS-VIEWPORT-1.1 UIC-CANVAS-VIEWPORT-1.2 UIC-CANVAS-VIEWPORT-1.3 keeps a world point at the pointer and fits after pane resize', async ({
  page,
  lab,
}) => {
  await lab.open('canvas-viewport');
  const view = assembly(page);
  const anchor = view.getByRole('button', { name: 'Receiver anchor' });
  await anchor.scrollIntoViewIfNeeded();
  const fit = view.getByRole('button', { name: 'Fit assembly' });
  const fitBefore = await fit.boundingBox();
  const point = await centre(anchor);
  await page.mouse.move(point.x, point.y);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -150);
  await page.keyboard.up('Control');
  await expect.poll(async () => (await camera(view)).scale).toBeGreaterThan(1);
  const after = await centre(anchor);
  expect(Math.abs(after.x - point.x)).toBeLessThan(1);
  expect(Math.abs(after.y - point.y)).toBeLessThan(1);
  expect(await fit.boundingBox()).toEqual(fitBefore);

  await page.getByRole('button', { name: 'Narrow pane' }).click();
  await fit.click();
  const { width, height } = requireDefined(await surface(view).boundingBox());
  const scale = Math.min((width - 76) / 451, (height - 76) / 207);
  const fitted = await camera(view);
  expect(fitted.scale).toBeCloseTo(scale, 4);
  expect(fitted.x).toBeCloseTo(38, 3);
  expect(fitted.y + (207 / 2) * fitted.scale).toBeCloseTo(height / 2, 3);
  await view.getByRole('button', { name: 'Stand anchor' }).click({ trial: true });
});

test('UIC-CANVAS-VIEWPORT-1.5 pans over a shape with the middle button and zooms at the plain wheel', async ({
  page,
  lab,
}) => {
  await lab.open('canvas-viewport');
  const view = assembly(page);
  await page.getByRole('button', { name: 'Use middle drag and wheel zoom' }).click();
  const frame = view.locator('[data-lab-handle="move-frame"]');
  await frame.scrollIntoViewIfNeeded();
  const point = await centre(frame);
  const before = await camera(view);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(point.x + 36, point.y + 18, { steps: 4 });
  await page.mouse.up({ button: 'middle' });
  expect(await camera(view)).toEqual({ x: before.x + 36, y: before.y + 18, scale: before.scale });
  await expect(view.locator('path[d^="M 184 79"]')).toHaveCount(1);

  const anchor = view.getByRole('button', { name: 'Source anchor' });
  const pinned = await centre(anchor);
  await page.mouse.move(pinned.x, pinned.y);
  await page.mouse.wheel(0, -150);
  await expect.poll(async () => (await camera(view)).scale).toBeGreaterThan(1);
  const zoomed = await centre(anchor);
  expect(Math.abs(zoomed.x - pinned.x)).toBeLessThan(1);
  expect(Math.abs(zoomed.y - pinned.y)).toBeLessThan(1);
});

test('UIC-CANVAS-VIEWPORT-2.1 UIC-CANVAS-VIEWPORT-2.2 UIC-CANVAS-VIEWPORT-3.1 keeps paths and embedded controls attached during move and resize', async ({
  page,
  lab,
}) => {
  await lab.open('canvas-viewport');
  const view = assembly(page);
  const frame = view.locator('[data-lab-handle="move-frame"]');
  const resize = view.locator('[data-lab-handle="resize-frame"]');
  const source = view.getByRole('button', { name: 'Source anchor' });
  const mark = view.getByRole('button', { name: 'Mark', exact: true });
  await expect(view.locator('path[d^="M 184 79"]')).toHaveCount(1);
  await source.press('Enter');
  await view.getByRole('button', { name: 'Receiver anchor' }).press('Space');
  const childWire = view.locator('path[d$=", 299 94"]');
  await expect(childWire).toHaveAttribute('d', /^M 145 87 C /);
  const markBefore = await centre(mark);
  const sourceBefore = await centre(source);
  await drag(page, frame, { x: 34, y: 11 });
  expect((await centre(source)).x).toBeCloseTo(sourceBefore.x + 34);
  expect((await centre(mark)).y).toBeCloseTo(markBefore.y + 11);
  await expect(view.locator('path[d^="M 218 90"]')).toHaveCount(1);
  await expect(childWire).toHaveAttribute('d', /^M 179 98 C /);
  await drag(page, resize, { x: 35, y: 20 });
  await expect(view.locator('path[d^="M 253 100"]')).toHaveCount(1);
  await expect(childWire).toHaveAttribute('d', /^M 179 98 C /);
  expect((await centre(source)).x).toBeCloseTo(sourceBefore.x + 34);

  const unmark = view.getByRole('button', { name: 'Unmark', exact: true });
  await mark.click();
  await expect(unmark).toBeVisible();
  await unmark.focus();
  await expect(unmark).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(mark).toBeFocused();

  const sourceAfter = await centre(source);
  await drag(page, frame, { x: -24, y: 20 }, false);
  await expect.poll(async () => (await centre(source)).x).toBeCloseTo(sourceAfter.x - 24);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect.poll(async () => (await centre(source)).x).toBeCloseTo(sourceAfter.x);
});

test('UIC-CANVAS-VIEWPORT-3.2 previews rejected targets and connects across parents with pointer and keyboard', async ({
  page,
  lab,
}) => {
  await lab.open('canvas-viewport');
  const view = assembly(page);
  const source = view.getByRole('button', { name: 'Source anchor' });
  const receiver = view.getByRole('button', { name: 'Receiver anchor' });
  const spare = view.getByRole('button', { name: 'Spare anchor' });
  await source.scrollIntoViewIfNeeded();
  const start = await centre(source);
  const wrong = await centre(spare);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(wrong.x, wrong.y, { steps: 8 });
  const preview = view.locator('path[data-lab-overlay="connection"]');
  await expect(preview).toHaveAttribute('stroke', 'var(--ref-danger)');
  await page.mouse.up();
  await expect(preview).toHaveCount(0);
  await expect(
    page.getByRole('status').filter({ hasText: 'Connection rejected: spare' }),
  ).toBeVisible();
  const paths = world(view).locator('path[d]');
  await expect(paths).toHaveCount(1);

  const valid = await centre(receiver);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(valid.x, valid.y, { steps: 8 });
  await expect(preview).toHaveAttribute('stroke', 'var(--ref-accent)');
  await page.mouse.up();
  await expect(
    page.getByRole('status').filter({ hasText: 'Connected source to receiver' }),
  ).toBeVisible();
  await expect(paths).toHaveCount(2);

  await page.reload();
  await source.focus();
  await page.keyboard.press('Enter');
  await expect(source).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(receiver).toBeFocused();
  await page.keyboard.press('Space');
  await expect(paths).toHaveCount(2);
  await expect(source).toHaveAttribute('aria-pressed', 'false');
});

test('UIC-CANVAS-VIEWPORT-2.2 reveals a clipped scene button as keyboard focus moves', async ({
  page,
  lab,
}) => {
  await lab.open('canvas-viewport');
  const view = assembly(page);
  const area = requireDefined(await surface(view).boundingBox());
  await page.mouse.move(area.x + 8, area.y + 25);
  await page.mouse.wheel(550, 0);
  await expect.poll(async () => (await camera(view)).x).toBe(-512);

  await view.focus();
  await page.keyboard.press('Tab');
  const mark = view.getByRole('button', { name: 'Mark', exact: true });
  await expect(mark).toBeFocused();
  expect((await centre(mark)).x).toBeGreaterThan(area.x);
  await page.keyboard.press('Space');
  await expect(view.getByRole('button', { name: 'Unmark' })).toBeFocused();
});

test('UIC-CANVAS-VIEWPORT-1.4 pans the large scene as one layer', async ({ page, lab }) => {
  await lab.open('canvas-viewport');
  const viewport = page.getByRole('group', { name: 'Large scene' });
  const scene = viewport.getByRole('img', { name: '100 nodes and 300 paths' });
  await scene.scrollIntoViewIfNeeded();
  await expect(scene.locator('rect')).toHaveCount(100);
  await expect(scene.locator('path')).toHaveCount(300);
  const canvas = requireDefined(await surface(viewport).boundingBox());
  const point = { x: canvas.x + 8, y: canvas.y + 20 };
  const before = await camera(viewport);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 38, point.y + 18, { steps: 8 });
  await page.mouse.up();
  expect(await camera(viewport)).toEqual({
    x: before.x + 38,
    y: before.y + 18,
    scale: before.scale,
  });
  await expect(scene.locator('path')).toHaveCount(300);
});
