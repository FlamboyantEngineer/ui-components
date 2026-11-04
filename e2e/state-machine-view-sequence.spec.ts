import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

function sequence(page: Page, density = 'default'): Locator {
  return page.getByRole('group', { name: `Sequence ${density}`, exact: true });
}

async function geometry(scope: Locator) {
  return scope.evaluate((root) => {
    const content = root.querySelector('.ui-state-machine-view__content');
    const viewport = root.querySelector('.ui-state-machine-view__viewport');
    if (!(content instanceof HTMLElement) || !(viewport instanceof HTMLElement))
      throw new Error('Missing sequence viewport');
    const states = [...root.querySelectorAll<HTMLElement>('.ui-state-machine-view__state')].map(
      (state) => {
        const box = state.getBoundingClientRect();
        return {
          key: state.getAttribute('data-key'),
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      },
    );
    const svg = root.querySelector('svg');
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) throw new Error('Missing sequence SVG geometry');
    const routes = [...root.querySelectorAll<SVGGElement>('.ui-state-machine-view__route')].map(
      (route) => {
        const path = route.querySelector('path');
        if (!path) throw new Error('Missing connector');
        const first = path.getPointAtLength(0).matrixTransform(matrix);
        const last = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
        const arrow = route.querySelector<SVGPathElement>('.ui-state-machine-view__arrow');
        if (!arrow) throw new Error('Missing arrowhead');
        const tip = arrow.getPointAtLength(arrow.getTotalLength() / 2).matrixTransform(matrix);
        return {
          key: route.getAttribute('data-key'),
          direction: route.getAttribute('data-direction'),
          lane: route.getAttribute('data-lane'),
          sourceX: first.x,
          sourceY: first.y,
          targetX: last.x,
          targetY: last.y,
          arrowX: tip.x,
          arrowY: tip.y,
        };
      },
    );
    return {
      states,
      routes,
      rowY: (states[0]?.y ?? 0) - content.getBoundingClientRect().y,
      rowHeight: states[0]?.height ?? 0,
      lanePitch: Number.parseFloat(content.style.getPropertyValue('--ui-sequence-lane-pitch')),
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      svgWidth: svg.getBoundingClientRect().width,
      viewBoxWidth: svg.viewBox.baseVal.width,
    };
  });
}

const identity = (key: string | number) => JSON.stringify([typeof key, String(key)]);
const links = [
  [1, 1, '1'],
  ['1', 1, '1'],
  ['review', '1', 'review'],
  ['ready', 'review', 'ready'],
  ['complete', 'ready', 'complete'],
  ['long', 1, 'complete'],
  ['return', 'complete', 1],
  ['back', 'ready', '1'],
  ['loop', 'review', 'review'],
] as const;

async function expectAttachments(scope: Locator) {
  await expect(async () => {
    const data = await geometry(scope);
    expect(data.svgWidth).toBeCloseTo(data.viewBoxWidth, 2);
    expect(data.routes).toHaveLength(links.length);
    for (const [id, from, to] of links) {
      const route = requireDefined(data.routes.find((item) => item.key === identity(id)));
      const source = requireDefined(data.states.find((item) => item.key === identity(from)));
      const target = requireDefined(data.states.find((item) => item.key === identity(to)));
      expect(route.sourceX).toBeGreaterThan(source.x);
      expect(route.sourceX).toBeLessThan(source.x + source.width);
      expect(route.targetX).toBeGreaterThan(target.x);
      expect(route.targetX).toBeLessThan(target.x + target.width);
      const forward = route.direction === 'forward';
      expect(route.sourceY).toBeCloseTo(source.y + (forward ? 0 : source.height), 2);
      expect(route.targetY).toBeCloseTo(target.y + (forward ? 0 : target.height), 2);
      expect(route.arrowX).toBeCloseTo(route.targetX, 2);
      expect(route.arrowY).toBeCloseTo(route.targetY, 2);
    }
  }).toPass();
}

async function expectSeparateLabels(scope: Locator) {
  await expect(async () => {
    const labels = await scope
      .locator('.ui-state-machine-view__transition-label')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        }),
      );
    for (const [index, label] of labels.entries()) {
      for (const other of labels.slice(index + 1)) {
        expect(
          label.right <= other.left ||
            other.right <= label.left ||
            label.bottom <= other.top ||
            other.bottom <= label.top,
        ).toBe(true);
      }
    }
  }).toPass();
}

for (const density of ['default', 'compact']) {
  test(`UIC-STATE-MACHINE-VIEW-4.1 UIC-STATE-MACHINE-VIEW-4.2 ${density} ordered states and measured lanes`, async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const scope = sequence(page, density);
    await expectAttachments(scope);
    await expectSeparateLabels(scope);
    await expect(async () => {
      const data = await geometry(scope);
      expect(data.states.map(({ key }) => key)).toEqual(
        [1, '1', 'review', 'ready', 'complete'].map(identity),
      );
      expect(new Set(data.states.map(({ y }) => y)).size).toBe(1);
      expect(data.rowHeight).toBe(density === 'compact' ? 32 : 44);
      const first = requireDefined(data.states[0]);
      for (const label of await scope.locator('.ui-state-machine-view__transition-label').all()) {
        const box = requireDefined(await label.boundingBox());
        const direction = await label.getAttribute('data-direction');
        if (direction === 'forward') expect(box.y + box.height).toBeLessThan(first.y);
        else expect(box.y).toBeGreaterThan(first.y + first.height);
      }
      const lanes = data.routes.filter(({ key }) => key === identity(1) || key === identity('1'));
      expect(lanes[0]?.lane).not.toBe(lanes[1]?.lane);
      expect(data.routes.find(({ key }) => key === identity('loop'))?.direction).toBe('forward');
    }).toPass();
  });
}

