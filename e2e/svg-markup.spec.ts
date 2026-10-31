import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SvgMarkup } from '../src/components/svg-markup/svg-markup.js';
import { expect, test } from './fixtures.js';

const attack = 'window.unsafe = true';

/** Payloads that run script or load a remote resource if SVG markup reaches the page unfiltered. */
const serverPayloads = [
  `<desc><iframe srcdoc="&lt;script&gt;parent.${attack}&lt;/script&gt;"></iframe></desc>`,
  `<title><img src="x" onerror="${attack}"/></title>`,
  `<desc><![CDATA[</desc><img src="x" onerror="${attack}">]]></desc>`,
  `<foreignObject><img src="x" onerror="${attack}"/></foreignObject>`,
  `<style>@import url(https://remote.invalid/sheet.css);</style>`,
  `<a href="javascript:${attack}"><rect width="4" height="4"/></a>`,
  `<image href="https://remote.invalid/tile.png" width="4" height="4"/>`,
  `<rect width="4" height="4" style="fill: url(https://remote.invalid/a.svg#p)"/>`,
  `<rect width="4" height="4" fill="url(https://remote.invalid/paint.svg#g"/>`,
  `<rect width="4" height="4" fill="url('https://remote.invalid/paint.svg#g'"/>`,
  `<rect width="4" height="4" style="fill: url(&quot;https://remote.invalid/a.svg#p"/>`,
  `<rect width="4" height="4" style="--paint: url(https://remote.invalid/a.svg#p; fill: var(--paint)"/>`,
  `<rect width="4" height="4"><animate attributeName="fill" values="url(#g);url(https://remote.invalid/a.svg#p" dur="1s"/></rect>`,
  `<p><img src="x" onerror="${attack}"/></p>`,
];

