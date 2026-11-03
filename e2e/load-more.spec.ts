import { expect, test, matrixCell, controlHeight } from './fixtures.js';

test.describe('Load More lab', () => {
  test('UIC-LOAD-MORE-1.1 UIC-LOAD-MORE-1.2 UIC-LOAD-MORE-1.3 draws small buttons with counts and names', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const counted = matrixCell(page, 'state=idle count=12 remaining').locator('.ui-load-more');
    await expect(counted).toHaveText('Load more (12 remaining)');
    await expect(counted).toHaveAccessibleName('Load more (12 remaining) messages');
    await expect(counted).toHaveClass(/ui-button/);
    const box = await counted.boundingBox();
    expect(box?.height).toBe(await controlHeight(page, 'sm'));
    await expect(matrixCell(page, 'state=idle count=zero').locator('.ui-load-more')).toHaveText(
      'Load more (0 remaining)',
    );
    await expect(
      matrixCell(page, 'state=disabled count=no count').locator('.ui-load-more'),
    ).toBeDisabled();
    const pending = matrixCell(page, 'state=pending count=no count').locator('.ui-load-more');
    await expect(pending).toHaveAttribute('aria-disabled', 'true');
    await expect(pending.locator('.ui-button__spinner')).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-LOAD-MORE-1.4 pages by keyboard, keeps focus while pending and refuses repeats', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="paged"]');
    const items = demo.locator('[data-lab-output="items"] li');
    const button = demo.locator('[data-lab-action="load"]');
    const deliver = demo.locator('[data-lab-action="deliver"]');
    await expect(items).toHaveCount(4);
    await expect(button).toHaveText('Load more (8 remaining)');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('data-pending', 'true');
    await expect(button).toBeFocused();
    await expect(button).toHaveText('Load more (8 remaining)');
    await page.keyboard.press(' ');
    await page.keyboard.press('Enter');
    await deliver.click();
    await expect(items).toHaveCount(8);
    await expect(button).not.toHaveAttribute('data-pending');
    await expect(button).toHaveText('Load more (4 remaining)');
    await expect(deliver).toBeDisabled();
    await button.focus();
    await page.keyboard.press(' ');
    await expect(button).toHaveAttribute('data-pending', 'true');
    await deliver.click();
    await expect(items).toHaveCount(12);
    await expect(demo.locator('[data-lab-output="done"]')).toBeVisible();
    await expect(button).toHaveCount(0);
  });

  test('UIC-LOAD-MORE-1.7 UIC-MEASUREMENT-4.1 UIC-COLLECTIONS-1.3 loads the next page as the control scrolls into view', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="endless"]');
    const scroller = demo.locator('[data-lab-scroller]');
    const items = demo.locator('[data-lab-output="cities"] li');
    const button = demo.locator('.ui-load-more');
    const deliver = demo.locator('[data-lab-action="deliver-cities"]');
    const scrollToEnd = () =>
      scroller.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });

    await scroller.scrollIntoViewIfNeeded();
    await expect(items).toHaveCount(8);
    await expect(scroller).toBeInViewport();
    await expect(button).not.toBeInViewport();
    await expect(button).not.toHaveAttribute('data-pending');
    await expect(deliver).toBeDisabled();

    for (const count of [16, 24]) {
      await scrollToEnd();
      await expect(button).toHaveAttribute('data-pending', 'true');
      await expect(button).not.toBeFocused();
      await deliver.click();
      await expect(items).toHaveCount(count);
      if (count < 24) {
        await expect(button).not.toHaveAttribute('data-pending');
        await expect(button).toHaveText(`Load more (${24 - count} remaining)`);
      }
    }
    await expect(demo.locator('[data-lab-output="done"]')).toBeVisible();
    await expect(button).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-LOAD-MORE-1.8 UIC-MEASUREMENT-4.3 requests the next page ahead of the scroll position', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="ahead"]');
    const scroller = demo.locator('[data-lab-scroller]');
    const button = demo.locator('.ui-load-more');
    await scroller.scrollIntoViewIfNeeded();
    await expect(button).not.toHaveAttribute('data-pending');
    await scroller.evaluate(async (node: HTMLElement) => {
      const control = node.querySelector('.ui-load-more') as HTMLElement;
      node.scrollTop = control.offsetTop - node.offsetTop - node.clientHeight - 120;
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    await expect(button).not.toHaveAttribute('data-pending');
    const gap = await scroller.evaluate((node: HTMLElement) => {
      const control = node.querySelector('.ui-load-more') as HTMLElement;
      node.scrollTop = control.offsetTop - node.offsetTop - node.clientHeight - 60;
      return control.getBoundingClientRect().top - node.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(80);
    await expect(button).toHaveAttribute('data-pending', 'true');
    await expect(button).not.toBeInViewport();
    await demo.locator('[data-lab-action="deliver-cities"]').click();
    await expect(demo.locator('[data-lab-output="cities"] li')).toHaveCount(24);
    await expect(demo.locator('[data-lab-output="done"]')).toBeAttached();
  });

  test('UIC-LOAD-MORE-1.4 hands a failed page to onError and loads it on retry', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="paged"]');
    const items = demo.locator('[data-lab-output="items"] li');
    const button = demo.locator('[data-lab-action="load"]');
    await button.click();
    await expect(button).toHaveAttribute('data-pending', 'true');
    await demo.locator('[data-lab-action="fail"]').click();
    await expect(demo.locator('[data-lab-output="error"]')).toHaveText('The server did not answer');
    await expect(button).not.toHaveAttribute('data-pending');
    await expect(items).toHaveCount(4);
    await button.click();
    await demo.locator('[data-lab-action="deliver"]').click();
    await expect(items).toHaveCount(8);
  });

  test('UIC-LOAD-MORE-1.7 does not repeat a failed automatic load until asked', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const demo = page.locator('[data-lab-demo="endless"]');
    const scroller = demo.locator('[data-lab-scroller]');
    const button = demo.locator('.ui-load-more');
    await scroller.scrollIntoViewIfNeeded();
    await scroller.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(button).toHaveAttribute('data-pending', 'true');
    await demo.locator('[data-lab-action="fail"]').click();
    await expect(demo.locator('[data-lab-output="error"]')).toHaveText('The server did not answer');
    await expect(button).not.toHaveAttribute('data-pending');
    await expect(button).toBeInViewport();
    await button.click();
    await expect(button).toHaveAttribute('data-pending', 'true');
    await demo.locator('[data-lab-action="deliver-cities"]').click();
    await expect(demo.locator('[data-lab-output="cities"] li')).toHaveCount(16);
  });

  test('UIC-LOAD-MORE-1.1 UIC-LOAD-MORE-1.2 shows a caller label and every variant', async ({
    page,
    lab,
  }) => {
    await lab.open('load-more');
    const custom = matrixCell(page, 'label=Show older messages count=12 remaining').locator(
      '.ui-load-more',
    );
    await expect(custom).toHaveText('Show older messages (12 remaining)');
    await expect(custom).toHaveAccessibleName('Show older messages (12 remaining) messages');
    for (const variant of ['primary', 'tertiary', 'danger', 'accent', 'chip', 'link', 'bare']) {
      await expect(
        matrixCell(page, `variant=${variant} size=sm`).locator('.ui-load-more'),
      ).toHaveAttribute('data-variant', variant);
    }
  });
});
