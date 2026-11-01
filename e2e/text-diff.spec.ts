import { cellSelector, expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `${cellSelector(id)} .ui-text-diff`;

test.describe('Text Diff lab', () => {
  test('UIC-TEXT-DIFF-1.1 UIC-TEXT-DIFF-1.2 UIC-TEXT-DIFF-1.3 UIC-TEXT-DIFF-2.1 UIC-TEXT-DIFF-3.1 draws a unified diff', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const diff = page.locator(cell('content=edited layout=unified'));
    await expect(diff).toHaveAttribute('data-layout', 'unified');
    await expect(diff.locator('.ui-text-diff__count')).toHaveText(['+5', '−4']);
    await expect(diff.locator('.ui-text-diff__summary')).toContainText(
      '5 lines added, 4 lines removed',
    );
    const rows = diff.locator('.ui-text-diff__line');
    await expect(rows).toHaveCount(15);
    await expect(rows.nth(0)).toHaveAttribute('data-change', 'removed');
    await expect(rows.nth(2)).toHaveAttribute('data-change', 'added');
    await expect(rows.nth(0).locator('del')).toHaveText('Lemon tart');
    await expect(rows.nth(2).locator('ins')).toHaveText('Lemon and lime tart');
    await expect(rows.nth(2).locator('.ui-text-diff__word')).toHaveText(['and lime ']);
    await expect(rows.nth(2).locator('.ui-text-diff__marker')).toContainText('Added, new line 1');
    await expect(rows.nth(4).locator('.ui-text-diff__number')).toHaveText(['3', '3']);
    const marker = requireDefined(await rows.nth(0).locator('.ui-text-diff__marker').boundingBox());
    const text = requireDefined(await rows.nth(0).locator('.ui-text-diff__text').boundingBox());
    expect(text.x).toBeGreaterThan(marker.x);
  });

  test('UIC-TEXT-DIFF-1.4 UIC-TEXT-DIFF-3.2 sets the sides beside each other on aligned rows', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const diff = page.locator(cell('content=edited layout=split'));
    const oldPane = diff.locator('.ui-text-diff__pane[data-side="old"]');
    const newPane = diff.locator('.ui-text-diff__pane[data-side="new"]');
    await expect(diff.getByRole('group', { name: 'Before' })).toBeVisible();
    await expect(diff.getByRole('group', { name: 'After' })).toBeVisible();
    const oldBox = requireDefined(await oldPane.boundingBox());
    const newBox = requireDefined(await newPane.boundingBox());
    expect(newBox.x).toBeGreaterThanOrEqual(oldBox.x + oldBox.width - 1);
    const oldRows = oldPane.locator('tr');
    const newRows = newPane.locator('tr');
    await expect(oldRows).toHaveCount(11);
    await expect(newRows).toHaveCount(11);
    await expect(oldPane.locator('.ui-text-diff__filler')).toHaveCount(1);
    for (const index of [0, 5, 8, 10]) {
      const left = requireDefined(await oldRows.nth(index).boundingBox());
      const right = requireDefined(await newRows.nth(index).boundingBox());
      expect(Math.abs(left.y - right.y)).toBeLessThan(1);
    }
  });

  test('UIC-TEXT-DIFF-2.2 UIC-TEXT-DIFF-2.3 moves between changes from the buttons and the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const diff = page.locator(cell('content=edited layout=unified'));
    const rows = diff.locator('.ui-text-diff__line');
    const previous = diff.getByRole('button', { name: 'Previous change' });
    await expect(previous).toBeDisabled();
    await diff.getByRole('button', { name: 'Next change' }).click();
    await expect(rows.nth(0)).toBeFocused();
    await expect(rows.nth(0)).toHaveAttribute('data-current', 'true');
    await expect(rows.nth(3)).toHaveAttribute('data-current', 'true');
    await expect(rows.nth(4)).not.toHaveAttribute('data-current', 'true');
    await page.keyboard.press('n');
    await expect(rows.nth(8)).toBeFocused();
    await expect(diff.getByRole('button', { name: 'Next change' })).toBeDisabled();
    await page.keyboard.press('p');
    await expect(rows.nth(0)).toBeFocused();

    const split = page.locator(cell('content=edited layout=split'));
    await split.getByRole('button', { name: 'Next change' }).click();
    await expect(split.locator('.ui-text-diff__pane[data-side="new"] tr').first()).toBeFocused();
  });

  test('UIC-TEXT-DIFF-1.6 shows folded lines on request', async ({ page, lab }) => {
    await lab.open('text-diff');
    const diff = page.locator(cell('layout=unified'));
    await expect(diff.locator('.ui-text-diff__fold')).toHaveCount(2);
    await expect(diff.locator('.ui-text-diff__line')).toHaveCount(10);
    await diff.getByRole('button', { name: 'Show 9 more lines' }).click();
    await expect(diff.locator('.ui-text-diff__fold')).toHaveCount(1);
    await expect(diff.locator('.ui-text-diff__line')).toHaveCount(19);
    await expect(diff.locator('.ui-text-diff__line').nth(5)).toBeFocused();
    await expect(diff.locator('.ui-text-diff__line').nth(5)).toContainText('retries = 3');

    const split = page.locator(cell('layout=split'));
    const oldFold = split.locator('.ui-text-diff__pane[data-side="old"] .ui-text-diff__fold');
    await expect(oldFold.first()).toHaveText('Show 9 more lines');
    await expect(oldFold.getByRole('button')).toHaveCount(0);
  });

  test('UIC-TEXT-DIFF-1.5 UIC-TEXT-DIFF-1.7 draws widgets under lines and keeps the panes level', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const demo = page.locator('[data-lab-demo="review"]');
    const diff = demo.locator('.ui-text-diff');
    const oldPane = diff.locator(
      '.ui-text-diff__pane[data-side="old"] .ui-scroll-region__viewport',
    );
    const newPane = diff.locator(
      '.ui-text-diff__pane[data-side="new"] .ui-scroll-region__viewport',
    );
    await expect(newPane.locator('.ui-text-diff__widget')).toHaveCount(2);
    await expect(oldPane.locator('.ui-text-diff__widget')).toHaveText(
      /Four eggs set too softly last time/,
    );
    const line = newPane.locator('.ui-text-diff__line', { hasText: 'blind for 20' });
    const widget = newPane.locator('.ui-text-diff__widget').first();
    const lineBox = requireDefined(await line.boundingBox());
    const widgetBox = requireDefined(await widget.boundingBox());
    expect(Math.abs(widgetBox.y - (lineBox.y + lineBox.height))).toBeLessThan(2);

    await newPane.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(async () => {
      const [oldTop, newTop] = await Promise.all([
        oldPane.evaluate((element) => element.scrollTop),
        newPane.evaluate((element) => element.scrollTop),
      ]);
      expect(newTop).toBeGreaterThan(0);
      expect(oldTop).toBeGreaterThan(0);
    }).toPass();
    await oldPane.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect.poll(() => newPane.evaluate((element) => element.scrollTop)).toBeLessThan(1);

    await demo.getByRole('radio', { name: 'Unified' }).click();
    await expect(diff).toHaveAttribute('data-layout', 'unified');
    await expect(diff.locator('.ui-text-diff__widget')).toHaveCount(3);
  });

  test('UIC-TEXT-DIFF-1.7 starts widgets over for new texts and restores host-kept drafts by line id', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const demo = page.locator('[data-lab-demo="drafts"]');
    const tart = demo.getByRole('textbox', { name: 'Note on “Lime tart”' });
    await tart.fill('Check the lime count');
    await demo.getByRole('radio', { name: 'Split' }).click();
    await expect(demo.locator('.ui-text-diff')).toHaveAttribute('data-layout', 'split');
    await expect(tart).toHaveValue('Check the lime count');
    await demo.getByRole('radio', { name: 'Bread' }).click();
    const bread = demo.getByRole('textbox', { name: 'Note on “Spelt bread”' });
    await expect(bread).toHaveValue('');
    await expect(demo.getByRole('textbox', { name: 'Note on “Prove for 3 hours.”' })).toHaveValue(
      '',
    );
    await bread.fill('Spelt needs more water');
    await demo.getByRole('radio', { name: 'Tart' }).click();
    await expect(tart).toHaveValue('Check the lime count');
    await expect(demo.locator('output')).toHaveText('Drafts kept: 2');
  });

  test('UIC-SYNCED-SCROLL-1.1 keeps two lists at the same fraction of their range', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const demo = page.locator('[data-lab-demo="synced"]');
    const cities = demo.getByRole('group', { name: 'Cities' });
    const stops = demo.getByRole('group', { name: 'Stops' });
    await cities.evaluate((element) => {
      element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
    });
    await expect(async () => {
      const ratio = await stops.evaluate(
        (element) => element.scrollTop / (element.scrollHeight - element.clientHeight),
      );
      expect(Math.abs(ratio - 0.5)).toBeLessThan(0.02);
    }).toPass();
  });

  test('UIC-SYNCED-SCROLL-1.2 UIC-SYNCED-SCROLL-1.4 realigns matched items after a list changes', async ({
    page,
    lab,
  }) => {
    await lab.open('text-diff');
    const demo = page.locator('[data-lab-demo="anchored"]');
    const plain = demo.getByRole('group', { name: 'Towns', exact: true });
    const noted = demo.getByRole('group', { name: 'Towns with notes' });
    /** The distance of a town's item below the top of its list's viewport. */
    const offset = (list: typeof plain, town: string) =>
      list.evaluate(
        (element, name) =>
          (element.querySelector(`li[data-town="${name}"]`)?.getBoundingClientRect().top ?? 0) -
          element.getBoundingClientRect().top,
        town,
      );
    const scrollToTown = async (town: string) => {
      await plain.evaluate(
        (element, distance) => {
          element.scrollTop += distance;
        },
        await offset(plain, town),
      );
    };
    const isLevel = async (town: string) =>
      Math.abs((await offset(noted, town)) - (await offset(plain, town)));
    await scrollToTown('Braga 4');
    await expect.poll(() => isLevel('Braga 4')).toBeLessThan(2);
    await demo.getByRole('button', { name: 'Add notes' }).click();
    await scrollToTown('Faro 13');
    await expect.poll(() => isLevel('Faro 13')).toBeLessThan(2);
    await scrollToTown('Porto 2');
    await expect.poll(() => isLevel('Porto 2')).toBeLessThan(2);
  });

  test('is accessible', async ({ lab }) => {
    await lab.open('text-diff');
    await lab.expectAccessible();
  });
});

