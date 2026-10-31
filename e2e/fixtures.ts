import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Locator, type Page } from '@playwright/test';

export interface OpenLabOptions {
  /** `none`, `reference` (default) or a stylesheet URL. */
  stylesheet?: string;
  theme?: string;
  themeAttribute?: string;
}

export interface LabFixture {
  /** Opens `labs/<name>.html` with the given stylesheet and waits until it has rendered and loaded. */
  open(name: string, options?: OpenLabOptions): Promise<void>;
  /** Runs axe on the lab content and fails on any violation. */
  expectAccessible(selector?: string): Promise<void>;
  /** Page and console errors collected so far; the fixture fails the test if any remain. */
  errors: string[];
}

export const test = base.extend<{ lab: LabFixture }>({
  lab: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use({
      errors,
      async open(name, options) {
        await page.goto(formatLabUrl(name, options));
        await waitForLab(page);
      },
      async expectAccessible(selector = '#lab-root') {
        // Entrance fades temporarily lower contrast; inspect the settled drawing without waiting
        // for perpetual spinners or other infinite animations.
        await page.evaluate(async () => {
          const animations = document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                Number.isFinite(animation.effect?.getComputedTiming().endTime),
            );
          await Promise.allSettled(animations.map((animation) => animation.finished));
        });
        // Keep every violation; trim node details we do not inspect in other results. A page
        // without embedded frames runs axe in place, several times faster than the default, which
        // finishes each run in a second page; a page with frames keeps the default, which also
        // scans frames that cannot run scripts.
        const results = await new AxeBuilder({ page })
          .include(selector)
          .options({ resultTypes: ['violations'] })
          .setLegacyMode(page.frames().length === 1)
          .analyze();
        expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual(
          [],
        );
      },
    });
    expect(errors, 'page and console errors').toEqual([]);
  },
});

export function formatLabUrl(name: string, options: OpenLabOptions = {}): string {
  const query = new URLSearchParams();
  query.set('stylesheet', options.stylesheet ?? 'reference');
  if (options.theme) query.set('theme', options.theme);
  if (options.themeAttribute) query.set('themeAttribute', options.themeAttribute);
  return `${name}.html?${query.toString()}`;
}

export async function waitForLab(page: Page): Promise<void> {
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-lab-ready', 'true');
  await expect(root).toHaveAttribute('data-lab-stylesheet-state', /^(none|loaded)$/);
}

/** Where a lab locator searches: the whole page or a part of it. */
export type LabScope = Page | Locator;

/** A `StateMatrix` cell's address: its `axis=value` pairs in axis order, as text or as an object. */
export type CellAddress = string | Readonly<Record<string, string>>;

/** The lab section wrapped in `data-lab-family="<family>"`, which holds one or more matrices. */
export function matrix(scope: LabScope, family: string): Locator {
  return scope.locator(`[data-lab-family="${family}"]`);
}

/**
 * The `StateMatrix` cell at `address` (`variant=primary size=md`, or `{ variant: 'primary', size:
 * 'md' }`), within the `family` section when given.
 */
export function matrixCell(
  scope: LabScope,
  address: CellAddress,
  { family }: { family?: string } = {},
): Locator {
  const text =
    typeof address === 'string'
      ? address
      : Object.entries(address)
          .map(([axis, value]) => `${axis}=${value}`)
          .join(' ');
  const within = family === undefined ? scope : matrix(scope, family);
  return within.locator(`[data-lab-cell="${text}"]`);
}

/**
 * The reference theme's control height for `size` in CSS pixels, read from
 * `--ref-control-height-<size>` (in rem) so a change to the scale fails only the scale's tests.
 */
export async function controlHeight(page: Page, size: 'xs' | 'sm' | 'md' | 'lg'): Promise<number> {
  return page.evaluate((name) => {
    const style = getComputedStyle(document.documentElement);
    return (
      Number.parseFloat(style.getPropertyValue(`--ref-control-height-${name}`)) *
      Number.parseFloat(style.fontSize)
    );
  }, size);
}

export { expect };
