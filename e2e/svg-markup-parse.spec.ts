import { expect, test } from './fixtures.js';

test.describe('SVG Markup parser output', () => {
  test('UIC-SVG-MARKUP-1.1 UIC-SVG-MARKUP-1.2 UIC-SVG-MARKUP-1.3 shows the sanitized tree or null and the cached parse', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const demo = page.locator('[data-lab-demo="parse"]');
    const tree = demo.locator('[data-lab-output="svg-tree"]');
    await expect(tree).toContainText('<circle cx="24" cy="26" r="16" fill="#6a4c93">');
    await expect(tree).toContainText('"plum"');
    await expect(demo.getByRole('img', { name: 'Parsed drawing' })).toBeVisible();
    await expect(demo.locator('[data-lab-output="svg-cache"]')).toHaveText(
      'Repeated parse returns the same tree: true',
    );
    await demo.getByRole('button', { name: 'unsafe' }).click();
    await expect(tree).toContainText('<rect width="48" height="48" fill="#f4a261">');
    // The image stays without its remote source; the link is unwrapped.
    await expect(tree).toContainText('<image>');
    for (const dropped of ['onload', 'script', 'example.com', '<a']) {
      await expect(tree).not.toContainText(dropped);
    }
    await demo.getByRole('button', { name: 'not svg' }).click();
    await expect(tree).toHaveText('null: no <svg> root');
    await demo.getByRole('textbox', { name: 'SVG source' }).fill('<svg><path d="M0 0L8 8"/></svg>');
    await expect(tree).toHaveText('<svg>\n  <path d="M0 0L8 8">');
    await lab.expectAccessible('[data-lab-demo="parse"]');
  });
});
