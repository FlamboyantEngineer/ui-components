import { expect, test } from './fixtures.js';

for (const includesFonts of [false, true]) {
  test(`UIC-LABS-1.9 ${includesFonts ? 'loads local variable font faces with an explicit import' : 'makes no font requests with the reference stylesheet alone'}`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'font') requests.push(request.url());
    });
    await page.route('**/font-bundle', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html lang="en" data-reference-document><head>
        <link rel="stylesheet" href="/build/reference.css">
        ${includesFonts ? '<link rel="stylesheet" href="/build/fonts.css">' : ''}
        </head><body><p>Sample text</p></body></html>`,
      }),
    );
    await page.goto('/font-bundle');
    await expect(page.getByText('Sample text', { exact: true })).toBeVisible();
    const loaded = await page.evaluate(async () => {
      for (const family of ['Geist', 'Geist Mono']) {
        for (const style of ['normal', 'italic']) {
          await document.fonts.load(
            `${style} 600 16px "${family}"`,
            'Latin \u0100 \u0416 \u0460 \u1ec7 \u250c',
          );
        }
      }
      await document.fonts.ready;
      return [...document.fonts]
        .filter((font) => font.status === 'loaded')
        .map((font) => ({
          family: font.family.replaceAll(/['"]/g, ''),
          style: font.style,
          weight: font.weight,
        }));
    });
    if (!includesFonts) {
      expect(loaded).toEqual([]);
      expect(requests).toEqual([]);
      return;
    }
    for (const family of ['Geist', 'Geist Mono']) {
      for (const style of ['normal', 'italic'])
        expect(loaded).toContainEqual({ family, style, weight: '100 900' });
    }
    expect(requests.length).toBeGreaterThanOrEqual(4);
    for (const request of requests) {
      expect(new URL(request).origin).toBe(new URL(page.url()).origin);
      expect(new URL(request).pathname).toMatch(/^\/build\/vendor\/fonts\/.+\.woff2$/);
    }
  });
}
