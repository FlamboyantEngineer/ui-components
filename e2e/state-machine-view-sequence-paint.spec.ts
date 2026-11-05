import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

for (const density of ['default', 'compact']) {
  test(`UIC-STATE-MACHINE-VIEW-4.3 UIC-STATE-MACHINE-VIEW-4.4 ${density} paints arrowheads outside states and labels above routes`, async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const scope = page.getByRole('group', { name: `Sequence ${density}`, exact: true });
    const arrows = scope.locator('.ui-state-machine-view__arrow');
    await expect(arrows).toHaveCount(9);
    let lastTarget: { x: number; y: number; label: string } | undefined;
    for (const arrow of await arrows.all()) {
      await arrow.scrollIntoViewIfNeeded();
      const paint = await arrow.evaluate((element) => {
        if (!(element instanceof SVGPathElement)) throw new Error('Expected an arrowhead');
        const matrix = element.getScreenCTM();
        if (!matrix) throw new Error('Missing arrow transform');
        const point = element
          .getPointAtLength(element.getTotalLength() / 4)
          .matrixTransform(matrix);
        const tip = element.getPointAtLength(element.getTotalLength() / 2).matrixTransform(matrix);
        const forward = element.parentElement?.getAttribute('data-direction') === 'forward';
        const state = document
          .elementFromPoint(tip.x, tip.y + (forward ? 2 : -2))
          ?.closest('.ui-state-machine-view__state');
        if (!state) throw new Error('Arrow does not meet a state boundary');
        const box = state.getBoundingClientRect();
        const style = getComputedStyle(element);
        const pointerEvents = style.pointerEvents;
        const stroke = style.stroke;
        const strokeWidth = Number.parseFloat(style.strokeWidth);
        // Enable only hit testing to inspect actual browser paint order at an interior arrow stroke.
        // Geometry, backgrounds and stacking stay exactly as rendered by the reference stylesheet.
        const previous = element.style.pointerEvents;
        element.style.pointerEvents = 'stroke';
        try {
          const hits = document.elementsFromPoint(point.x, point.y);
          return {
            pointerEvents,
            stroke,
            strokeWidth,
            arrowOnTop: hits[0] === element,
            outsideState: forward ? point.y < box.top : point.y > box.bottom,
            target: {
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
              label: state?.querySelector('.ui-state-machine-view__state-label')?.textContent ?? '',
            },
          };
        } finally {
          element.style.pointerEvents = previous;
        }
      });
      expect(paint.pointerEvents).toBe('none');
      expect(paint.stroke).not.toBe('none');
      expect(paint.strokeWidth).toBeGreaterThan(0);
      expect(paint.target.label).not.toBe('');
      expect(paint.arrowOnTop).toBe(true);
      expect(paint.outsideState).toBe(true);
      lastTarget = paint.target;
    }
    const target = requireDefined(lastTarget);
    await page.mouse.click(target.x, target.y);
    await expect(scope.getByRole('button', { name: target.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    for (const label of await scope.locator('.ui-state-machine-view__transition-label').all()) {
      await label.scrollIntoViewIfNeeded();
      expect(
        await label.evaluate((element) => {
          const svg = element.closest('.ui-state-machine-view')?.querySelector('svg');
          if (!svg) throw new Error('Missing routes');
          const previous = svg.style.pointerEvents;
          svg.style.pointerEvents = 'all';
          try {
            const box = element.getBoundingClientRect();
            const hits = document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2);
            return hits.includes(svg) && hits.indexOf(element) < hits.indexOf(svg);
          } finally {
            svg.style.pointerEvents = previous;
          }
        }),
      ).toBe(true);
    }
  });

  test(`UIC-STATE-MACHINE-VIEW-4.1 ${density} preserves accessible description and details`, async ({
    page,
    lab,
  }) => {
    await lab.open('state-machine-view');
    const scope = page.getByRole('group', { name: `Sequence ${density}`, exact: true });
    await expect(scope).toHaveAccessibleDescription('States follow the supplied order.');
    expect(
      await scope.evaluate((element) =>
        element.ariaDetailsElements?.map((details) => details.textContent),
      ),
    ).toEqual(['Choose a state to highlight its outgoing transitions.']);
  });
}
