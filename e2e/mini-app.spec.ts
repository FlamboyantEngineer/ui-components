import { expect, matrixCell, test } from './fixtures.js';

test.describe('Mini App lab', () => {
  test('UIC-MINI-APP-2.2 UIC-MINI-APP-2.3 UIC-MINI-APP-3.1 runs the calculator with a host capability and saves its inputs', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const demo = page.locator('[data-lab-demo="calculator"]');
    await expect(demo.locator('.ui-mini-app')).toHaveAttribute('data-status', 'ready');
    const app = page.frameLocator('iframe[title="Loan payment calculator"]');
    await expect(app.locator('#payment')).toHaveText('$372.86');
    await app.getByLabel('Amount').fill('12000');
    await app.getByLabel('Years').fill('3');
    await app.getByRole('button', { name: 'Calculate' }).click();
    await expect(app.locator('#payment')).toHaveText('$356.96');
    await expect(demo.locator('[data-lab-output="calls"]')).toHaveText('2');
    await expect(demo.locator('[data-lab-output="calculator-state"]')).toHaveText(
      '{"amount":12000,"rate":4.5,"years":3}',
    );
    await lab.expectAccessible('[data-lab-demo="calculator"]');
  });

  test('UIC-MINI-APP-1.2 UIC-MINI-APP-2.1 isolates the mini-app from the host page and its storage', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    await expect(page.locator('[data-lab-demo="calculator"] .ui-mini-app')).toHaveAttribute(
      'data-status',
      'ready',
    );
    const handle = await page.locator('iframe[title="Loan payment calculator"]').elementHandle();
    const frame = await handle?.contentFrame();
    if (!frame) throw new Error('No mini-app frame.');
    const reach = await frame.evaluate(() => {
      const attempt = (read: () => unknown) => {
        try {
          return String(read());
        } catch {
          return 'blocked';
        }
      };
      return {
        origin: window.origin,
        parentDocument: attempt(() => window.parent.document.title),
        storage: attempt(() => window.localStorage.length),
        cookie: attempt(() => document.cookie),
        bridge: Object.keys(Reflect.get(window, 'miniApp') as object).join(' '),
        frozen: Object.isFrozen(Reflect.get(window, 'miniApp')),
      };
    });
    expect(reach).toEqual({
      origin: 'null',
      parentDocument: 'blocked',
      storage: 'blocked',
      cookie: 'blocked',
      bridge: 'state call setState',
      frozen: true,
    });
  });

  test('UIC-MINI-APP-2.3 UIC-MINI-APP-3.3 UIC-MINI-APP-4.1 saves the chart state, restores it on restart and sizes the frame', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const demo = page.locator('[data-lab-demo="chart"]');
    const root = demo.locator('.ui-mini-app');
    await expect(root).toHaveAttribute('data-status', 'ready');
    const app = page.frameLocator('iframe[title="Monthly visitors chart"]');
    await expect(app.getByRole('button', { name: 'Last year' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await app.getByRole('button', { name: 'This year' }).click();
    await app.getByRole('slider').fill('80');
    await expect(app.getByText('3 of 12 months above 80.')).toBeVisible();
    await expect(demo.locator('[data-lab-output="chart-state"]')).toHaveText(
      '{"year":"current","threshold":80}',
    );

    const frame = demo.locator('iframe');
    await expect(async () => {
      const height = Number(await frame.getAttribute('height'));
      const content = await frame
        .contentFrame()
        .locator('html')
        .evaluate((html) => html.getBoundingClientRect().height);
      expect(height).toBe(Math.ceil(content));
      expect(height).toBeGreaterThan(200);
    }).toPass();

    await demo.getByRole('button', { name: 'Restart chart' }).click();
    await expect(root).toHaveAttribute('data-status', 'ready');
    await expect(app.getByRole('button', { name: 'This year' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(app.getByRole('slider')).toHaveValue('80');
    await lab.expectAccessible('[data-lab-demo="chart"]');
  });

  test('UIC-MINI-APP-4.2 moves focus through the mini-app’s controls with Tab', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const demo = page.locator('[data-lab-demo="calculator"]');
    await expect(demo.locator('.ui-mini-app')).toHaveAttribute('data-status', 'ready');
    const app = page.frameLocator('iframe[title="Loan payment calculator"]');
    await app.getByLabel('Amount').focus();
    await page.keyboard.press('Tab');
    await expect(app.getByLabel('Yearly rate (%)')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(app.getByLabel('Years')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(app.getByRole('button', { name: 'Calculate' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="calls"]')).toHaveText('2');
  });

  test('UIC-MINI-APP-1.4 UIC-MINI-APP-3.1 UIC-MINI-APP-3.2 shows each outcome on its own instance', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const ready = matrixCell(page, 'outcome=ready');
    await expect(ready.locator('.ui-mini-app')).toHaveAttribute('data-status', 'ready');
    await expect(ready.locator('iframe')).toBeVisible();
    await expect(ready.locator('[data-lab-output="error"]')).toHaveText('No error');

    const failed = matrixCell(page, 'outcome=script error');
    await expect(failed.locator('.ui-mini-app')).toHaveAttribute('data-error', 'script');
    await expect(failed.locator('iframe')).toBeHidden();
    await expect(failed.locator('.ui-mini-app').getByRole('status')).toHaveText(
      'Sample: script error could not run.',
    );
    await expect(failed.locator('[data-lab-output="error"]')).toHaveText(
      'script: The rate table is missing.',
    );

    const late = matrixCell(page, 'outcome=timeout');
    await expect(late.locator('.ui-mini-app')).toHaveAttribute('data-error', 'timeout');
    await expect(late.locator('.ui-mini-app').getByRole('status')).toHaveText(
      'Sample: timeout could not run.',
    );
    await lab.expectAccessible('[data-lab-matrix]');
  });
});
