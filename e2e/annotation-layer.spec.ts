import type { Locator } from '@playwright/test';
import { cellSelector, expect, test } from './fixtures.js';

const cell = (id: string) => `${cellSelector(id)} .ui-annotation-layer`;

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not visible');
  return box;
}

/** The active card sits level with its anchor, unless the card above it pushes it down. */
async function expectLevelOrPushed(card: Locator, previous: Locator, anchor: Locator) {
  const box = await boxOf(card);
  const above = await boxOf(previous);
  const target = await boxOf(anchor);
  expect(box.y).toBeGreaterThanOrEqual(target.y - 1);
  const pushedTo = above.y + above.height + 8;
  expect(Math.min(Math.abs(box.y - target.y), Math.abs(box.y - pushedTo))).toBeLessThan(1);
}

test.describe('Annotation Layer lab', () => {
  test('UIC-ANNOTATION-LAYER-1.1 UIC-ANNOTATION-LAYER-1.2 draws marks over rectangles and elements', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const layer = page.locator(cell('active=none gap=8'));
    const marks = layer.locator('.ui-annotation-layer__mark');
    await expect(marks).toHaveCount(3);
    await expect(layer.locator('.ui-annotation-layer__marks')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const phrase = await boxOf(layer.locator('[id$="-butter"]'));
    const mark = await boxOf(marks.nth(1));
    expect(Math.abs(mark.x - phrase.x)).toBeLessThan(1);
    expect(Math.abs(mark.y - phrase.y)).toBeLessThan(1);
    expect(Math.abs(mark.width - phrase.width)).toBeLessThan(1);
    const plan = await boxOf(layer.getByRole('img', { name: 'Kitchen plan' }));
    const region = await boxOf(marks.nth(0));
    expect(region.x - plan.x).toBeCloseTo(164, 0);
    expect(region.y - plan.y).toBeCloseTo(8, 0);
  });

  test('UIC-ANNOTATION-LAYER-2.1 UIC-ANNOTATION-LAYER-2.2 stacks cards beside their anchors', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const layer = page.locator(cell('active=none gap=8'));
    const margin = layer.getByRole('list', { name: 'Notes, none active, gap 8' });
    const cards = margin.locator('.ui-annotation-layer__card');
    await expect(cards).toHaveCount(4);
    await expect(cards.nth(3)).toHaveAttribute('data-orphaned', 'true');
    const content = await boxOf(layer.locator('[data-lab-notes-content]'));
    const first = await boxOf(cards.nth(0));
    expect(first.x).toBeGreaterThan(content.x + content.width);
    const plan = await boxOf(layer.getByRole('img', { name: 'Kitchen plan' }));
    expect(Math.abs(first.y - (plan.y + 8))).toBeLessThan(1);
    for (let index = 1; index < 4; index += 1) {
      const above = await boxOf(cards.nth(index - 1));
      const below = await boxOf(cards.nth(index));
      expect(below.y - (above.y + above.height)).toBeGreaterThanOrEqual(7.5);
    }
    const wide = page.locator(cell('active=none gap=24')).locator('.ui-annotation-layer__card');
    const top = await boxOf(wide.nth(1));
    const next = await boxOf(wide.nth(2));
    expect(next.y - (top.y + top.height)).toBeGreaterThanOrEqual(23.5);
    const marginBox = await boxOf(margin);
    const last = await boxOf(cards.nth(3));
    expect(marginBox.y + marginBox.height).toBeGreaterThanOrEqual(last.y + last.height - 1);
  });

  test('UIC-ANNOTATION-LAYER-1.3 UIC-ANNOTATION-LAYER-2.2 activates a pressed mark and aligns its card', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const demo = page.locator('[data-lab-demo="live"]');
    const phrase = demo.locator('#live-blind');
    await phrase.click();
    await expect(demo.locator('[data-lab-active]')).toHaveText('blind');
    const card = demo.locator('.ui-annotation-layer__card').filter({ hasText: 'Fifteen minutes' });
    await expect(card).toHaveAttribute('data-active', 'true');
    await expect(demo.locator('.ui-annotation-layer__mark[data-active]')).toHaveCount(1);
    const cards = demo.locator('.ui-annotation-layer__card');
    await expect(async () => {
      await expectLevelOrPushed(card, cards.nth(1), phrase);
    }).toPass();
  });

  test('UIC-ANNOTATION-LAYER-2.3 UIC-ANNOTATION-LAYER-2.4 moves between cards and follows moved anchors', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const demo = page.locator('[data-lab-demo="live"]');
    const cards = demo.locator('.ui-annotation-layer__card');
    const intro = demo.getByRole('button', { name: 'Add an intro' });
    await intro.focus();
    await page.keyboard.press('Tab');
    await expect(cards.nth(0)).toBeFocused();
    await expect(demo.locator('[data-lab-active]')).toHaveText('kitchen');
    await page.keyboard.press('ArrowDown');
    await expect(cards.nth(1)).toBeFocused();
    await expect(demo.locator('[data-lab-active]')).toHaveText('butter');
    await page.keyboard.press('End');
    await expect(cards.nth(3)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(cards.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');

    const phrase = demo.locator('#live-butter');
    const before = await boxOf(phrase);
    await intro.click();
    await expect(demo.getByRole('button', { name: 'Remove the intro' })).toBeVisible();
    await expect(async () => {
      const anchor = await boxOf(phrase);
      const mark = await boxOf(demo.locator('.ui-annotation-layer__mark[data-active]'));
      expect(anchor.y).toBeGreaterThan(before.y + 10);
      expect(Math.abs(mark.y - anchor.y)).toBeLessThan(1);
      await expectLevelOrPushed(cards.nth(1), cards.nth(0), phrase);
    }).toPass();
  });

  test('UIC-ANNOTATION-LAYER-1.4 follows a phrase moved by its own content and a nested scroll', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const demo = page.locator('[data-lab-demo="scrolling"]');
    const layer = demo.locator('.ui-annotation-layer');
    const phrase = demo.locator('#scroll-step');
    const mark = demo.locator('.ui-annotation-layer__mark');
    const expectMarkOnPhrase = async () => {
      await expect(async () => {
        const anchor = await boxOf(phrase);
        const box = await boxOf(mark);
        expect(Math.abs(box.y - anchor.y)).toBeLessThan(1);
        expect(Math.abs(box.x - anchor.x)).toBeLessThan(1);
      }).toPass();
    };
    await expectMarkOnPhrase();
    const offsetInLayer = async () => (await boxOf(phrase)).y - (await boxOf(layer)).y;
    const layerBefore = await boxOf(layer);
    const before = await offsetInLayer();
    await demo.getByRole('button', { name: 'Add a step above' }).press('Enter');
    await expect(demo.getByText('Added step 1')).toBeVisible();
    expect(await offsetInLayer()).toBeGreaterThan(before + 10);
    expect((await boxOf(layer)).height).toBe(layerBefore.height);
    await expectMarkOnPhrase();
    await demo.getByRole('region', { name: 'Steps' }).evaluate((node) => {
      node.scrollTop = 60;
    });
    await expectMarkOnPhrase();
    await phrase.click();
    await expect(demo.locator('[data-lab-active]')).toHaveText('fold');
  });

  test('UIC-ANNOTATION-LAYER-1.2 UIC-ANNOTATION-LAYER-1.3 aligns and hits a mark on a zoomed surface', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const demo = page.locator('[data-lab-demo="zoomed"]');
    const phrase = demo.locator('#zoomed-glaze');
    const mark = demo.locator('.ui-annotation-layer__mark');
    const card = demo.locator('.ui-annotation-layer__card');
    const active = demo.locator('[data-lab-active]');
    for (const zoom of ['Stretch 150% by 200%', 'Zoom 150%', 'Actual size']) {
      await demo.getByRole('button', { name: zoom }).click();
      await expect(demo.locator(`[data-lab-zoom="${zoom}"]`)).toBeVisible();
      await expect
        .poll(async () => {
          const [target, drawn] = [await boxOf(phrase), await boxOf(mark)];
          return [drawn.x - target.x, drawn.y - target.y, drawn.width - target.width].map(
            (difference) => Math.abs(difference) < 1,
          );
        })
        .toEqual([true, true, true]);
      const target = await boxOf(phrase);
      expect(Math.abs((await boxOf(card)).y - target.y)).toBeLessThan(1);
      // Just past the phrase's left and bottom edges hits nothing; just inside them, the note.
      await page.mouse.click(target.x - 3, target.y + target.height / 2);
      await page.mouse.click(target.x + target.width / 2, target.y + target.height + 3);
      await expect(active).toHaveText('none');
      await page.mouse.click(target.x + 2, target.y + target.height - 2);
      await expect(active).toHaveText('glaze');
      await demo.getByRole('button', { name: 'Clear' }).click();
    }
  });

  test('is accessible', async ({ lab }) => {
    await lab.open('annotation-layer');
    await lab.expectAccessible();
  });

  test('UIC-ANNOTATION-LAYER-1.2 UIC-PORTAL-1.8 anchors to targets inside its own shadow root', async ({
    page,
    lab,
  }) => {
    await lab.open('annotation-layer');
    const demo = page.locator('[data-lab-demo="shadow-notes"]');
    await demo.scrollIntoViewIfNeeded();
    const marks = demo.locator('.ui-annotation-layer__mark');
    const card = demo.locator('.ui-annotation-layer__card');
    await expect(marks).toHaveCount(1);
    await expect(card).not.toHaveAttribute('data-orphaned', 'true');
    const phrase = await boxOf(demo.locator('#shadow-blind'));
    const mark = await boxOf(marks.first());
    expect(Math.abs(mark.y - phrase.y)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Remove the phrase' }).click();
    await expect(marks).toHaveCount(0);
    await expect(card).toHaveAttribute('data-orphaned', 'true');
    await page.getByRole('button', { name: 'Restore the phrase' }).click();
    await expect(marks).toHaveCount(1);
    await expect(card).not.toHaveAttribute('data-orphaned', 'true');
  });
});
