import type { Locator, Page } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

/** A 2 × 1 PNG: one opaque dark pixel beside a transparent one. */
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAD0lEQVR42mOQ0Ej4zwAEAAkcAaBuYLc8AAAAAElFTkSuQmCC',
  'base64',
);

/** Draws one stroke across the area through points given as fractions of its box. */
async function drawStroke(page: Page, area: Locator, points: Array<[number, number]>) {
  await area.scrollIntoViewIfNeeded();
  const box = await area.boundingBox();
  if (!box) throw new Error('The drawing area has no box');
  const at = ([x, y]: [number, number]) => [box.x + x * box.width, box.y + y * box.height] as const;
  const [first, ...rest] = points;
  await page.mouse.move(...at(requireDefined(first)));
  await page.mouse.down();
  for (const point of rest) await page.mouse.move(...at(point), { steps: 4 });
  await page.mouse.up();
}

test.describe('Signature Pad lab', () => {
  test('UIC-SIGNATURE-PAD-1.2 UIC-SIGNATURE-PAD-2.1 UIC-SIGNATURE-PAD-2.3 UIC-SIGNATURE-PAD-2.4 draws, undoes and clears strokes', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="live"]');
    const area = field.getByRole('img', { name: 'Your signature' });
    await expect(area).toHaveAccessibleDescription(/^Drawing area, empty/);
    const canvas = field.locator('.ui-signature-pad__canvas');
    expect(await canvas.evaluate((node) => getComputedStyle(node).touchAction)).toBe('none');
    const areaBox = await area.boundingBox();
    const canvasBox = await canvas.boundingBox();
    expect(Math.round(canvasBox?.width ?? 0)).toBe(Math.round((areaBox?.width ?? 0) - 2));

    await drawStroke(page, canvas, [
      [0.1, 0.7],
      [0.3, 0.2],
      [0.5, 0.8],
      [0.7, 0.3],
    ]);
    await expect(page.locator('[data-lab-output="Strokes"]')).toHaveText('1');
    await expect(page.locator('[data-lab-output="Kind"]')).toHaveText('drawn');
    await expect(page.locator('[data-lab-output="Commits"]')).toHaveText('1');
    await expect(area).toHaveAccessibleDescription(/^Drawing area, 1 stroke/);
    await expect(field.locator('.ui-signature-pad__stroke')).toHaveCount(1);
    const image = page.getByRole('img', { name: 'Signature as an image' });
    await expect(image).toHaveAttribute('src', /^data:image\/svg\+xml,/);
    expect(
      await image.evaluate((node: HTMLImageElement) => node.decode().then(() => node.naturalWidth)),
    ).toBe(600);
    await expect(
      page.getByRole('img', { name: 'Signature as inline SVG' }).locator('path'),
    ).toHaveCount(1);

    await drawStroke(page, canvas, [[0.85, 0.5]]);
    await expect(page.locator('[data-lab-output="Strokes"]')).toHaveText('2');
    await field.getByRole('button', { name: 'Undo stroke' }).click();
    await expect(page.locator('[data-lab-output="Strokes"]')).toHaveText('1');
    await field.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('[data-lab-output="Kind"]')).toHaveText('empty');
    await expect(field.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-SIGNATURE-PAD-2.1 drops a stroke under way when the value is replaced', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="live"]');
    const canvas = field.locator('.ui-signature-pad__canvas');
    await page.getByRole('button', { name: 'Replace in 2 seconds' }).click();
    await canvas.scrollIntoViewIfNeeded();
    const box = requireDefined(await canvas.boundingBox());
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, { steps: 4 });
    await expect(page.locator('[data-lab-output="Strokes"]')).toHaveText('2');
    await expect(field.locator('.ui-signature-pad__surface')).not.toHaveAttribute('data-drawing');
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 4 });
    await page.mouse.up();
    await expect(field.locator('.ui-signature-pad__stroke')).toHaveCount(2);
    await expect(page.locator('[data-lab-output="Commits"]')).toHaveText('0');
  });

  test('UIC-SIGNATURE-PAD-3.1 UIC-SIGNATURE-PAD-3.2 types the name as the keyboard alternative', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="live"]');
    await expect(field).toHaveAttribute('data-mode', 'draw');
    await field.getByRole('radio', { name: 'Draw' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(field).toHaveAttribute('data-mode', 'type');
    await page.keyboard.press('Tab');
    const input = field.getByRole('textbox', { name: 'Your signature' });
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('placeholder', 'Type your name');
    await page.keyboard.type('Ada Lovelace');
    await expect(page.locator('[data-lab-output="Typed"]')).toHaveText('Ada Lovelace');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="Commits"]')).toHaveText('1');
    await field.getByRole('radio', { name: 'Draw' }).click();
    await expect(page.locator('[data-lab-output="Kind"]')).toHaveText('empty');
    await expect(field.getByRole('img', { name: 'Your signature' })).toBeVisible();
  });

  test('UIC-SIGNATURE-PAD-3.2 leaves an Enter during a composition to the input method', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="live"]');
    await field.getByRole('radio', { name: 'Type' }).click();
    const input = field.getByRole('textbox', { name: 'Your signature' });
    await input.fill('Ada');
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true });
    await expect(page.locator('[data-lab-output="Commits"]')).toHaveText('0');
    await input.press('Enter');
    await expect(page.locator('[data-lab-output="Commits"]')).toHaveText('1');
  });

  test('UIC-FIELD-1.11 UIC-SIGNATURE-PAD-3.2 reaches the restore button by Tab and commits on leaving the field', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = matrixCell(page, 'mode=type').locator('.ui-signature-pad');
    const input = field.getByRole('textbox', { name: 'Signature' });
    await input.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Jr');
    await expect(field).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Tab');
    const restore = field.getByRole('button', { name: 'Restore Signature' });
    await expect(restore).toBeFocused();
    await expect(field).toHaveAttribute('data-dirty', 'true');
    await page.keyboard.press('Tab');
    await expect(field).not.toHaveAttribute('data-dirty');
    await expect(field).not.toHaveAttribute('data-focused');
    await expect(input).toHaveValue(/ Jr$/);
  });

  test('UIC-SIGNATURE-PAD-1.1 UIC-SIGNATURE-PAD-3.3 blocks a form until signed and shows every state', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const form = page.locator('[data-lab-form="delivery"]');
    const field = form.locator('[data-lab-field="form"]');
    await expect(field.getByRole('radio')).toHaveCount(2);
    await expect(field.getByRole('radio', { name: 'Type' })).toHaveCount(0);
    await form.getByRole('button', { name: 'Confirm delivery' }).click();
    await expect(field).toHaveAttribute('data-validation', 'invalid');
    const area = field.getByRole('img', { name: 'Received by' });
    await expect(area).toBeFocused();
    await expect(area).toHaveAccessibleDescription('Drawing area, empty A value is required.');
    await drawStroke(page, field.locator('.ui-signature-pad__canvas'), [
      [0.2, 0.5],
      [0.8, 0.5],
    ]);
    await form.getByRole('button', { name: 'Confirm delivery' }).click();
    await expect(page.locator('[data-lab-output="Submitted"]')).toHaveText('drawn');

    const dirty = page.locator(
      `${cellSelector('state=dirty layout=label-control')} .ui-signature-pad`,
    );
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await expect(dirty.locator('.ui-signature-pad__stroke')).toHaveCount(3);
    await dirty.getByRole('button', { name: /^Restore/ }).click();
    await expect(dirty.locator('.ui-signature-pad__stroke')).toHaveCount(2);
    const warning = page.locator(
      `${cellSelector('state=warning layout=label-control')} .ui-signature-pad`,
    );
    await expect(warning).toHaveAttribute('data-mode', 'type');
    await expect(warning.getByRole('textbox')).toHaveValue('A. L.');
    await lab.expectAccessible();
  });

  test('UIC-SIGNATURE-PAD-3.1 UIC-SIGNATURE-PAD-3.3 blocks a blank name and draws once typing is off', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="blank"]');
    await field.getByRole('radio', { name: 'Type' }).click();
    await field.getByRole('textbox', { name: 'Witness' }).fill('   ');
    await expect(field).not.toHaveAttribute('data-filled');
    await page.getByRole('button', { name: 'Witness it' }).click();
    await expect(field).toHaveAttribute('data-validation', 'invalid');
    await expect(page.locator('[data-lab-output="Witnessed"]')).toHaveText('none');
    await field.getByRole('textbox', { name: 'Witness' }).fill('');
    await page.getByRole('button', { name: 'Turn typing off' }).click();
    await expect(field).toHaveAttribute('data-mode', 'draw');
    await expect(field.getByRole('img', { name: 'Witness' })).toBeVisible();
  });

  test('UIC-SIGNATURE-PAD-1.2 keeps strokes and frames readable in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad', { theme: 'dark' });
    const stroke = matrixCell(page, 'mode=draw').locator('.ui-signature-pad__stroke').first();
    await expect(stroke).toBeVisible();
    const colors = await stroke.evaluate((node) => {
      const pad = node.closest('.ui-signature-pad');
      if (!pad) throw new Error('The stroke is outside a signature pad.');
      return { stroke: getComputedStyle(node).stroke, text: getComputedStyle(pad).color };
    });
    expect(colors.stroke).toBe(colors.text);
    await lab.expectAccessible();
  });

  test('UIC-SIGNATURE-PAD-4.1 UIC-SIGNATURE-PAD-4.2 UIC-SIGNATURE-PAD-4.3 uploads and pastes an image, refuses other files and leaves no hidden image', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-pad');
    const field = page.locator('[data-lab-field="live"]');
    await field.getByRole('radio', { name: 'Image' }).click();
    const area = field.getByRole('img', { name: 'Your signature' });
    await expect(area).toHaveAccessibleDescription(/^No image yet\. Upload or paste one\./);
    const chooser = page.waitForEvent('filechooser');
    await field.getByRole('button', { name: 'Upload image' }).click();
    await (await chooser).setFiles({ name: 'sign.png', mimeType: 'image/png', buffer: tinyPng });
    await expect(page.locator('[data-lab-output="Image"]')).toHaveText('image/png 2×1');
    const preview = field.locator('.ui-signature-pad__image-preview');
    await expect(preview).toBeVisible();
    const fit = await preview.evaluate((node) => getComputedStyle(node).objectFit);
    expect(fit).toBe('contain');
    const refused = page.waitForEvent('filechooser');
    await field.getByRole('button', { name: 'Upload image' }).click();
    await (
      await refused
    ).setFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
    await expect(field.getByRole('status')).toHaveText('Choose a PNG, JPEG, WebP or GIF image.');
    await expect(page.locator('[data-lab-output="Image"]')).toHaveText('image/png 2×1');
    await field.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('[data-lab-output="Kind"]')).toHaveText('empty');
    await area.click();
    await area.evaluate(
      (node, bytes) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File([new Uint8Array(bytes)], 'pasted.png', { type: 'image/png' }));
        node.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }),
        );
      },
      [...tinyPng],
    );
    await expect(page.locator('[data-lab-output="Image"]')).toHaveText('image/png 2×1');
    await expect(field.locator('.ui-signature-pad__image-message')).toBeEmpty();
    await lab.expectAccessible('[data-lab-field="live"]');
    await field.getByRole('radio', { name: 'Draw' }).click();
    await expect(page.locator('[data-lab-output="Kind"]')).toHaveText('empty');
    await field.getByRole('radio', { name: 'Image' }).click();
    await expect(preview).toHaveCount(0);
  });
});
