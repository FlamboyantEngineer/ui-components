import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

/** A state mark drawn as a tint, with the same thin border on every edge. */
async function expectEvenEdges(target: Locator) {
  const edges = await target.evaluate((node) => {
    const style = getComputedStyle(node);
    return [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ];
  });
  expect(edges).toEqual(['1px', '1px', '1px', '1px']);
}

test.describe('reference stylesheet right to left', () => {
  test('UIC-LABS-3.1 tints nested condition groups and problem lists instead of a one-sided bar', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const group = page
      .locator('[data-lab-demo="rtl"] .ui-condition-builder__group[data-depth="2"]')
      .first();
    await expectEvenEdges(group);

    await lab.open('problem-list');
    await expectEvenEdges(page.locator('[data-lab-demo="rtl"] .ui-problem-list'));
  });

  test('UIC-LABS-3.1 mirrors the attachment corner buttons and the feed line', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const attachment = page.locator('[data-lab-demo="rtl"] .ui-chat-attachment');
    const download = await attachment.locator('.ui-chat-attachment__download').boundingBox();
    const remove = await attachment.locator('.ui-chat-attachment__remove').boundingBox();
    expect(download?.x ?? 0).toBeGreaterThan(remove?.x ?? 0);
    await lab.expectAccessible('[data-lab-demo="rtl"]');

    await lab.open('activity-feed');
    const entry = page.locator('[data-lab-demo="rtl"] .ui-activity-feed__entry').first();
    // The line's inset from the entry's right edge, the start edge right to left.
    const inset = await entry.evaluate((node) => getComputedStyle(node, '::before').right);
    expect(inset).toBe('11px');
  });

  test('UIC-LABS-1.6 UIC-LABS-3.1 marks the current page by tint and a thin frame, not an edge bar', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const link = page.locator('[data-lab-demo="rtl"] .ui-navigation-rail__link[data-current]');
    await expect(link).toHaveCSS('box-shadow', 'none');
    await expect(link).toHaveCSS('outline-style', 'solid');
    await expect(link).toHaveCSS('outline-width', '1px');
    await lab.expectAccessible('[data-lab-demo="rtl"]');
  });

  test('UIC-LABS-3.1 marks board column moves and step connectors on the start side, and tints uncovered headers', async ({
    page,
    lab,
  }) => {
    await lab.open('board');
    const column = page.locator('[data-lab-demo="rtl"] .ui-board__column').first();
    // The indicator is the drag's transient state; set it as a drop over the column would.
    await column.evaluate((node) => {
      node.setAttribute('data-drop-target', '');
      node.setAttribute('data-position', 'before');
    });
    await expect(column).toHaveCSS('box-shadow', / -3px 0px 0px 0px inset$/);
    await column.evaluate((node) => node.setAttribute('data-position', 'after'));
    await expect(column).toHaveCSS('box-shadow', / 3px 0px 0px 0px inset$/);

    await lab.open('relation-matrix');
    const uncovered = page
      .locator('[data-lab-demo="rtl"] .ui-relation-matrix__row-header[data-uncovered]')
      .first();
    await expect(uncovered).toHaveCSS('box-shadow', 'none');
    await expect(uncovered).toHaveCSS('font-weight', '600');
    await lab.expectAccessible('[data-lab-demo="rtl"]');

    await lab.open('steps');
    const connector = page.locator('[data-lab-demo="rtl"] .ui-steps__connector').first();
    await expect(connector).toHaveCSS('margin-right', '12px');
    await expect(connector).toHaveCSS('margin-left', '0px');
    await lab.expectAccessible('[data-lab-demo="rtl"]');
  });

  test('UIC-LABS-3.1 tints duplicate mapping columns and fades skeletons toward the end', async ({
    page,
    lab,
  }) => {
    await lab.open('mapping-table');
    const duplicate = page
      .locator(
        '[data-lab-demo="rtl"] .ui-mapping-table__row[data-duplicate] > .ui-mapping-table__column',
      )
      .first();
    await expect(duplicate).toHaveCSS('box-shadow', 'none');
    await expect(duplicate).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await lab.expectAccessible('[data-lab-demo="rtl"]');

    await lab.open('card');
    const skeleton = page.locator('[data-lab-demo="rtl"] .ui-card__skeleton');
    await expect(skeleton).toHaveCSS('mask-image', /^linear-gradient\(to left,/);

    await lab.open('user-card');
    const loading = page.locator('[data-lab-demo="rtl"] .ui-user-card__skeleton');
    await expect(loading).toHaveCSS('mask-image', /^linear-gradient\(to left,/);
  });
});

test.describe('reference stylesheet state emphasis', () => {
  /** No border thicker than 1px on any edge and no inset bar: the mark is a tint, weight or marker. */
  async function expectNoEdgeBar(target: Locator) {
    const marks = await target.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        widest: Math.max(
          ...[
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ].map((width) => Number.parseFloat(width)),
        ),
        insetBar: /inset/.test(style.boxShadow) && /(^|\s)-?[2-9]px 0px 0px/.test(style.boxShadow),
      };
    });
    expect(marks.insetBar).toBe(false);
    expect(marks.widest).toBeLessThanOrEqual(1);
  }

  const cases = [
    ['tree', '.ui-tree__item[data-current]'],
    ['navigation-rail', '.ui-navigation-rail__link[data-current]'],
    ['outline', '.ui-outline__item[data-current] > .ui-outline__row > .ui-outline__link'],
    ['tree-compare', '.ui-tree-compare__count'],
    ['problem-list', '.ui-problem-list'],
    ['condition-builder', '.ui-condition-builder__group:not([data-depth="1"])'],
    ['change-list', '.ui-change-list__side'],
    ['comment-thread', '.ui-comment-thread__quote'],
  ] as const;
  for (const [name, selector] of cases) {
    test(`UIC-LABS-3.1 marks ${name} state without a one-sided bar`, async ({ page, lab }) => {
      await lab.open(name);
      const marked = page.locator(selector);
      await expect(marked.first()).toBeAttached();
      for (const target of (await marked.all()).slice(0, 6)) await expectNoEdgeBar(target);
    });
  }

  test('UIC-LABS-3.1 marks the current text-diff change without a one-sided bar', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const diff = matrixCell(page, 'content=edited layout=unified');
    await diff.getByRole('button', { name: 'Next change' }).click();
    const cells = diff.locator('.ui-text-diff__line[data-current] > td');
    await expect(cells.first()).toBeAttached();
    for (const target of await cells.all()) await expectNoEdgeBar(target);
  });
});