test('UIC-STATE-MACHINE-VIEW-4.1 UIC-STATE-MACHINE-VIEW-4.5 keeps states-only rows, reorder, empty and single geometry', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = sequence(page);
  const before = (await geometry(scope)).states.map(({ x, width }) => ({ x, width }));
  await page.getByRole('button', { name: 'Toggle sequence transitions' }).click();
  await expect(scope.locator('.ui-state-machine-view__route')).toHaveCount(0);
  expect((await geometry(scope)).states.map(({ x, width }) => ({ x, width }))).toEqual(before);
  await page.getByRole('button', { name: 'Reverse sequence' }).click();
  await expect(async () => {
    expect((await geometry(scope)).states.map(({ key }) => key)).toEqual(
      ['complete', 'ready', 'review', '1', 1].map(identity),
    );
  }).toPass();
  const single = page.getByRole('group', { name: 'Single state', exact: true });
  await expect(single.getByRole('button', { name: 'Only state' })).toHaveAttribute(
    'data-first',
    'true',
  );
  await expect(single.getByRole('button', { name: 'Only state' })).toHaveAttribute(
    'data-last',
    'true',
  );
  expect(
    await single.getByRole('button').evaluate((button) => getComputedStyle(button).clipPath),
  ).toBe('none');
  await expect(page.getByRole('group', { name: 'Empty sequence' }).getByRole('button')).toHaveCount(
    0,
  );
});

test('UIC-STATE-MACHINE-VIEW-4.2 UIC-STATE-MACHINE-VIEW-4.5 remeasures label changes and container-only resize and scroll', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = sequence(page);
  const label = scope.getByRole('button', { name: 'Advance', exact: true });
  const before = requireDefined(await label.boundingBox()).width;
  await page.getByRole('button', { name: 'Change transition label' }).click();
  const changed = scope.getByRole('button', {
    name: 'Advance with an extended description of the next action',
  });
  await expect(async () =>
    expect(requireDefined(await changed.boundingBox()).width).toBeGreaterThan(before * 2),
  ).toPass();
  await page.getByRole('button', { name: 'Toggle sequence width' }).click();
  await expect(async () => {
    const data = await geometry(scope);
    expect(data.clientWidth).toBe(320);
    expect(data.scrollWidth).toBeGreaterThan(data.clientWidth);
    const box = requireDefined(await scope.boundingBox());
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
  }).toPass();
  await expectAttachments(scope);
  await expectSeparateLabels(scope);
  const firstX = requireDefined((await geometry(scope)).states[0]).x;
  await scope.locator('.ui-state-machine-view__viewport').evaluate((viewport) => {
    viewport.scrollLeft = 180;
  });
  await expect(async () =>
    expect(requireDefined((await geometry(scope)).states[0]).x).toBeCloseTo(firstX - 180, 1),
  ).toPass();
  await expectAttachments(scope);
  const contentHeight = await scope
    .locator('.ui-state-machine-view__content')
    .evaluate((content) => content.getBoundingClientRect().height);
  const viewportHeight = await scope
    .locator('.ui-state-machine-view__viewport')
    .evaluate((viewport) => viewport.clientHeight);
  expect(viewportHeight).toBe(contentHeight);
});

test('UIC-STATE-MACHINE-VIEW-4.3 UIC-STATE-MACHINE-VIEW-4.4 activates labels alone and keeps connectors inert', async ({
  page,
  lab,
}) => {
  await lab.open('state-machine-view');
  const scope = sequence(page);
  await scope.getByRole('button', { name: 'Number one' }).focus();
  await page.keyboard.press('Enter');
  await expect(scope.getByRole('button', { name: 'Number one' })).toHaveAttribute(
    'data-selected',
    'true',
  );
  await expect(scope.getByRole('button', { name: 'Text one' })).toHaveAttribute(
    'data-current',
    'true',
  );
  const label = scope.getByRole('button', { name: 'Alternate', exact: true });
  await label.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-lab-output="sequence-action"]')).toHaveText('string:1');
  await label.click({ button: 'right' });
  await expect(page.locator('[data-lab-output="sequence-action"]')).toHaveText('Context string:1');
  await label.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Details for Alternate');
  await page.keyboard.press('Escape');
  await expect(scope.locator('.ui-state-machine-view__route[data-selected]')).toHaveCount(1);
  const hit = await scope
    .locator('.ui-state-machine-view__connector')
    .first()
    .evaluate((path) => {
      if (!(path instanceof SVGPathElement)) throw new Error('Expected a connector');
      const matrix = path.getScreenCTM();
      if (!matrix) throw new Error('Missing route transform');
      const point = path.getPointAtLength(12).matrixTransform(matrix);
      const target = document.elementFromPoint(point.x, point.y);
      return {
        decorative: Boolean(target?.closest('.ui-state-machine-view__routes')),
        pointerEvents: getComputedStyle(path).pointerEvents,
      };
    });
  expect(hit).toEqual({ decorative: false, pointerEvents: 'none' });
  await expect(scope.locator('svg [tabindex]')).toHaveCount(0);
  await lab.expectAccessible('[data-lab-demo="sequence"]');
});
