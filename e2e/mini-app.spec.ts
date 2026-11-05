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
      const inner = await frame.evaluate((element) => element.clientHeight);
      const content = await frame
        .contentFrame()
        .locator('html')
        .evaluate((html) => html.getBoundingClientRect().height);
      expect(inner).toBe(Math.ceil(content));
      expect(inner).toBeGreaterThan(200);
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

  test('UIC-MINI-APP-2.3 UIC-MINI-APP-4.2 probes the engineering chart from its sliders', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const demo = page.locator('[data-lab-demo="bode"]');
    await expect(demo.locator('.ui-mini-app')).toHaveAttribute('data-status', 'ready');
    const app = page.frameLocator('iframe[title="Low-pass filter Bode plot"]');
    await expect(app.locator('#readout')).toHaveText('At 1.00 kHz: -3.0 dB, -90.0°.');
    await expect(app.locator('#peak')).toHaveText(
      'No resonance peak: the filter is damped enough not to ring.',
    );
    await app.getByLabel('Damping ratio ζ').fill('0.2');
    await expect(app.locator('#peak')).toHaveText('Resonance peak: +8.1 dB at 959 Hz.');
    await app.getByLabel('Probe frequency').focus();
    await page.keyboard.press('End');
    await expect(app.locator('#readout')).toContainText('At 100 kHz:');
    await expect(demo.locator('[data-lab-output="state"]')).toHaveText(
      '{"cutoff":3,"damping":0.2,"probe":5}',
    );
    await lab.expectAccessible('[data-lab-demo="bode"]');
  });

  test('UIC-MINI-APP-2.3 plots and tabulates the physics calculator as its inputs change', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const demo = page.locator('[data-lab-demo="projectile"]');
    await expect(demo.locator('.ui-mini-app')).toHaveAttribute('data-status', 'ready');
    const app = page.frameLocator('iframe[title="Projectile calculator"]');
    const range = app.getByRole('row', { name: /^Range/ });
    await expect(range.getByRole('cell').first()).toHaveText('93.2 m');
    const withDrag = Number.parseFloat((await range.getByRole('cell').nth(1).textContent()) ?? '');
    expect(withDrag).toBeLessThan(93.2);
    await expect(
      app
        .getByRole('row', { name: /^Peak height/ })
        .getByRole('cell')
        .first(),
    ).toHaveText('24.4 m');
    await expect(app.locator('#plot path')).toHaveCount(2);
    await app.getByLabel('World').selectOption('moon');
    await expect(range.getByRole('cell').first()).toHaveText('557.1 m');
    await expect(range.getByRole('cell').nth(1)).toHaveText('557.1 m');
    await expect(demo.locator('[data-lab-output="state"]')).toHaveText(
      '{"speed":30,"angle":45,"height":1.5,"mass":0.43,"diameter":22,"world":"moon"}',
    );
    await lab.expectAccessible('[data-lab-demo="projectile"]');
  });

  test('UIC-MINI-APP-4.1 sizes every ready frame to its content without a scrollbar', async ({
    page,
    lab,
  }) => {
    await lab.open('mini-app');
    const frames = page.locator('.ui-mini-app[data-status="ready"] iframe');
    await expect(page.locator('.ui-mini-app[data-status="loading"]')).toHaveCount(0);
    const count = await frames.count();
    expect(count).toBe(5);
    for (let index = 0; index < count; index += 1) {
      const frame = frames.nth(index);
      await expect(async () => {
        const overflow = await frame
          .contentFrame()
          .locator('html')
          .evaluate((html) => html.scrollHeight - html.clientHeight);
        expect(overflow).toBe(0);
      }).toPass();
    }
  });
});