test.describe('SVG Markup lab', () => {
  test('UIC-SVG-MARKUP-2.1 UIC-SVG-MARKUP-2.2 draws each source alone and fills every icon size', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const cells = page.locator('table[data-lab-matrix="markup placement"] td[data-lab-cell]');
    expect(await cells.count()).toBe(16);
    for (const markup of ['outline', 'solid', 'multi-path', 'gradient']) {
      const alone = page.locator(`[data-lab-cell="markup=${markup} placement=standalone"] svg`);
      await expect(alone).toHaveClass('ui-svg-markup');
      await expect(alone).toHaveAttribute('viewBox', '0 0 24 24');
      const box = await alone.boundingBox();
      expect(box?.width).toBe(24);
      expect(box?.height).toBe(24);
      for (const [size, pixels] of [
        ['sm', 12],
        ['md', 16],
        ['lg', 20],
      ] as const) {
        const svg = page.locator(
          `[data-lab-cell="markup=${markup} placement=icon ${size}"] .ui-icon > .ui-svg-markup`,
        );
        expect((await svg.boundingBox())?.width).toBe(pixels);
      }
    }
    const stop = page.locator(
      '[data-lab-cell="markup=gradient placement=standalone"] linearGradient stop',
    );
    await expect(stop.first()).toHaveAttribute('stop-color', '#f59e0b');
    const circle = page.locator('[data-lab-cell="markup=gradient placement=standalone"] circle');
    await expect(circle).toHaveAttribute('fill', /^url\(#.+_sunrise\)$/);
  });

  test("UIC-SVG-MARKUP-1.4 keeps each drawing's references away from the page and other drawings", async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const host = page.locator('#lab-host-status');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await host.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    const drawing = page.getByRole('img', { name: 'Drawing aimed at the page' });
    await expect(drawing.locator('set')).toHaveCount(0);
    await expect(drawing.locator('[href], [fill*="url"]')).toHaveCount(0);
    for (const [name, color] of [
      ['Blue tone', 'rgb(37, 99, 235)'],
      ['Pink tone', 'rgb(219, 39, 119)'],
    ] as const) {
      const svg = page.getByRole('img', { name });
      const gradient = await svg.locator('linearGradient').getAttribute('id');
      await expect(svg.locator('rect')).toHaveAttribute('fill', `url(#${gradient ?? ''})`);
      expect(await page.locator(`[id="${gradient ?? ''}"]`).count()).toBe(1);
      const stop = svg.locator('stop').first();
      expect(await stop.evaluate((element) => getComputedStyle(element).stopColor)).toBe(color);
    }
    await lab.expectAccessible();
  });

  test('UIC-SVG-MARKUP-1.4 starts animations from the drawing only, whatever the ID', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const drawing = page.getByRole('img', { name: 'Drawing started by its own bars' });
    const target = drawing.locator('rect').nth(1);
    const fill = () => target.evaluate((element) => getComputedStyle(element).fill);
    await page.getByRole('button', { name: 'Page button 17' }).click();
    await page.getByRole('button', { name: 'Page button ñandú' }).click();
    await page.waitForTimeout(100);
    expect(await fill()).toBe('rgb(37, 99, 235)');
    await drawing.locator('rect').first().click();
    await expect.poll(fill).toBe('rgb(219, 39, 119)');
  });

  test('UIC-SVG-MARKUP-1.1 UIC-SVG-MARKUP-2.1 keeps the space between text spans', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const drawing = page.getByRole('img', { name: 'Orchard map label' });
    await expect(drawing.locator('text')).toHaveText('Orchard map');
    const gap = await drawing.locator('text').evaluate((text: SVGTextElement) => {
      return text.getStartPositionOfChar(8).x - text.getEndPositionOfChar(6).x;
    });
    // `map` starts a space's width after `Orchard` ends.
    expect(gap).toBeGreaterThan(1);
  });

  test('UIC-SVG-MARKUP-2.3 exposes only labelled drawings', async ({ page, lab }) => {
    await lab.open('svg-markup');
    const alone = page.locator('[data-lab-cell="naming=labelled placement=standalone"]');
    await expect(alone.getByRole('img', { name: 'Add city' })).toHaveClass('ui-svg-markup');
    const icon = page.locator('[data-lab-cell="naming=labelled placement=icon"]');
    await expect(icon.getByRole('img', { name: 'Add city' })).toHaveClass('ui-icon');
    await expect(icon.locator('.ui-svg-markup')).toHaveAttribute('aria-hidden', 'true');
    await expect(
      page.locator('[data-lab-cell="naming=decorative placement=standalone"] svg'),
    ).toHaveAttribute('aria-hidden', 'true');
    await lab.expectAccessible();
  });

  test('UIC-SVG-MARKUP-1.2 UIC-SVG-MARKUP-2.4 drops unsafe content and renders nothing without a drawing', async ({
    page,
    lab,
  }) => {
    await lab.open('svg-markup');
    const sanitised = page.getByRole('img', { name: 'Sanitised square' });
    await expect(sanitised.locator('rect')).toHaveCount(1);
    await expect(sanitised.locator('script')).toHaveCount(0);
    await expect(sanitised).not.toHaveAttribute('onload');
    await expect(sanitised.locator('a')).toHaveCount(0);
    const adversarial = page.locator('[data-lab-adversarial] svg');
    await expect(adversarial).toHaveCount(13);
    await expect(
      adversarial.locator(
        'a, foreignObject, style, iframe, img, [href*="remote"], [fill*="remote"], [stroke*="remote"], [style*="remote"]',
      ),
    ).toHaveCount(0);
    expect(await page.evaluate(() => 'unsafe' in window)).toBe(false);
    await expect(page.locator('[data-lab-missing] svg')).toHaveCount(0);
  });

  test('UIC-SVG-MARKUP-1.2 server-rendered markup runs and loads nothing in the browser', async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const drawings = serverPayloads.map((payload) =>
      renderToStaticMarkup(
        createElement(SvgMarkup, {
          markup: `<svg viewBox="0 0 24 24">${payload}<circle r="2"/></svg>`,
        }),
      ),
    );
    await page.setContent(`<!doctype html><body>${drawings.join('')}</body>`);
    await expect(page.locator('svg')).toHaveCount(serverPayloads.length);
    await expect(page.locator('iframe, img, foreignObject, style, a')).toHaveCount(0);
    expect(await page.evaluate(() => 'unsafe' in window)).toBe(false);
    expect(requests.filter((url) => !url.startsWith('about:') && !url.startsWith('data:'))).toEqual(
      [],
    );
  });

  test('UIC-SVG-MARKUP-1.4 server-rendered drawings cannot reach the page or each other', async ({
    page,
  }) => {
    const toneMarkup = (color: string) =>
      `<svg viewBox="0 0 4 4"><defs><linearGradient id="tone"><stop offset="0" stop-color="${color}"/></linearGradient></defs><rect width="4" height="4" fill="url(#tone)"/></svg>`;
    const drawings = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement(SvgMarkup, {
          markup:
            '<svg><set href="#host-status" attributeName="opacity" to="0" begin="0s" dur="indefinite"/></svg>',
        }),
        createElement(SvgMarkup, { markup: toneMarkup('red') }),
        createElement(SvgMarkup, { markup: toneMarkup('blue') }),
      ),
    );
    await page.setContent(
      `<!doctype html><body><svg><rect id="host-status" width="100" height="100" fill="green"/></svg>${drawings}</body>`,
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const host = page.locator('#host-status');
    expect(await host.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    const fills = await page
      .locator('.ui-svg-markup rect')
      .evaluateAll((rects) => rects.map((rect) => rect.getAttribute('fill')));
    expect(new Set(fills).size).toBe(2);
    for (const fill of fills) {
      const id = /#([^)]+)/.exec(fill ?? '')?.[1] ?? '';
      expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
    }
  });
});
