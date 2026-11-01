import type { Locator, Page } from '@playwright/test';
import { expect, matrix, matrixCell, test } from './fixtures.js';

for (const mode of ['hidden', 'fieldset', 'chosen-hidden', 'chosen-plain']) {
  test(`UIC-MODAL-3.1 UIC-MODAL-3.4 focuses the first usable body field after ${mode}`, async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await page.getByRole('button', { name: `Open ${mode} focus case` }).click();
    const dialog = page.getByRole('dialog', { name: `Focus after ${mode}` });
    await expect(dialog.getByRole('textbox', { name: 'Ready' })).toBeFocused();
  });
}

const sizes = [
  ['sm', 400],
  ['md', 560],
  ['lg', 800],
  ['xl', 1120],
] as const;

/** The `data-lab-*` marker of the element topmost at the centre of `target`. */
async function topmostAt(page: Page, target: Locator, attribute: string) {
  const box = await target.boundingBox();
  if (!box) throw new Error('target not rendered');
  return page.evaluate(
    ([x, y, name]) =>
      document
        .elementFromPoint(x as number, y as number)
        ?.closest(`[${name as string}]`)
        ?.getAttribute(name as string) ?? null,
    [box.x + box.width / 2, box.y + box.height / 2, attribute] as const,
  );
}

