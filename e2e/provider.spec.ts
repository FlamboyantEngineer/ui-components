import { expect, test } from './fixtures.js';

test.describe('Provider lab', () => {
  test('UIC-PROVIDER-5.1 UIC-PROVIDER-5.2 UIC-PROVIDER-1.2 routes links through the renderer and router of the nearest provider', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const demo = page.locator('[data-lab-case="routed-links"]');
    const link = (name: string) => demo.getByRole('link', { name });
    await expect(link('Garden (React Aria link)')).toHaveAttribute('href', '#/app/garden');
    await expect(link('Garden (React Aria link)')).toHaveAttribute(
      'data-lab-link-renderer',
      'outer',
    );
    await expect(link('Orchard (list row link)')).toHaveAttribute(
      'data-lab-link-renderer',
      'outer',
    );
    await expect(link('Pond (React Aria link)')).toHaveAttribute('href', '#/app/pond');
    await expect(link('Pond (React Aria link)')).toHaveAttribute('data-lab-link-renderer', 'inner');
    await expect(link('Meadow (list row link)')).toHaveAttribute('data-lab-link-renderer', 'inner');
    for (const name of [
      'Garden (React Aria link)',
      'Orchard (list row link)',
      'Pond (React Aria link)',
      'Meadow (list row link)',
    ]) {
      await link(name).click();
    }
    await expect(demo.locator('[data-lab-output="routes"]')).toHaveText(
      '/garden (navigate), /orchard (renderLink outer), /pond (navigate), /meadow (renderLink inner)',
    );
    await expect(page).not.toHaveURL(/#/);
  });

  test('UIC-PROVIDER-6.3 UIC-PROVIDER-6.2 delays, flushes and redirects writes, and falls back from a corrupt value', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const demo = page.locator('[data-lab-case="persistence"]');
    const draft = demo.getByRole('textbox', { name: 'Draft' });
    const output = (name: string) => demo.locator(`[data-lab-output="${name}"]`);
    const writes = demo.locator('[data-lab-output="writes"] li');

    await draft.fill('Plant beans');
    await expect(output('memory')).toHaveText('"Plant beans"');
    await expect(output('stored')).toHaveText('nothing');
    await demo.getByRole('button', { name: 'Flush' }).click();
    await expect(writes).toHaveText(['set draft-a = "Plant beans"']);
    await expect(output('stored')).toHaveText('"Plant beans"');

    await draft.fill('Plant peas');
    await demo.getByRole('button', { name: 'Switch key' }).click();
    await expect(writes.last()).toHaveText('set draft-a = "Plant peas"');
    await expect(output('key')).toHaveText('draft-b');
    await expect(output('memory')).toHaveText('""');

    await draft.fill('Weed');
    await demo.getByRole('switch', { name: 'Mounted' }).press('Space');
    await expect(writes.last()).toHaveText('set draft-b = "Weed"');

    await demo.getByRole('button', { name: 'Corrupt the stored value' }).click();
    await expect(output('stored')).toHaveText('42');
    await demo.getByRole('switch', { name: 'Mounted' }).press('Space');
    await expect(output('memory')).toHaveText('""');

    await demo.getByRole('radio', { name: 'No delay' }).click();
    await draft.fill('Hoe');
    await expect(writes.last()).toHaveText('set draft-b = "Hoe"');
    await lab.expectAccessible('[data-lab-case="persistence"]');
  });

  test('UIC-PROVIDER-6.1 keeps values with their storage adapter and key', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const storage = page.locator('[data-lab-case="storage"]');
    await storage.getByRole('button', { name: 'Stored count 2', exact: true }).click();
    await storage.getByRole('button', { name: 'Switch storage', exact: true }).click();
    await storage.getByRole('button', { name: 'Stored count 10', exact: true }).click();
    await storage.getByRole('button', { name: 'Switch storage key' }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 20', exact: true }),
    ).toBeVisible();
    await storage.getByRole('button', { name: 'Switch storage key' }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 11', exact: true }),
    ).toBeVisible();
    await storage.getByRole('button', { name: 'Switch storage', exact: true }).click();
    await expect(
      storage.getByRole('button', { name: 'Stored count 3', exact: true }),
    ).toBeVisible();
  });

  test('UIC-PROVIDER-6.1 hydrates the server value, then adopts the stored one', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const section = page.locator('[data-lab-case="hydrated-storage"]');
    await expect(section.locator('[data-lab-output="server"]')).toHaveText('Zoom 100%');
    await section.getByRole('button', { name: 'Zoom 150%' }).click();
    await expect(section.getByRole('button', { name: 'Zoom 160%' })).toBeVisible();
    await expect(section.locator('[data-lab-output="mismatches"]')).toHaveText('0');
  });

  test('UIC-PROVIDER-3.3 UIC-PROVIDER-5.2 keeps a draft while the locale and routing come and go', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const options = page.locator('[data-lab-case="options"]');
    const draft = options.getByRole('textbox', { name: 'Draft note' });
    const amount = options.getByRole('textbox', { name: 'Amount' });
    await expect(amount).toHaveValue('1,234.5');
    await draft.fill('unsaved draft');
    await options.getByText('French locale').click();
    await expect(amount).toHaveValue('1\u202f234,5');
    await options.getByText('Client routing').click();
    await options.getByRole('link', { name: 'Options' }).click();
    await expect(options.locator('[data-lab-output="route"]')).toHaveText('#options');
    await options.getByText('French locale').click();
    await options.getByText('Client routing').click();
    await expect(amount).toHaveValue('1,234.5');
    await expect(draft).toHaveValue('unsaved draft');
    await options.getByRole('link', { name: 'Options' }).click();
    await expect(page).toHaveURL(/#options$/);
  });

  test('UIC-PROVIDER-7.1 pauses a page shortcut while a menu or a field popup is open', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const shortcut = page.locator('[data-lab-case="shortcut"]');
    const overlay = shortcut.locator('[data-lab-output="overlay"]');
    const notes = shortcut.locator('[data-lab-output="notes"]');
    const skipped = shortcut.locator('[data-lab-output="skipped"]');

    await shortcut.getByRole('button', { name: 'Help' }).focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('n');
    await expect(notes).toHaveText('1');
    await expect(overlay).toHaveText('no');

    await shortcut.getByRole('button', { name: 'Insert' }).click();
    await expect(overlay).toHaveText('yes');
    await page.getByRole('menuitem', { name: 'Shape' }).hover();
    await expect(page.getByRole('menu', { name: 'Shape' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('menu', { name: 'Shape' })).toHaveCount(0);
    await expect(overlay).toHaveText('yes');
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveText('no');

    await shortcut.getByRole('button', { name: /Size/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');

    await shortcut.getByRole('button', { name: /Calendar/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('n');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveText('no');

    await expect(skipped).toHaveText('3');
    await page.locator('body').press('n');
    await expect(notes).toHaveText('2');
    await lab.expectAccessible();
  });

  test('UIC-PROVIDER-8.1 reads today from the provider clock in its time zone', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const today = page.locator('[data-lab-output="today"]');
    const harvest = page.locator('[data-lab-field="harvest"]');
    const log = page.getByRole('list', { name: 'Garden log' });
    await expect(today).toHaveText('2026-10-31');
    await expect(harvest).toHaveAttribute('data-relation', 'future');
    await expect(harvest.getByRole('button', { name: /Tomorrow/ })).toBeVisible();
    await expect(log.getByRole('heading', { name: 'Today' })).toBeVisible();
    await page.getByRole('radio', { name: 'Asia/Tokyo' }).click();
    await expect(today).toHaveText('2026-11-01');
    await expect(harvest).toHaveAttribute('data-relation', 'present');
    await expect(harvest.getByRole('button', { name: /Today/ })).toBeVisible();
    await expect(log.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-PROVIDER-1.3 re-renders only the consumers of the service that changed', async ({
    page,
    lab,
  }) => {
    await lab.open('provider');
    const section = page.locator('[data-lab-case="subscriptions"]');
    const renders = (name: string) => section.locator(`[data-lab-renders="${name}"]`);
    const counts = async () =>
      Object.fromEntries(
        await Promise.all(
          ['glyph', 'text', 'storage', 'clock'].map(
            async (name) => [name, Number(await renders(name).textContent())] as const,
          ),
        ),
      );
    await expect(renders('clock')).not.toHaveText('');
    const switches = [
      ['Switch storage', 'storage'],
      ['Switch clock', 'clock'],
      ['Switch glyph', 'glyph'],
      ['Switch text', 'text'],
    ] as const;
    for (const [button, service] of switches) {
      const before = await counts();
      await section.getByRole('button', { name: button }).click();
      await expect(renders(service)).toHaveText(String((before[service] ?? 0) + 1));
      expect(await counts()).toEqual({ ...before, [service]: (before[service] ?? 0) + 1 });
    }
    const table = section.getByRole('table', { name: 'Service renders' });
    await expect(table.getByRole('row', { name: /Storage/ })).toContainText('4');
    await expect(table.getByRole('row', { name: /Text/ })).toContainText('Shut');
    await lab.expectAccessible();
  });
});