test('UIC-DIFF-3.1 UIC-SYNCED-SCROLL-1.2 shows the exported helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('text-diff');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call("diffSequences(['oak', 'ash', 'elm'], ['oak', 'elm', 'yew'])")).toHaveText(
    '[{"kind":"equal","items":["oak"]},{"kind":"delete","items":["ash"]},{"kind":"equal","items":["elm"]},{"kind":"insert","items":["yew"]}]',
  );
  await expect(
    call(
      "mapScrollOffset(150, [{ key: 'a', offset: 100 }, { key: 'b', offset: 200 }], [{ key: 'a', offset: 300 }, { key: 'b', offset: 500 }])",
    ),
  ).toHaveText('400');
});

test('UIC-TEXT-DIFF-1.6 UIC-TEXT-DIFF-2.2 UIC-PORTAL-1.8 moves focus to rows inside a shadow root', async ({
  page,
  lab,
}) => {
  await lab.open('text-diff');
  const demo = page.locator('[data-lab-demo="shadow-diff"]');
  await demo.scrollIntoViewIfNeeded();
  const lines = demo.locator('.ui-text-diff__line');
  await demo.getByRole('button', { name: 'Next change' }).click();
  await expect(demo.locator('.ui-text-diff__line[data-current]').first()).toBeFocused();
  await demo.getByRole('button', { name: 'Show 9 more lines' }).first().click();
  await expect(lines.nth(5)).toBeFocused();
  await expect(lines.nth(5)).toContainText('retries = 3');
});
