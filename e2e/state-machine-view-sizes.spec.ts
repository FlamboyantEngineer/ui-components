import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

const sizes = [
  { size: 'xs', height: 28, compactHeight: 24, fontSize: 11 },
  { size: 'sm', height: 36, compactHeight: 28, fontSize: 12 },
  { size: 'md', height: 44, compactHeight: 32, fontSize: 13 },
  { size: 'lg', height: 52, compactHeight: 36, fontSize: 16 },
  { size: 'xl', height: 60, compactHeight: 40, fontSize: 20 },
] as const;
const transitions = [
  { id: 'submit', from: 'Draft', to: 'Review' },
  { id: 'finish', from: 'Review', to: 'Complete' },
  { id: 'return', from: 'Complete', to: 'Draft' },
];

for (const density of ['default', 'compact'] as const) {
  for (const { size, height, compactHeight, fontSize } of sizes) {
    test(`UIC-STATE-MACHINE-VIEW-4.6 ${size} ${density} scales content and preserves boundary attachments`, async ({
      page,
      lab,
    }) => {
      await lab.open('state-machine-view');
      const scope = page.getByRole('group', { name: `Sequence ${size} ${density}`, exact: true });
      await expect(scope).toHaveAttribute('data-size', size);
      await expect(scope).toHaveAttribute('data-density', density);
      await expect(async () => {
        const geometry = await scope.evaluate((root) => {
          const states = [
            ...root.querySelectorAll<HTMLElement>('.ui-state-machine-view__state'),
          ].map((element) => {
            const box = element.getBoundingClientRect();
            return {
              label: element.querySelector('.ui-state-machine-view__state-label')?.textContent,
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              right: box.right,
              height: box.height,
              fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
            };
          });
          const routes = [
            ...root.querySelectorAll<SVGGElement>('.ui-state-machine-view__route'),
          ].map((route) => {
            const path = route.querySelector<SVGPathElement>('.ui-state-machine-view__connector');
            const arrow = route.querySelector<SVGPathElement>('.ui-state-machine-view__arrow');
            const matrix = path?.getScreenCTM();
            if (!path || !arrow || !matrix) throw new Error('Missing route geometry');
            const source = path.getPointAtLength(0).matrixTransform(matrix);
            const target = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
            const tip = arrow.getPointAtLength(arrow.getTotalLength() / 2).matrixTransform(matrix);
            return {
              key: route.getAttribute('data-key'),
              direction: route.getAttribute('data-direction'),
              source: { x: source.x, y: source.y },
              target: { x: target.x, y: target.y },
              tip: { x: tip.x, y: tip.y },
            };
          });
          return { states, routes };
        });
        expect(geometry.states).toHaveLength(3);
        for (const state of geometry.states) {
          expect(state.height).toBe(density === 'compact' ? compactHeight : height);
          expect(state.fontSize).toBe(fontSize);
        }
        expect(geometry.routes).toHaveLength(transitions.length);
        for (const transition of transitions) {
          const route = requireDefined(
            geometry.routes.find((item) => item.key === JSON.stringify(['string', transition.id])),
          );
          const source = requireDefined(
            geometry.states.find((item) => item.label === transition.from),
          );
          const target = requireDefined(
            geometry.states.find((item) => item.label === transition.to),
          );
          const edge = route.direction === 'forward' ? 'top' : 'bottom';
          expect(route.source.y).toBeCloseTo(source[edge], 2);
          expect(route.target.y).toBeCloseTo(target[edge], 2);
          expect(route.target.x).toBeGreaterThan(target.left);
          expect(route.target.x).toBeLessThan(target.right);
          expect(route.tip.x).toBeCloseTo(route.target.x, 2);
          expect(route.tip.y).toBeCloseTo(route.target.y, 2);
        }
      }).toPass();
      await expect(
        scope.getByRole('button', { name: 'Draft', exact: true }),
      ).toHaveAccessibleDescription('Initial state. 2 items');
      const complete = scope.getByRole('button', { name: 'Complete', exact: true });
      await complete.focus();
      await page.keyboard.press('Enter');
      await expect(complete).toHaveAttribute('aria-pressed', 'true');
      await expect(scope.getByRole('button', { name: 'Review', exact: true })).toHaveAttribute(
        'aria-current',
        'step',
      );
    });
  }
}
