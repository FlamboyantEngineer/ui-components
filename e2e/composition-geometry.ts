import { expect, type Page } from '@playwright/test';

/** Check recipe layouts while allowing a component's documented contained scroller to clip content. */
export async function expectCompositionGeometry(page: Page, count: number) {
  const sections = page.locator('[data-lab-section]');
  await expect(sections).toHaveCount(count);
  await expect(async () => {
    const problems = await sections.evaluateAll((elements) =>
      elements.flatMap((section) => {
        const root = [...section.children].find(
          (child) =>
            child instanceof HTMLElement &&
            [...child.classList].some((name) => name.startsWith('ui-')),
        );
        if (!(root instanceof HTMLElement)) return ['missing recipe root'];
        const box = root.getBoundingClientRect();
        const issues: string[] = [];
        if (box.width < 100 || box.height < 1) issues.push('collapsed recipe');
        if (
          root.scrollWidth > root.clientWidth + 1 &&
          !/auto|scroll/.test(getComputedStyle(root).overflowX)
        )
          issues.push('root overflow');
        for (const row of root.querySelectorAll<HTMLElement>('.ui-stack, .ui-cluster, .ui-grid')) {
          const children = [...row.children].filter(
            (child): child is HTMLElement =>
              child instanceof HTMLElement && child.getBoundingClientRect().width > 0,
          );
          for (let i = 0; i < children.length; i++) {
            const first = children[i]?.getBoundingClientRect();
            if (!first) continue;
            for (const child of children.slice(i + 1)) {
              const second = child.getBoundingClientRect();
              if (
                Math.min(first.right, second.right) - Math.max(first.left, second.left) > 1 &&
                Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 1
              )
                issues.push('layout children overlap');
            }
          }
        }
        return issues.map((issue) => `${section.getAttribute('data-lab-section')}: ${issue}`);
      }),
    );
    expect(problems).toEqual([]);
    const documentWidth = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.width + 1);
  }).toPass();
}
