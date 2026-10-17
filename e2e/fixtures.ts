import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

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
        const results = await new AxeBuilder({ page }).include(selector).analyze();
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

export { expect };
