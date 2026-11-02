import { expect, test } from './fixtures.js';

test.describe('HTML Markup lab coverage', () => {
  test('UIC-HTML-MARKUP-1.1 UIC-HTML-MARKUP-1.7 shows the sanitizer node tree for edited markup under each policy', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const demo = page.locator('[data-lab-demo="sanitizer"]');
    const tree = demo.locator('[data-lab-output="sanitized-tree"]');
    await expect(tree).toContainText('<p class="note">');
    await expect(tree).not.toContainText('onclick');
    await expect(tree).not.toContainText('steal()');
    await expect(tree).toContainText('<a href="/plums" target="_blank" rel="noopener noreferrer">');
    await demo.getByRole('button', { name: 'text only' }).click();
    await expect(tree).not.toContainText('<a');
    await expect(tree).toContainText('"pears"');
    const input = demo.getByRole('textbox', { name: 'Markup to sanitize' });
    await input.fill('<p>Fresh<br>figs</p>');
    await expect(tree).toHaveText('<p>\n  "Fresh"\n  <br>\n  "figs"');
    await expect(demo.locator('[data-lab-output="sanitized-render"] br')).toHaveCount(1);
    await lab.expectAccessible('[data-lab-demo="sanitizer"]');
  });

  test('UIC-HTML-MARKUP-2.3 UIC-HTML-MARKUP-1.7 hides an element when renderElement returns null and keeps trusted image attributes', async ({
    page,
    lab,
  }) => {
    await lab.open('html-markup');
    const hiding = page.locator('[data-lab-demo="hiding"]');
    await expect(hiding).not.toContainText('Internal');
    await expect(hiding.locator('.ui-badge')).toHaveText('@Ana');
    await expect(hiding).toContainText('Pickup at the dock.');
    await hiding.getByRole('button', { name: 'Hide internal notes' }).click();
    await expect(hiding).toContainText('Internal: recount on Friday.');
    await expect(
      page.locator('[data-lab-image-policy="default"] [data-lab-output="image-attributes"]'),
    ).toHaveText('default: loading=lazy referrerpolicy=no-referrer');
    await expect(
      page.locator('[data-lab-image-policy="trusted"] [data-lab-output="image-attributes"]'),
    ).toHaveText('trusted: loading=eager referrerpolicy=origin');
  });
});
