import { expect, test } from './fixtures.js';

test.describe('Button focus policies and events', () => {
  test('UIC-BUTTON-1.10 focuses on mount, keeps focus on press and stays out of the Tab order', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page.locator('[data-lab-case="focus-policies"]');
    await demo.getByRole('button', { name: 'Mount the buttons' }).click();
    await expect(demo.getByRole('button', { name: 'Focused on mount' })).toBeFocused();

    const search = demo.getByRole('textbox', { name: 'Search notes' });
    await search.click();
    await demo.getByRole('button', { name: 'Keeps focus where it was' }).click();
    await expect(demo.locator('[data-lab-output="presses"]')).toHaveText('1');
    await expect(search).toBeFocused();

    await demo.getByRole('button', { name: 'Keeps focus where it was' }).focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'After the skipped button' })).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-1.10 logs the press and hover lifecycle, including a cancelled press', async ({
    page,
    lab,
  }) => {
    await lab.open('button');
    const demo = page.locator('[data-lab-case="event-log"]');
    const log = demo.locator('[data-lab-output="events"] li');
    const logged = demo.getByRole('button', { name: 'Logged', exact: true });
    await logged.click();
    await expect(log).toContainText([
      'Logged: hoverStart',
      'Logged: hoverChange true',
      'Logged: pressStart (mouse)',
      'Logged: pressChange true',
      'Logged: pressUp',
      'Logged: pressEnd',
      'Logged: pressChange false',
      'Logged: press (mouse)',
    ]);

    await demo.getByRole('button', { name: 'Clear log' }).click();
    await logged.focus();
    await page.keyboard.press('Enter');
    await expect(log.filter({ hasText: 'press (keyboard)' })).toHaveCount(1);

    await demo.getByRole('button', { name: 'Clear log' }).click();
    const box = await logged.boundingBox();
    if (!box) throw new Error('The logged button has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 120, { steps: 4 });
    await page.mouse.up();
    await expect(log.filter({ hasText: 'Logged: pressStart' })).toHaveCount(1);
    await expect(log.filter({ hasText: 'Logged: pressEnd' })).toHaveCount(1);
    await expect(log.filter({ hasText: /^Logged: press \(/ })).toHaveCount(0);

    await demo.getByRole('button', { name: 'Clear log' }).click();
    await demo.getByRole('button', { name: 'Disabled' }).click({ force: true });
    await demo.getByRole('button', { name: /^Pending/ }).click({ force: true });
    await expect(log.filter({ hasText: /: press \(/ })).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-1.1 restores the form with a native reset button', async ({ page, lab }) => {
    await lab.open('button');
    const form = page.getByRole('form', { name: 'Delivery note' });
    const note = form.getByRole('textbox', { name: 'Note' });
    await note.fill('Ring twice');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(note).toHaveValue('Leave at the door');
  });

  test('UIC-BUTTON-21.5 runs a host action through runPendingAction', async ({ page, lab }) => {
    await lab.open('button');
    const demo = page.locator('[data-lab-case="host-pending"]');
    const output = (name: string) => demo.locator(`[data-lab-output="${name}"]`);
    await demo.getByRole('button', { name: 'Start export' }).click();
    await expect(output('pending')).toHaveText('true');
    await demo.getByRole('button', { name: 'Start export' }).click();
    await expect(output('result')).toHaveText('did not run');
    await demo.getByRole('button', { name: 'Finish export' }).click();
    await expect(output('pending')).toHaveText('false');
    await expect(output('result')).toHaveText('ran');

    await demo.getByRole('button', { name: 'Start export' }).click();
    await expect(output('pending')).toHaveText('true');
    await demo.getByRole('button', { name: 'Fail export' }).click();
    await expect(output('pending')).toHaveText('false');
    await expect(output('result')).toHaveText('did not run');
    await expect(output('error')).toHaveText('Error: The export failed');
  });
});
