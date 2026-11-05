import type { Locator, Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, matrixCell, test } from './fixtures.js';

const widths = ['240', '264', '320', 'desktop'] as const;
const counts = ['4', '6', '8'] as const;
const densities = ['default', 'compact'] as const;

const list = (page: Page, steps: string, density: string, width: string) =>
  matrixCell(page, `steps=${steps} density=${density} width=${width}`).locator(`.ui-steps`);

const box = async (locator: Locator) => requireDefined(await locator.boundingBox());

/** The boxes of the elements the reader can see: hidden labels are clipped to nothing. */
async function visibleBoxes(locator: Locator) {
  const boxes = [];
  for (const element of await locator.all()) {
    const visible = await element.evaluate((node) => {
      for (let at: Element | null = node; at && !at.matches('.ui-steps'); at = at.parentElement) {
        const { clipPath, clip } = getComputedStyle(at);
        if (clipPath.includes('50%') || clip.startsWith('rect') || at.clientWidth <= 1)
          return false;
      }
      return true;
    });
    const found = await element.boundingBox();
    if (visible && found && found.width > 1 && found.height > 1) boxes.push(found);
  }
  return boxes;
}

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 &&
  b.x < a.x + a.width - 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  b.y < a.y + a.height - 0.5;

test.describe('Steps in narrow containers', () => {
  test('UIC-STEPS-1.8 keeps labels readable and parts apart at every width', async ({
    page,
    lab,
  }) => {
    await lab.open('steps');
    for (const count of counts) {
      for (const density of densities) {
        for (const width of widths) {
          const steps = list(page, count, density, width);
          const listBox = await box(steps);
          const markers = await Promise.all(
            (await steps.locator('.ui-steps__marker').all()).map(box),
          );
          expect(markers).toHaveLength(Number(count));
          for (const [index, marker] of markers.entries()) {
            expect(Math.round(marker.y)).toBe(Math.round(requireDefined(markers[0]).y));
            expect(marker.x).toBeGreaterThanOrEqual(listBox.x - 0.5);
            expect(marker.x + marker.width).toBeLessThanOrEqual(listBox.x + listBox.width + 0.5);
            const next = markers[index + 1];
            if (next) expect(next.x).toBeGreaterThan(marker.x + marker.width);
          }
          const connectors = await Promise.all(
            (await steps.locator('.ui-steps__connector').all()).map(box),
          );
          for (const [index, connector] of connectors.entries()) {
            expect(connector.width).toBeGreaterThan(0);
            expect(connector.x).toBeGreaterThanOrEqual(requireDefined(markers[index]).x + 20);
            expect(connector.x + connector.width).toBeLessThanOrEqual(
              requireDefined(markers[index + 1]).x + 0.5,
            );
          }
          // Lines break between words, never inside one.
          for (const label of await steps.locator('.ui-steps__label').all()) {
            if ((await visibleBoxes(label)).length === 0) continue;
            const words = (await label.innerText()).trim().split(/\s+/).length;
            expect((await box(label)).height).toBeLessThanOrEqual(words * 20 + 1);
          }
          const texts = await visibleBoxes(steps.locator('.ui-steps__text'));
          expect(texts.length).toBeGreaterThan(0);
          for (const [index, text] of texts.entries()) {
            for (const marker of markers) expect(overlaps(text, marker)).toBe(false);
            for (const other of texts.slice(index + 1)) expect(overlaps(text, other)).toBe(false);
          }
        }
      }
    }
  });

  test('UIC-STEPS-1.8 moves to the rail below 80px a column and in the compact density', async ({
    page,
    lab,
  }) => {
    await lab.open('steps');
    const labels = async (steps: string, density: string, width: string) =>
      (await visibleBoxes(list(page, steps, density, width).locator('.ui-steps__label'))).length;
    expect(await labels('4', 'default', '320')).toBe(4);
    expect(await labels('4', 'default', '264')).toBe(1);
    expect(await labels('8', 'default', 'desktop')).toBe(8);
    expect(await labels('8', 'default', '320')).toBe(1);
    expect(await labels('4', 'compact', 'desktop')).toBe(1);
    const rail = list(page, '8', 'default', '240');
    const current = rail.locator('.ui-steps__item[aria-current="step"] .ui-steps__text');
    await expect(current).toContainText('Review and approve the changes');
    await expect(current).toContainText('Ask two readers');
    const [railBox, currentBox] = [await box(rail), await box(current)];
    expect(Math.round(currentBox.x)).toBe(Math.round(railBox.x));
    expect(Math.round(currentBox.width)).toBe(Math.round(railBox.width));
  });

  test('UIC-STEPS-1.8 UIC-STEPS-2.2 UIC-STEPS-3.2 keeps names, presses and disabled steps in the rail', async ({
    page,
    lab,
  }) => {
    await lab.open('steps', { theme: 'dark' });
    const rail = page.getByRole('list', { name: 'Project, 8 steps, default, 240' });
    await expect(rail.getByRole('listitem').nth(2)).toHaveAttribute('aria-current', 'step');
    const setup = rail.getByRole('button', { name: 'Setup Completed Create the workspace' });
    const implement = rail.getByRole('button', {
      name: 'Implement Has errors Two checks failed',
    });
    await expect(rail.getByRole('button', { name: 'Translate Skipped' })).toBeDisabled();
    const target = await box(setup);
    expect(target.width).toBeGreaterThanOrEqual(24);
    expect(target.height).toBeGreaterThanOrEqual(24);
    await setup.focus();
    await page.keyboard.press('Tab');
    await expect(implement).toBeFocused();
    await expect(implement).toHaveAttribute('data-focus-visible', 'true');
    await lab.expectAccessible();
  });
});
