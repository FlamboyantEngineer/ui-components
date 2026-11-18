import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

interface FaceBox {
  label: string;
  top: number;
  height: number;
  units: number;
}

/** Each face's label, position and height, and the inner width and ratio of its stack. */
async function measure(stack: Locator) {
  return stack.evaluate((list) => {
    const ratio = Number(getComputedStyle(list).getPropertyValue('--ui-equipment-stack-ratio'));
    const faces = [...list.querySelectorAll<HTMLElement>('.ui-equipment-stack__face')].map(
      (face): FaceBox => {
        const box = face.getBoundingClientRect();
        return {
          label: face.querySelector('.ui-equipment-stack__label')?.textContent ?? '',
          top: box.top,
          height: box.height,
          units: Number(face.style.getPropertyValue('--ui-equipment-stack-units')),
        };
      },
    );
    return { width: list.clientWidth, ratio, faces };
  });
}

/** Fails unless every face is `units` tall at one unit per `width / ratio`, stacked without gaps. */
function expectToScale({ width, ratio, faces }: Awaited<ReturnType<typeof measure>>) {
  expect(faces.length).toBeGreaterThan(0);
  for (const [index, face] of faces.entries()) {
    expect(face.height).toBeCloseTo((width / ratio) * face.units, 0);
    const previous = faces[index - 1];
    if (previous) expect(face.top).toBeCloseTo(previous.top + previous.height, 0);
  }
}

test.describe('Equipment Stack lab', () => {
  test('UIC-EQUIPMENT-STACK-1.1 UIC-EQUIPMENT-STACK-1.2 UIC-EQUIPMENT-STACK-2.1 draws ordered faces to scale at every width', async ({
    page,
    lab,
  }) => {
    await lab.open('equipment-stack');
    for (const width of ['240', '420']) {
      const stack = matrixCell(page, `width=${width}`).getByRole('list', {
        name: `Bench at ${width}px`,
      });
      const measured = await measure(stack);
      expect(measured.ratio).toBe(10);
      expect(measured.faces.map((face) => face.units)).toEqual([1, 2, 1, 1.5, 0.5]);
      expect(measured.faces.map((face) => face.label)).toEqual([
        'Network switch',
        'Bench meter',
        'Position 4',
        'Power supply',
        'Cable shelf with a label longer than its face',
      ]);
      expectToScale(measured);
      const meter = stack.getByRole('listitem').nth(1);
      await expect(meter.locator('.ui-equipment-stack__readout')).toHaveText('12.004 V');
      await expect(meter.locator('.ui-equipment-stack__status')).toHaveText('Idle');
    }
  });

  test('UIC-EQUIPMENT-STACK-1.3 keeps a missing face height and shows its placeholder', async ({
    page,
    lab,
  }) => {
    await lab.open('equipment-stack');
    const withPlaceholder = matrixCell(page, 'placeholder=with').getByRole('list');
    const missing = withPlaceholder.locator('.ui-equipment-stack__face[data-missing]');
    await expect(missing).toHaveText('Position 2Not fitted');
    await expect(missing.locator('.ui-equipment-stack__readout')).toHaveCount(0);
    expectToScale(await measure(withPlaceholder));

    const without = matrixCell(page, 'placeholder=without').getByRole('list');
    await expect(without.locator('.ui-equipment-stack__face[data-missing]')).toHaveText(
      'Position 2',
    );
    expectToScale(await measure(without));
  });

  test('UIC-EQUIPMENT-STACK-2.2 keeps order and proportions while its box and the viewport scroll and resize', async ({
    page,
    lab,
  }) => {
    await lab.open('equipment-stack');
    const scroller = page.locator('[data-lab-scroller]');
    const stack = scroller.getByRole('list', { name: 'Twenty faces' });
    const before = await measure(stack);
    expectToScale(before);
    const labels = before.faces.map((face) => face.label);
    expect(labels).toEqual(Array.from({ length: 20 }, (_, index) => `Face ${index + 1}`));
    const total = before.faces.reduce((sum, face) => sum + face.height, 0);
    expect(total).toBeGreaterThan(260);

    await scroller.focus();
    await page.keyboard.press('End');
    await expect(async () => {
      const scrolled = await scroller.evaluate((box) => box.scrollTop);
      expect(scrolled).toBeGreaterThan(0);
      const after = await measure(stack);
      expect(after.faces.map((face) => face.label)).toEqual(labels);
      expect(after.faces.map((face) => face.height)).toEqual(
        before.faces.map((face) => face.height),
      );
      expectToScale(after);
    }).toPass();

    await page.mouse.wheel(0, 400);
    await page.setViewportSize({ width: 360, height: 700 });
    await expect(async () => {
      const resized = await measure(stack);
      expect(resized.width).toBeLessThan(before.width);
      expect(resized.faces.map((face) => face.label)).toEqual(labels);
      expectToScale(resized);
    }).toPass();
  });

  test('UIC-EQUIPMENT-STACK-1.1 follows reordered, added and updated faces by key', async ({
    page,
    lab,
  }) => {
    await lab.open('equipment-stack');
    const demo = page.locator('[data-lab-changing]');
    const stack = demo.getByRole('list', { name: 'Changing bench' });
    const meter = stack.getByRole('listitem').filter({ hasText: 'Bench meter' });
    await meter.evaluate((face) => face.setAttribute('data-lab-marked', ''));

    await demo.getByRole('button', { name: 'Reverse' }).click();
    const reversed = await measure(stack);
    expect(reversed.faces.map((face) => face.label)).toEqual([
      'Cable shelf with a label longer than its face',
      'Power supply',
      'Position 4',
      'Bench meter',
      'Network switch',
    ]);
    expectToScale(reversed);
    await expect(stack.locator('[data-lab-marked]')).toContainText('Bench meter');

    await demo.getByRole('button', { name: 'Toggle spare' }).press('Enter');
    await expect(stack.getByRole('listitem').nth(2)).toContainText('Spare analyser');
    expectToScale(await measure(stack));

    await demo.getByRole('button', { name: 'New reading' }).click();
    await expect(stack.locator('[data-lab-marked] .ui-equipment-stack__readout')).toHaveText(
      '12.129 V',
    );
  });

  test('UIC-EQUIPMENT-STACK-3.1 names each stack and passes axe', async ({ page, lab }) => {
    await lab.open('equipment-stack');
    await expect(page.getByRole('list', { name: 'Nothing mounted' })).toHaveCount(1);
    await expect(
      page.getByRole('list', { name: 'Nothing mounted' }).getByRole('listitem'),
    ).toHaveCount(0);
    await lab.expectAccessible();
  });
});