test.describe('Modal lab', () => {
  test('UIC-MODAL-1.1 UIC-MODAL-1.4 UIC-MODAL-3.3 opens every tone and size and returns focus to its button', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const viewport = page.viewportSize();
    for (const tone of ['neutral', 'danger']) {
      for (const [size, width] of [...sizes, ['full', (viewport?.width ?? 0) - 32] as const]) {
        const button = matrixCell(page, `tone=${tone} size=${size}`, {
          family: 'modal-main',
        }).locator(`button`);
        await button.click();
        const overlay = page.locator(`.ui-modal[data-lab-modal="${tone}-${size}"]`);
        await expect(overlay).toHaveAttribute('data-tone', tone);
        await expect(overlay).toHaveAttribute('data-size', size);
        const dialog = page.getByRole('dialog');
        await expect(dialog).toHaveAccessibleName(
          `${tone === 'danger' ? 'Delete' : 'Rename'} Report.pdf`,
        );
        const panel = await overlay.locator('.ui-modal__panel').boundingBox();
        expect(panel?.width).toBeCloseTo(width, 0);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-MODAL-3.1 UIC-MODAL-3.2 UIC-MODAL-5.2 UIC-MODAL-6.1 saves with Control+Enter once and closes', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const opener = matrix(page, 'modal-main').locator('[data-lab-open="save"]');
    await opener.click();
    const city = page.getByRole('textbox', { name: 'City' });
    await expect(city).toBeFocused();
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await city.fill('Lisbon');
    const save = page.getByRole('button', { name: 'Save' });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(city).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(save).toBeFocused();
    await city.focus();
    await page.keyboard.press('Control+Enter');
    await expect(save).toHaveAttribute('data-pending', 'true');
    await page.keyboard.press('Control+Enter');
    await save.click({ force: true });
    await expect(matrix(page, 'modal-main').locator('[data-lab-output="saved"]')).toHaveText(
      'none',
    );
    await page.locator('[data-lab-action="finish"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(matrix(page, 'modal-main').locator('[data-lab-output="saved"]')).toHaveText(
      'Lisbon',
    );
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-5.3 keeps a failed save open with the error', async ({ page, lab }) => {
    await lab.open('modal');
    await matrix(page, 'modal-main').locator('[data-lab-open="save"]').click();
    await page.getByRole('textbox', { name: 'City' }).fill('Kyoto');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'data-pending',
      'true',
    );
    await page.locator('[data-lab-action="fail"]').click();
    await expect(page.getByRole('alert')).toHaveText('The list is full.');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toHaveAttribute('data-pending');
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-MODAL-6.3 runs the primary action once from Enter in a field', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await matrix(page, 'modal-main').locator('[data-lab-open="save"]').click();
    const city = page.getByRole('textbox', { name: 'City' });
    await expect(city).toBeFocused();
    await city.fill('Oslo');
    const save = page.getByRole('button', { name: 'Save' });
    await page.keyboard.press('Enter');
    await expect(save).toHaveAttribute('data-pending', 'true');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Control+Enter');
    await page.locator('[data-lab-action="fail"]').click();
    await expect(page.getByRole('alert')).toHaveText('The list is full.');
    await expect(save).not.toHaveAttribute('data-pending');
    await expect(page.locator('[data-lab-action="fail"]')).toBeDisabled();
    await expect(matrix(page, 'modal-main').locator('[data-lab-output="saved"]')).toHaveText(
      'none',
    );
  });

  test('UIC-MODAL-1.2 UIC-MODAL-1.3 UIC-MODAL-2.1 UIC-MODAL-2.2 stacks modals below the toast layer', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const opener = matrix(page, 'modal-main').locator('[data-lab-open="stack"]');
    await opener.click();
    const outer = page.locator('.ui-modal[data-lab-modal="outer"]');
    await expect(outer).toHaveCSS('z-index', '120');
    await expect(outer).toHaveCSS('position', 'fixed');
    expect(await topmostAt(page, opener, 'data-lab-modal')).toBe('outer');

    await page.getByRole('button', { name: 'Show notice' }).click();
    const notice = page.locator('[data-lab-notice] [role="status"]');
    await expect(notice).toBeVisible();
    await page.getByRole('button', { name: 'Edit dates' }).click();
    const inner = page.locator('.ui-modal[data-lab-modal="inner"]');
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await expect(inner).toHaveCSS('z-index', '120');
    expect(await topmostAt(page, page.locator('.ui-modal__panel').last(), 'data-lab-modal')).toBe(
      'inner',
    );
    expect(await topmostAt(page, notice, 'data-lab-notice')).toBe('');
    const followsOuter = await page.evaluate(() => {
      const [first, second] = document.querySelectorAll('body > .ui-modal');
      return Boolean(first && second && first.compareDocumentPosition(second) & 4);
    });
    expect(followsOuter).toBe(true);

    const panel = await inner.locator('.ui-modal__panel').boundingBox();
    if (!panel) throw new Error('panel not rendered');
    await page.mouse.move(panel.x + 20, panel.y + 20);
    await page.mouse.down();
    await page.mouse.move(8, 8);
    await page.mouse.up();
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Trip to Oslo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit dates' })).toBeFocused();

    await page.getByRole('button', { name: 'Edit dates' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toHaveCount(0);
    await page.mouse.click(8, 8);
    await expect(page.getByRole('dialog', { name: 'Trip to Oslo' })).toBeVisible();
    // An outside press keeps focus in the dialog, so Escape still reaches it.
    await expect(page.getByRole('button', { name: 'Edit dates' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(outer).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-4.1 UIC-MODAL-6.1 describes the dialog and leaves Control+Enter to a text area', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await page.getByRole('button', { name: 'Write a note' }).click();
    const dialog = page.getByRole('dialog', { name: 'Note' });
    await expect(dialog).toHaveAccessibleDescription('Notes stay on this device.');
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Note');
    await expect(dialog.locator('.ui-modal__header-actions')).toHaveText('Step 1 of 2');
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeFocused();
    const text = page.getByRole('textbox', { name: 'Text' });
    await text.focus();
    await page.keyboard.type('Line one');
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toBeVisible();
    await page.getByRole('textbox', { name: 'Title' }).focus();
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toHaveCount(0);
  });

  test('UIC-MODAL-5.1 shows footer states and passes an accessibility check', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await matrixCell(page, 'state=error tone=danger', { family: 'modal-main' })
      .locator('button')
      .click();
    await expect(page.getByRole('alert')).toHaveText('Lisbon is not available.');
    const buttons = page.locator('.ui-modal__actions button');
    await expect(buttons).toHaveText(['Cancel', 'Apply']);
    await expect(buttons.last()).toHaveAttribute('data-variant', 'danger');
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');

    await matrixCell(page, 'state=secondary action tone=neutral', { family: 'modal-main' })
      .locator('button')
      .click();
    await expect(buttons).toHaveText(['Cancel', 'Discard', 'Save']);
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await matrixCell(page, 'state=action variant tone=neutral', { family: 'modal-main' })
      .locator('button')
      .click();
    await expect(page.getByRole('button', { name: 'Remove', exact: true })).toHaveAttribute(
      'data-variant',
      'danger',
    );
    await expect(page.getByRole('button', { name: 'Keep' })).toHaveAttribute(
      'data-variant',
      'primary',
    );
  });

  test('UIC-MODAL-1.1 works without a stylesheet', async ({ page, lab }) => {
    await lab.open('modal', { stylesheet: 'none' });
    const button = matrixCell(page, 'tone=neutral size=md', { family: 'modal-main' }).locator(
      'button',
    );
    await button.click();
    await expect(page.getByRole('dialog', { name: 'Rename Report.pdf' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  });

  test('UIC-MODAL-1.4 UIC-MODAL-5.5 passes an accessibility check in the dark theme', async ({
    page,
    lab,
  }) => {
    // Contrast is checked once the reference fade has finished: mid-animation text is translucent.
    const settled = () =>
      expect(page.locator('.ui-modal[data-entering], .ui-modal[data-exiting]')).toHaveCount(0);
    await lab.open('modal', { theme: 'dark' });
    await lab.expectAccessible();
    await matrixCell(page, 'state=error tone=danger', { family: 'modal-main' })
      .locator('button')
      .click();
    await expect(page.getByRole('alert')).toHaveText('Lisbon is not available.');
    await settled();
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');
    await matrixCell(page, 'state=status tone=neutral', { family: 'modal-main' })
      .locator('button')
      .click();
    await expect(page.locator('.ui-modal').getByRole('status')).toHaveText('Choose a city.');
    await settled();
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-MODAL-1.4 opens the news tones', async ({ page, lab }) => {
    await lab.open('modal');
    for (const tone of ['info', 'success', 'warning']) {
      await matrixCell(page, `tone=${tone} size=md`, { family: 'modal-main' })
        .locator(`button`)
        .click();
      const overlay = page.locator(`.ui-modal[data-lab-modal="${tone}-md"]`);
      await expect(overlay).toHaveAttribute('data-tone', tone);
      // The tone tints the panel's whole border, the same width on every edge.
      const panel = overlay.locator('.ui-modal__panel');
      await expect(panel).toHaveCSS('border-top-width', '1px');
      await expect(panel).not.toHaveCSS('border-top-color', 'rgb(209, 217, 224)');
      await page.keyboard.press('Escape');
      await expect(overlay).toHaveCount(0);
    }
  });

  test('UIC-MODAL-2.4 UIC-MODAL-3.4 UIC-MODAL-1.5 guards a draft and moves focus to chosen targets', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const outputs = (name: string) =>
      matrix(page, 'modal-main').locator(`[data-lab-output="${name}"]`);
    await matrix(page, 'modal-main').locator('[data-lab-open="guarded"]').click();
    const dialog = page.getByRole('dialog', { name: 'Postcard' });
    await expect(dialog.getByRole('textbox', { name: 'City' })).toBeFocused();
    await dialog.getByRole('textbox', { name: 'Message' }).fill('Greetings from Oslo');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(outputs('refused')).toHaveText('Escape');
    await page.mouse.click(4, 4);
    await expect(dialog).toBeVisible();
    await expect(outputs('refused')).toHaveText('outside press');
    await expect(outputs('exits')).toHaveText('0');
    await lab.expectAccessible('.ui-modal');
    await dialog.getByRole('textbox', { name: 'Message' }).fill('');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(matrix(page, 'modal-main').locator('[data-lab-after]')).toBeFocused();
    await expect(outputs('exits')).toHaveText('1');
  });

  test('UIC-MODAL-8.1 floats a non-modal dialog beside a usable page', async ({ page, lab }) => {
    await lab.open('modal');
    const opener = matrix(page, 'modal-main').locator('[data-lab-open="floating"]');
    await opener.click();
    const overlay = page.locator('.ui-modal[data-lab-modal="floating"]');
    await expect(overlay).toHaveAttribute('data-non-modal', 'true');
    await expect(overlay).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const note = page.getByRole('dialog', { name: 'Notes' }).getByRole('textbox', { name: 'Note' });
    await expect(note).toBeFocused();
    // The page around the panel takes pointer presses and typing while the dialog is open.
    const field = matrix(page, 'modal-main').locator('[data-lab-page-field]');
    await field.click();
    await page.keyboard.type('Lima');
    await expect(field).toHaveValue('Lima');
    await expect(field).toBeFocused();
    await expect(overlay).toBeVisible();
    await lab.expectAccessible();
    await note.click();
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-8.2 opens an anchored dialog against its button', async ({ page, lab }) => {
    await lab.open('modal');
    const opener = matrix(page, 'modal-main').locator('[data-lab-open="anchored"]');
    await opener.click();
    const popover = page.locator('.ui-modal[data-lab-modal="anchored"]');
    await expect(popover).toHaveAttribute('data-layer', 'dropdown');
    await expect(popover).toHaveCSS('z-index', '130');
    // Below the button, or above it when the viewport has no room below.
    const placement = await popover.getAttribute('data-placement');
    const button = await opener.boundingBox();
    const box = await popover.boundingBox();
    if (!button || !box) throw new Error('not rendered');
    if (placement === 'bottom') expect(box.y).toBeGreaterThanOrEqual(button.y + button.height);
    else expect(box.y + box.height).toBeLessThanOrEqual(button.y);
    expect(box.x).toBeCloseTo(button.x, 0);
    await expect(page.getByRole('dialog', { name: 'Rename' })).toBeVisible();
    await expect(popover.getByRole('textbox', { name: 'Name' })).toBeFocused();
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-2.1 keeps each presentation open on an Escape its content handled', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const cases = [
      { open: page.getByRole('button', { name: 'Blocking' }), name: 'Comment' },
      { open: page.getByRole('button', { name: 'Anchored' }), name: 'Comment' },
      { open: page.locator('[data-lab-open="floating"]'), name: 'Notes' },
    ];
    for (const { open, name } of cases) {
      await open.click();
      const dialog = page.getByRole('dialog', { name });
      const draft = dialog.locator('[data-lab-draft]');
      await draft.fill('Draft');
      await page.keyboard.press('Escape');
      await expect(draft).toHaveValue('');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }
  });
});

for (const [device, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['phone', { width: 390, height: 664 }],
] as const) {
  for (const theme of ['light', 'dark']) {
    test(`UIC-MODAL-1.7 keeps tall dialogs on a ${device} screen in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize(viewport);
      await lab.open('modal', { theme });
      for (const size of ['sm', 'md', 'lg', 'xl', 'full']) {
        const button = page.getByRole('button', { name: `Open the ${size} terms` });
        await button.scrollIntoViewIfNeeded();
        await button.click();
        const dialog = page.getByRole('dialog', { name: 'Terms of travel' });
        const panel = page.locator(`.ui-modal[data-lab-modal="tall-${size}"] .ui-modal__panel`);
        await expect(async () => {
          const box = await panel.boundingBox();
          expect(box?.y).toBeGreaterThanOrEqual(0);
          expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
        }).toPass();
        for (const control of [
          dialog.getByRole('heading', { name: 'Terms of travel' }),
          dialog.getByRole('button', { name: 'Close' }),
          dialog.getByRole('button', { name: 'Accept' }),
        ]) {
          await expect(control).toBeInViewport({ ratio: 1 });
        }
        const body = dialog.locator('.ui-modal__body');
        const scrolls = await body.evaluate((node) => node.scrollHeight > node.clientHeight);
        expect(scrolls).toBe(true);
        await body.getByText('Section 24.', { exact: false }).scrollIntoViewIfNeeded();
        await expect(body.getByText('Section 24.', { exact: false })).toBeInViewport();
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    });
  }
}

test('UIC-MODAL-9.1 UIC-MODAL-9.2 UIC-MODAL-9.3 keeps a draft across closing and reopening', async ({
  page,
  lab,
}) => {
  await lab.open('modal');
  const demo = page.locator('[data-lab-demo="retained"]');
  const opener = demo.getByRole('button', { name: 'Write a letter' });
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Letter' });
  const letter = dialog.getByRole('textbox', { name: 'Letter' });
  await expect(letter).toBeFocused();
  await page.keyboard.type('Dear Ana,');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  const overlay = page.locator('.ui-modal[data-lab-modal="retained"]');
  await expect(overlay).toHaveAttribute('inert', '');
  await expect(overlay).toBeHidden();
  await opener.click();
  await expect(letter).toHaveValue('Dear Ana,');
  await expect(letter).toBeFocused();
  await expect(demo.locator('[data-lab-output="Body mounts"]')).toHaveText('1');
  await lab.expectAccessible('.ui-modal[data-lab-modal="retained"]');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(opener).toBeFocused();
  await page.mouse.click(5, 5);
  await expect(opener).not.toBeFocused();
});

test('UIC-MODAL-4.3 starts the body sections below the dialog title', async ({ page, lab }) => {
  await lab.open('modal');
  await page.getByRole('button', { name: 'Trip outline' }).click();
  const dialog = page.getByRole('dialog', { name: 'Trip outline' });
  await expect(dialog.getByRole('heading', { name: 'Trip outline', level: 2 })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Stops', level: 3 })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Bookings', level: 3 })).toBeVisible();
});

test('UIC-MODAL-8.1 keeps a non-modal dialog opened from a blocking one usable', async ({
  page,
  lab,
}) => {
  await lab.open('modal');
  await page.getByRole('button', { name: 'Trip details' }).click();
  await page
    .getByRole('dialog', { name: 'Trip details' })
    .getByRole('button', { name: 'Notes' })
    .click();
  const notes = page.getByRole('dialog', { name: 'Notes' });
  await expect(notes).toBeVisible();
  const note = notes.getByRole('textbox', { name: 'Note' });
  await expect(note).toBeFocused();
  await note.click();
  await page.keyboard.type('Bring a map');
  await expect(note).toHaveValue('Bring a map');
  await expect(note).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(notes).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Trip details' })).toBeVisible();
});
