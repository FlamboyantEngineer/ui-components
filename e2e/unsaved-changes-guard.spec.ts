import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

async function waitForSettledDialog(page: Page) {
  const overlay = page.locator('.ui-unsaved-changes-guard');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
}

test.describe('Unsaved Changes Guard lab', () => {
  test('UIC-UNSAVED-CHANGES-GUARD-2.2 UIC-UNSAVED-CHANGES-GUARD-2.4 asks with the choices the sources allow', async ({
    page,
    lab,
  }) => {
    await lab.open('unsaved-changes-guard');
    await matrixCell(page, 'save=can save label=labelled')
      .getByRole('button', { name: 'Leave' })
      .click();
    const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.ui-unsaved-changes-guard__list')).toHaveText('Recipe notes');
    await expect(dialog.locator('.ui-modal__actions button')).toHaveText([
      'Stay',
      'Discard',
      'Save',
    ]);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(matrixCell(page, 'save=can save label=labelled').locator('output')).toHaveText(
      'Left',
    );

    await matrixCell(page, 'save=cannot save label=unlabelled')
      .getByRole('button', { name: 'Leave' })
      .click();
    await expect(dialog).toHaveAccessibleDescription(
      'Your changes are not saved. Leave and discard them?',
    );
    await expect(dialog.locator('.ui-unsaved-changes-guard__list')).toHaveCount(0);
    await expect(dialog.locator('.ui-modal__actions button')).toHaveText(['Stay', 'Discard']);
    await expect(page.locator('.ui-unsaved-changes-guard')).toHaveAttribute('data-tone', 'danger');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      matrixCell(page, 'save=cannot save label=unlabelled').locator('output'),
    ).toHaveText('Stayed');
  });

  test('UIC-UNSAVED-CHANGES-GUARD-2.1 UIC-UNSAVED-CHANGES-GUARD-2.5 UIC-UNSAVED-CHANGES-GUARD-4.1 guards a tab switch', async ({
    page,
    lab,
  }) => {
    await lab.open('unsaved-changes-guard');
    const form = page.locator('[data-lab-demo="form"]');
    const home = form.getByRole('tab', { name: 'Home' });
    await home.click();
    await expect(home).toHaveAttribute('aria-selected', 'true');
    await form.getByRole('tab', { name: 'Person' }).click();
    const name = form.getByRole('textbox', { name: 'Display name' });
    await name.fill('Maria S.');
    await expect(form.locator('[data-lab-dirty]')).toHaveText('Unsaved changes');

    await home.click();
    const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Stay' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(form.getByRole('tab', { name: 'Person' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(name).toHaveValue('Maria S.');

    await home.click();
    await dialog.getByRole('button', { name: 'Discard' }).click();
    await expect(home).toHaveAttribute('aria-selected', 'true');
    await expect(form.locator('[data-lab-dirty]')).toHaveText('All changes saved');
    await form.getByRole('tab', { name: 'Person' }).click();
    await expect(dialog).toBeHidden();
    await expect(name).toHaveValue('Maria Santos');
  });

  test('UIC-UNSAVED-CHANGES-GUARD-2.3 saves before following a link, and stays when saving fails', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('unsaved-changes-guard');
    const form = page.locator('[data-lab-demo="form"]');
    await form.getByRole('textbox', { name: 'Display name' }).fill('Ana');
    await form.locator('.ui-switch__label').click();
    await form.getByRole('link', { name: 'Help' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Leave this page?' });
    await expect(dialog).toHaveAccessibleDescription(
      'Open the Help page? Save or discard your changes first.',
    );
    await dialog.getByRole('button', { name: 'Save' }).click();
    await page.clock.runFor(600);
    await expect(dialog.getByRole('alert')).toHaveText(
      'The server is busy. Try again in a minute.',
    );
    await expect(form.locator('[data-lab-page]')).toHaveText('Profile');
    await dialog.getByRole('button', { name: 'Stay' }).click();
    await expect(dialog).toBeHidden();

    await form.locator('.ui-switch__label').click();
    await form.getByRole('link', { name: 'Help' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.ui-modal__primary')).toHaveAttribute('data-pending', 'true');
    await expect(form.locator('[data-lab-page]')).toHaveText('Profile');
    await page.clock.runFor(600);
    await expect(form.locator('[data-lab-page]')).toHaveText('Help');
    await expect(form.locator('[data-lab-dirty]')).toHaveText('All changes saved');
  });

  test('UIC-UNSAVED-CHANGES-GUARD-2.6 keeps a replacing question open when the replaced save ends', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('unsaved-changes-guard');
    const demo = page.locator('[data-lab-demo="replaced"]');
    await demo.getByRole('button', { name: 'Leave, then sign out' }).click();
    const first = page.getByRole('alertdialog', { name: 'Leave the plan?' });
    await first.getByRole('button', { name: 'Save' }).click();
    await page.clock.runFor(1000);
    const second = page.getByRole('alertdialog', { name: 'Sign out now?' });
    await expect(second).toBeVisible();
    await expect(demo.locator('[data-lab-answers]')).toHaveText('Leave the plan? Stayed');
    await page.clock.runFor(1500);
    await expect(second).toBeVisible();
    await expect(page.locator('.ui-modal__primary')).not.toHaveAttribute('data-pending');
    await second.getByRole('button', { name: 'Stay' }).click();
    await expect(demo.locator('[data-lab-answers]')).toHaveText(
      'Leave the plan? Stayed · Sign out now? Stayed',
    );
  });

  test('UIC-UNSAVED-CHANGES-GUARD-2.7 follows a source that loses its save while asking', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('unsaved-changes-guard');
    const demo = page.locator('[data-lab-demo="changing"]');
    await demo.getByRole('button', { name: 'Leave, then go offline' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
    await expect(dialog.locator('.ui-modal__actions button')).toHaveText([
      'Stay',
      'Discard',
      'Save',
    ]);
    await page.clock.runFor(1000);
    await expect(dialog.locator('.ui-modal__actions button')).toHaveText(['Stay', 'Discard']);
    await expect(dialog).toHaveAccessibleDescription(
      'Your changes are not saved. Leave and discard them?',
    );
    await dialog.getByRole('button', { name: 'Discard' }).click();
    await expect(demo.locator('[data-lab-answer]')).toHaveText('Left');
  });

  test('UIC-UNSAVED-CHANGES-GUARD-2.6 closes the question a clean leave replaces', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('unsaved-changes-guard');
    const demo = page.locator('[data-lab-demo="saved-elsewhere"]');
    await demo.getByRole('button', { name: 'Leave, then save elsewhere' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
    await expect(dialog).toBeVisible();
    await page.clock.runFor(1000);
    await page.clock.runFor(100);
    await expect(demo.locator('[data-lab-answers]')).toHaveText('First Stayed · Second Left');
    await expect(dialog).toBeHidden();
  });

  test('UIC-UNSAVED-CHANGES-GUARD-1.1 UIC-UNSAVED-CHANGES-GUARD-1.2 UIC-UNSAVED-CHANGES-GUARD-3.1 asks a nested guard about its own sources', async ({
    page,
    lab,
  }) => {
    await lab.open('unsaved-changes-guard');
    const demo = page.locator('[data-lab-demo="nested"]');
    await demo.getByRole('textbox', { name: 'Page title' }).fill('Monthly menu');
    await demo.getByRole('textbox', { name: 'Panel notes' }).fill('Buy plums');

    await demo.getByRole('button', { name: 'Close panel' }).click();
    const panelDialog = page.getByRole('alertdialog', { name: 'Close the panel?' });
    await expect(panelDialog.locator('.ui-unsaved-changes-guard__list')).toHaveText('Panel notes');
    await panelDialog.getByRole('button', { name: 'Stay' }).click();
    await expect(panelDialog).toBeHidden();

    await demo.getByRole('button', { name: 'Leave page' }).click();
    const pageDialog = page.getByRole('alertdialog', { name: 'Unsaved changes' });
    await expect(pageDialog.locator('.ui-unsaved-changes-guard__list li')).toHaveText([
      'Page title',
      'Panel notes',
    ]);
    await pageDialog.getByRole('button', { name: 'Discard' }).click();
    await expect(demo.locator('[data-lab-left]')).toHaveText('Leaves: 1');
    await expect(demo.getByRole('textbox', { name: 'Panel notes' })).toHaveValue('Buy pears');

    await demo.getByRole('button', { name: 'Close panel' }).click();
    await expect(panelDialog).toBeHidden();
    await expect(demo.getByRole('button', { name: 'Open panel' })).toBeVisible();
  });

  test('UIC-UNSAVED-CHANGES-GUARD-4.1 passes axe with the question open, in both themes', async ({
    page,
    lab,
  }) => {
    for (const theme of ['light', 'dark']) {
      await lab.open('unsaved-changes-guard', { theme });
      await expect(page.locator('#lab-root .ui-button').first()).toBeVisible();
      await lab.expectAccessible();
      await matrixCell(page, 'save=can save label=labelled')
        .getByRole('button', { name: 'Leave' })
        .click();
      await waitForSettledDialog(page);
      await lab.expectAccessible('.ui-unsaved-changes-guard');
      await page.keyboard.press('Escape');
    }
  });
});
