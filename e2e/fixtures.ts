import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test as base } from '@playwright/test';
import {
  acceptedEverywhere,
  acceptedIncomplete,
  ungatedIncompleteRules,
} from './axe-incomplete.js';

export interface OpenLabOptions {
  /** `none`, `reference` (default) or a stylesheet URL. */
  stylesheet?: string;
  theme?: string;
  themeAttribute?: string;
}

export interface LabFixture {
  /** Opens `labs/<name>.html` with the given stylesheet and waits until it has rendered and its stylesheet and fonts have loaded. */
  open(name: string, options?: OpenLabOptions): Promise<void>;
  /** Runs axe on the lab content and fails on any violation or unaccepted incomplete result. */
  expectAccessible(selector?: string): Promise<void>;
  /** Page and console errors collected so far; the fixture fails the test if any remain. */
  errors: string[];
}

/** The lab a page shows, from its file name. */
function labName(page: Page): string {
  return new URL(page.url()).pathname.replace(/^.*\//, '').replace(/\.html$/, '');
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
        // Keep every violation and incomplete result; trim the node details of passes. A page
        // without embedded frames runs axe in place, several times faster than the default, which
        // finishes each run in a second page; a page with frames keeps the default, which also
        // scans frames that cannot run scripts. Incomplete results fail unless e2e/axe-incomplete.ts
        // accepts their rule for the lab.
        const results = await new AxeBuilder({ page })
          .include(selector)
          .options({ resultTypes: ['violations', 'incomplete'] })
          .setLegacyMode(page.frames().length === 1)
          .analyze();
        expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual(
          [],
        );
        const accepted = acceptedIncomplete[labName(page)] ?? {};
        const undecided = results.incomplete
          .filter((result) => !ungatedIncompleteRules.has(result.id) && !(result.id in accepted))
          .flatMap((result) =>
            result.nodes.flatMap((node) => {
              const message = [...node.any, ...node.all, ...node.none]
                .map((check) => check.message)
                .join(' ');
              const isAccepted = acceptedEverywhere.some(
                (pattern) =>
                  pattern.rule === result.id &&
                  pattern.message.test(message) &&
                  (pattern.html?.test(node.html) ?? true),
              );
              return isAccepted ? [] : [`${result.id}: ${message} (${node.target.join(' ')})`];
            }),
          );
        expect(undecided, 'incomplete axe results not accepted in e2e/axe-incomplete.ts').toEqual(
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

const themeNames = { system: 'System', light: 'Light', dark: 'Dark', custom: 'Custom' } as const;

/** A theme the lab chrome's switch offers. */
export type LabTheme = keyof typeof themeNames;

/** The lab chrome's theme switch segment for `theme`, to press or to check. */
export function themeSegment(page: Page, theme: LabTheme): Locator {
  return page
    .locator('#lab-chrome')
    .getByRole('radiogroup', { name: 'Theme', exact: true })
    .getByRole('radio', { name: themeNames[theme], exact: true });
}

export async function waitForLab(page: Page): Promise<void> {
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-lab-ready', 'true');
  await expect(root).toHaveAttribute('data-lab-stylesheet-state', /^(none|loaded)$/);
  await page.waitForFunction(() => {
    const fonts = document.getElementById('ui-lab-fonts');
    return fonts instanceof HTMLLinkElement && fonts.sheet !== null;
  });
  // The lab fonts load once a layout uses them and then move text; settle them before measuring.
  await page.evaluate(async () => {
    void document.body.offsetHeight;
    await document.fonts.ready;
  });
}

/** Where a lab locator searches: the whole page or a part of it. */
export type LabScope = Page | Locator;

/** A `StateMatrix` cell's address: its `axis=value` pairs in axis order, as text or as an object. */
export type CellAddress = string | Readonly<Record<string, string>>;

/** The selector of the lab section wrapped in `data-lab-family="<family>"`, for a string selector. */
export function familySelector(family: string): string {
  return `[data-lab-family="${family}"]`;
}

/** The selector of the `StateMatrix` cell at `address`, for a string selector. */
export function cellSelector(address: CellAddress): string {
  const text =
    typeof address === 'string'
      ? address
      : Object.entries(address)
          .map(([axis, value]) => `${axis}=${value}`)
          .join(' ');
  return `[data-lab-cell="${text}"]`;
}

/** The lab section wrapped in `data-lab-family="<family>"`, which holds one or more matrices. */
export function matrix(scope: LabScope, family: string): Locator {
  return scope.locator(familySelector(family));
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
  const within = family === undefined ? scope : matrix(scope, family);
  return within.locator(cellSelector(address));
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
