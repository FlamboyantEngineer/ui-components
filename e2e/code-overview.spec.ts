import { expect, test } from './fixtures.js';

test('UIC-CODE-EDITOR-12.3 paints diagnostic marks inside a usable custom scrollbar track', async ({
  page,
  lab,
}) => {
  await lab.open('code-editor');
  const field = page.locator('[data-lab-editor="overview"]');
  const input = field.getByRole('textbox', { name: 'Located diagnostics' });
  const track = field.locator('.ui-scroll-region__track[data-orientation="vertical"]');
  const thumb = track.getByRole('scrollbar');
  const marks = track.locator('.ui-code-editor__scroll-marker');
  await expect(marks).toHaveCount(3);
  await expect(marks.first()).toHaveCSS('background-color', 'rgb(207, 34, 46)');
  await expect(async () => {
    const geometry = await marks.evaluateAll((elements) =>
      elements.map((e) => {
        const r = e.getBoundingClientRect();
        const t = e.parentElement!.getBoundingClientRect();
        return { offset: (r.y - t.y) / t.height, inside: r.x >= t.x && r.right <= t.right };
      }),
    );
    expect(geometry.every((mark) => mark.inside)).toBe(true);
    expect(geometry[0]!.offset).toBeCloseTo(11 / 90, 1);
    expect(geometry[2]!.offset).toBeCloseTo(75 / 90, 1);
  }).toPass();
  await thumb.focus();
  await thumb.press('End');
  await expect.poll(() => input.evaluate((e) => e.scrollTop)).toBeGreaterThan(1000);
  await thumb.press('Home');
  await expect.poll(() => input.evaluate((e) => e.scrollTop)).toBe(0);
  const box = await thumb.boundingBox();
  if (!box) throw new Error('Scrollbar not rendered');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 80, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => input.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await input.fill('const fruit = "Pear";');
  await expect(marks).toHaveCount(0);
  await lab.expectAccessible('[data-lab-editor="overview"]');
});

test('UIC-CODE-EDITOR-12.3 remeasures wrapped diagnostic lines and excerpt positions after resizing', async ({
  page,
  lab,
}) => {
  await lab.open('code-editor');
  const field = page.locator('[data-lab-editor="overview"]');
  const input = field.getByRole('textbox', { name: 'Located diagnostics' });
  const mark = field.locator('.ui-code-editor__scroll-marker').first();
  const initial = await mark.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return (r.y - e.parentElement!.getBoundingClientRect().y) / e.parentElement!.clientHeight;
  });
  await input.fill(
    [
      `// ${'Long source text '.repeat(100)}`,
      ...Array.from({ length: 89 }, (_, i) => `const fruit${i + 2} = "Pear";`),
    ].join('\n'),
  );
  await field.getByRole('button', { name: 'Wrap diagnostics' }).click();
  await expect(field.locator('.ui-code-editor__line-number').first()).toHaveText('50');
  await page.setViewportSize({ width: 400, height: 900 });
  await expect(async () => {
    const geometry = await field.evaluate((root) => {
      const input = root.querySelector('textarea')!;
      const gutter = root.querySelector<HTMLElement>('.ui-code-editor__gutter')!;
      const line = gutter.children[11]!;
      const mark = root.querySelector<HTMLElement>('.ui-code-editor__scroll-marker')!;
      const track = mark.parentElement!;
      return {
        expected:
          (line.getBoundingClientRect().top -
            gutter.getBoundingClientRect().top +
            gutter.scrollTop) /
          input.scrollHeight,
        actual:
          (mark.getBoundingClientRect().top - track.getBoundingClientRect().top) /
          track.clientHeight,
      };
    });
    expect(geometry.actual).toBeCloseTo(geometry.expected, 2);
    expect(geometry.actual).toBeGreaterThan(initial + 0.1);
  }).toPass();
});
