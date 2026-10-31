import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const cell = (page: Page, state: string, part = 'text only') =>
  matrixCell(page, `state=${state} part=${part}`);

const richCell = (page: Page, content: string, status: string) =>
  matrixCell(page, `content=${content} status=${status}`);

const composer = (page: Page, name: string) => page.locator(`[data-lab-composer="${name}"]`);

/** Dispatches a paste at the element, carrying files and text as the clipboard would. */
async function paste(target: Locator, data: { files?: string[]; text?: string; html?: string }) {
  await target.evaluate((element, { files = [], text, html }) => {
    const transfer = new DataTransfer();
    for (const name of files) transfer.items.add(new File(['x'], name, { type: 'text/plain' }));
    if (text !== undefined) transfer.setData('text/plain', text);
    if (html !== undefined) transfer.setData('text/html', html);
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }),
    );
  }, data);
}

/** A data transfer carrying one file, for drag events. */
function fileTransfer(page: Page, name: string) {
  return page.evaluateHandle((fileName) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['x'], fileName, { type: 'image/png' }));
    return transfer;
  }, name);
}

test.describe('Message Composer lab', () => {
  test('UIC-MESSAGE-COMPOSER-1.2 UIC-MESSAGE-COMPOSER-3.10 sends, queues and sends now on the chords typed in', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const demo = page.locator('[data-lab-demo="shortcuts"]');
    const box = composer(page, 'shortcuts').getByRole('textbox');
    const log = demo.locator('[data-lab-output="shortcut-log"]');
    await box.click();
    await page.keyboard.type('Later');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Right away');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(log).toHaveText('Queued: Later · Sent now: Right away');
    await demo.getByRole('textbox', { name: 'Send while idle' }).fill('Alt+S');
    await demo.getByText('A reply is running').click();
    await expect(composer(page, 'shortcuts').getByRole('button', { name: 'Send' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+S',
    );
    await box.click();
    await page.keyboard.type('Idle');
    await page.keyboard.press('Enter');
    await page.keyboard.type('note');
    await page.keyboard.press('Alt+s');
    await expect(log).toHaveText(/Sent: Idle\nnote$/);
    const queue = composer(page, 'queue').getByRole('textbox');
    await composer(page, 'queue').getByRole('textbox').click();
    await page.keyboard.type('First');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Now');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.locator('[data-lab-output="sent-now"]')).toHaveText('Now');
    await expect(queue).toHaveValue('');
  });

  test('UIC-MESSAGE-COMPOSER-1.1 UIC-MESSAGE-COMPOSER-1.3 UIC-MESSAGE-COMPOSER-1.5 UIC-MESSAGE-COMPOSER-2.2 UIC-MESSAGE-COMPOSER-3.1 UIC-MESSAGE-COMPOSER-4.2 draws each state', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const draft = cell(page, 'draft').getByRole('textbox', { name: 'Message (draft, text only)' });
    await expect(draft).toHaveValue('Can we move the review to Friday?');
    await expect(cell(page, 'draft').getByRole('button', { name: 'Send' })).toBeEnabled();
    await expect(cell(page, 'empty').getByRole('button', { name: 'Send' })).toBeDisabled();
    await expect(cell(page, 'pending').locator('.ui-message-composer')).toHaveAttribute(
      'data-pending',
      'true',
    );
    await expect(cell(page, 'pending').locator('.ui-button__spinner')).toBeVisible();
    await expect(cell(page, 'stoppable').getByRole('button', { name: 'Stop' })).toBeEnabled();
    await expect(cell(page, 'disabled').getByRole('textbox')).toBeDisabled();
    await expect(cell(page, 'editing').getByRole('button', { name: 'Save' })).toBeEnabled();
    const full = cell(page, 'draft', 'attachments and tools');
    const banner = await full.locator('.ui-message-composer__banner').boundingBox();
    const attachment = await full.locator('.ui-message-composer__attachments').boundingBox();
    const input = await full.getByRole('textbox').boundingBox();
    const tools = await full.locator('.ui-message-composer__start').boundingBox();
    const send = await full.getByRole('button', { name: 'Send' }).boundingBox();
    expect(banner && attachment && banner.y + banner.height <= attachment.y).toBe(true);
    expect(attachment && input && attachment.y + attachment.height <= input.y).toBe(true);
    expect(tools && send && tools.x + tools.width <= send.x).toBe(true);
    const pills = richCell(page, 'pills', 'ready').locator('.ui-message-composer__pill');
    await expect(pills).toHaveText(['@Maria Santos', '/summarize']);
    await expect(
      richCell(page, 'empty', 'ready').getByRole('textbox', {
        name: 'Rich message (empty, ready)',
      }),
    ).toHaveAttribute('aria-multiline', 'true');
    await expect(richCell(page, 'code block', 'ready').locator('pre')).toHaveText(
      'const total = items.length;',
    );
    await lab.expectAccessible();
  });

  test('UIC-MESSAGE-COMPOSER-1.1 UIC-MESSAGE-COMPOSER-1.2 sends on Enter, breaks lines with Shift+Enter and grows', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const live = composer(page, 'live');
    const input = live.getByRole('textbox', { name: 'Message' });
    await input.click();
    const oneLine = (await input.boundingBox())?.height ?? 0;
    await page.keyboard.type('First line');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Second line');
    await expect.poll(async () => (await input.boundingBox())?.height).toBeGreaterThan(oneLine);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('First line\nSecond line');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect.poll(async () => (await input.boundingBox())?.height).toBe(oneLine);
    await live.getByRole('button', { name: 'Send with Enter' }).click();
    await input.click();
    await page.keyboard.type('Wait');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Wait\n');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('[data-lab-sent="2"]')).toHaveText('Wait\n');
    const chooser = page.waitForEvent('filechooser');
    await live.getByRole('button', { name: 'Attach files' }).click();
    await (
      await chooser
    ).setFiles({ name: 'Photo 1.png', mimeType: 'image/png', buffer: Buffer.from('x') });
    await live.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.locator('[data-lab-sent="3"]')).toHaveText(' (Photo 1.png)');
  });

  test('UIC-MESSAGE-COMPOSER-1.3 turns Send into Stop and keeps keyboard focus on it', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const reply = composer(page, 'reply');
    await reply.getByRole('textbox').click();
    await page.keyboard.type('How warm was the crate?');
    await page.keyboard.press('Enter');
    const stop = reply.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(stop).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="stops"]')).toHaveText('1');
    await expect(reply.getByRole('button', { name: 'Send' })).toBeFocused();
  });

  test('UIC-MESSAGE-COMPOSER-1.6 mentions people with Enter inserting instead of sending', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const input = composer(page, 'live').getByRole('textbox');
    await input.click();
    await page.keyboard.type('Ping @le');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(1);
    await expect(list.getByRole('option')).toContainText('Lena Ortiz');
    await expect(page.locator('.ui-message-composer__completions')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Ping @Lena ');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveCount(0);
    await page.keyboard.type('@');
    await expect(list.getByRole('option')).toHaveCount(3);
    await expect(page.locator('.ui-message-composer__completions')).not.toHaveAttribute(
      'data-entering',
    );
    await lab.expectAccessible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('Ping @Lena @');
  });

  test('UIC-MESSAGE-COMPOSER-1.7 breaks the line on Enter on a touch screen', async ({
    page,
    lab,
  }) => {
    await page.addInitScript(() => {
      const native = window.matchMedia.bind(window);
      const coarse = {
        matches: true,
        media: '(pointer: coarse)',
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      };
      window.matchMedia = (query: string) =>
        query === coarse.media ? (coarse as MediaQueryList) : native(query);
    });
    await lab.open('message-composer');
    const touch = composer(page, 'touch');
    const input = touch.getByRole('textbox');
    await expect(touch.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Enter',
    );
    await input.click();
    await page.keyboard.type('One');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Two');
    await expect(input).toHaveValue('One\nTwo');
    await page.keyboard.press('Control+Enter');
    await expect(input).toHaveValue('');
  });

  test('UIC-MESSAGE-COMPOSER-3.2 attaches dropped and pasted files', async ({ page, lab }) => {
    await lab.open('message-composer');
    for (const name of ['live', 'assistant']) {
      const target = composer(page, name);
      const input = target.getByRole('textbox');
      const dataTransfer = await fileTransfer(page, `Map ${name}.png`);
      await input.dispatchEvent('dragenter', { dataTransfer });
      await expect(target).toHaveAttribute('data-drop-target', 'true');
      await input.dispatchEvent('dragleave', { dataTransfer });
      await expect(target).not.toHaveAttribute('data-drop-target');
      await input.dispatchEvent('dragenter', { dataTransfer });
      await input.dispatchEvent('drop', { dataTransfer });
      await expect(target).not.toHaveAttribute('data-drop-target');
      await expect(target.getByRole('button', { name: `Remove Map ${name}.png` })).toBeVisible();
      await input.focus();
      await paste(input, { files: [`Notes ${name}.txt`] });
      await expect(target.getByRole('button', { name: `Remove Notes ${name}.txt` })).toBeVisible();
    }
    await expect(composer(page, 'assistant').getByRole('textbox')).toHaveText('');
  });

  test('UIC-MESSAGE-COMPOSER-3.5 recalls earlier prompts until one is edited', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const input = composer(page, 'history').getByRole('textbox');
    await input.click();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('List the open questions');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('Summarize the field notes');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveValue('');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.type(' now');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('List the open questions now');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('List the open questions now');
  });

  test('UIC-MESSAGE-COMPOSER-4.3 UIC-MESSAGE-COMPOSER-4.4 UIC-MESSAGE-COMPOSER-4.8 inserts and removes pills from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const assistant = composer(page, 'assistant');
    const input = assistant.getByRole('textbox', { name: 'Prompt' });
    await input.click();
    await page.keyboard.type('/');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(3);
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await list.getByRole('option').nth(1).getAttribute('id')) ?? '',
    );
    await page.keyboard.press('Enter');
    await expect(input.locator('.ui-message-composer__pill')).toHaveText(['/translate']);
    await page.keyboard.type('this for @jo');
    await expect(list.getByRole('option')).toHaveText(['Jon Berg Field research']);
    await expect(page.locator('.ui-message-composer__completions')).not.toHaveAttribute(
      'data-entering',
    );
    await lab.expectAccessible();
    await page.keyboard.press('Tab');
    await expect(input.locator('.ui-message-composer__pill')).toHaveText([
      '/translate',
      '@Jon Berg',
    ]);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect(input.locator('.ui-message-composer__pill')).toHaveText(['/translate']);
    await expect(assistant.getByRole('status')).toHaveText('Jon Berg removed');
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await expect(input.locator('.ui-message-composer__pill')).toHaveCount(0);
    await expect(input).toHaveText(' this for ');
    await page.keyboard.press('End');
    await page.keyboard.type('@ma');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText(
      'this for @Maria Santos (mention maria 10–23)',
    );
  });

  test('UIC-MESSAGE-COMPOSER-4.5 UIC-MESSAGE-COMPOSER-4.6 writes code blocks and Markdown without a toolbar', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const input = composer(page, 'assistant').getByRole('textbox');
    await input.click();
    await page.keyboard.type('Run');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('```');
    await expect(input.locator('pre.ui-message-composer__code-block')).toBeVisible();
    await page.keyboard.type('npm test');
    await page.keyboard.press('Enter');
    await page.keyboard.type('  --watch');
    await expect(input.locator('pre')).toHaveText('npm test\n  --watch');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.type('please');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText(
      'Run\n```\nnpm test\n  --watch\n```\nplease',
    );
    // The lab's reply ends on its own after a moment.
    await expect(composer(page, 'assistant').getByRole('button', { name: 'Send' })).toBeVisible();
    await input.click();
    await page.keyboard.type('```x');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('[data-lab-sent="2"]')).toHaveText('```\nx\n```');
    await expect(composer(page, 'assistant').getByRole('button', { name: 'Send' })).toBeVisible();
    await page.keyboard.type('bold');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');
    await page.keyboard.press('Control+i');
    await expect(input).toHaveText('**_bold_**');
  });

  test('UIC-MESSAGE-COMPOSER-4.7 pastes plain text with its spacing', async ({ page, lab }) => {
    await lab.open('message-composer');
    const input = composer(page, 'assistant').getByRole('textbox');
    await input.click();
    await paste(input, { text: 'def f():\n    return  1', html: '<b>def</b> f():' });
    await expect(input.locator('p')).toHaveText(['def f():', '    return  1']);
    await expect(input.locator('b')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('def f():\n    return  1');
  });

  test('UIC-MESSAGE-COMPOSER-4.8 never sends the Enter of an input method composition', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const input = composer(page, 'assistant').getByRole('textbox');
    await input.click();
    await page.keyboard.type('nihon');
    await input.evaluate((element) => {
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 229,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect(page.locator('[data-lab-sent="1"]')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="1"]')).toHaveText('nihon');
  });

  test('UIC-MESSAGE-COMPOSER-3.3 UIC-MESSAGE-COMPOSER-3.4 edits the last message from an empty composer', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const team = composer(page, 'team');
    const input = team.getByRole('textbox');
    await input.click();
    await page.keyboard.type('Lunch at noon?');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-team="1"]')).toContainText('Lunch at noon?');
    await page.keyboard.press('ArrowUp');
    await expect(team).toHaveAttribute('data-editing', 'true');
    await expect(team.locator('.ui-message-composer__banner')).toHaveText('Editing your message');
    await expect(input).toHaveText('Lunch at noon?');
    await page.keyboard.press('Escape');
    await expect(team).not.toHaveAttribute('data-editing');
    await expect(input).toHaveText('');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.type(' Or one?');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-team="1"]')).toContainText(
      'Lunch at noon? Or one? (edited)',
    );
    // The action bar takes the pointer only while the message is hovered or focused.
    const sent = page.locator('[data-lab-team="1"]');
    await sent.hover();
    await sent.getByRole('button', { name: 'Reply' }).click();
    await expect(team.locator('.ui-message-composer__banner')).toContainText('Replying to');
    await team.getByRole('button', { name: 'Close' }).click();
    await expect(team.locator('.ui-message-composer__banner')).toHaveCount(0);
  });

  test('UIC-MESSAGE-COMPOSER-3.6 keeps each conversation draft with its pills', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const team = composer(page, 'team');
    await team.getByRole('textbox').click();
    await page.keyboard.type('Ask @ma');
    await page.keyboard.press('Enter');
    await page.keyboard.type('later');
    await page.getByRole('radio', { name: 'Jon Berg' }).click();
    await expect(team.getByRole('textbox')).toHaveText('');
    await page.getByRole('radio', { name: 'Design team' }).click();
    await expect(team.locator('.ui-message-composer__pill')).toHaveText('@Maria Santos');
    await expect(team.getByRole('textbox')).toHaveText('Ask @Maria Santos later');
    await page.reload();
    await expect(composer(page, 'team').locator('.ui-message-composer__pill')).toHaveText(
      '@Maria Santos',
    );
  });

  test('UIC-MESSAGE-COMPOSER-3.9 settles a message in the storage it was sent from', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const workspace = composer(page, 'workspace');
    const sendButton = workspace.getByRole('button', { name: 'Send' });
    await sendButton.click();
    await expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('radio', { name: 'South' }).click();
    await expect(sendButton).not.toHaveAttribute('aria-disabled');
    await expect(page.locator('[data-lab-workspace-sent]')).toHaveText('North: Same text in both');
    await expect(workspace.getByRole('textbox')).toHaveValue('Same text in both');
    await page.getByRole('radio', { name: 'North' }).click();
    await expect(workspace.getByRole('textbox')).toHaveValue('');
  });

  test('UIC-MESSAGE-COMPOSER-5.1 UIC-MESSAGE-COMPOSER-5.2 opens the + menu above the composer with its categories', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const disabled = cell(page, 'disabled', 'menu and tools');
    await expect(disabled.getByRole('button', { name: 'Add and more' })).toBeDisabled();
    const target = composer(page, 'menu');
    const tools = target.locator('.ui-message-composer__start');
    await expect(tools.locator(':scope > *').first()).toHaveClass(
      /ui-message-composer__menu-button/,
    );
    await expect(target.getByRole('button', { name: 'Attach files' })).toHaveCount(0);
    const plus = target.getByRole('button', { name: 'Add and more' });
    // The composer at the bottom of the window, where it sits in a conversation.
    await target.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    await plus.click();
    const menu = page.getByRole('menu', { name: 'Add and more' });
    const popover = page.locator('.ui-menu-popover').filter({ has: menu });
    await expect(popover).toHaveAttribute('data-placement', 'top');
    await expect(popover).not.toHaveAttribute('data-entering');
    const surface = await popover.boundingBox();
    const frame = await target.boundingBox();
    expect(surface && frame && surface.y + surface.height <= frame.y + 1, 'above').toBe(true);
    expect(surface && frame && Math.abs(surface.x - frame.x) <= 1, 'at the start').toBe(true);
    await expect(menu.getByRole('group')).toHaveCount(2);
    await expect(menu.locator('.ui-menu-section__header')).toHaveText(['Add', 'Integrations']);
    const calendar = menu.getByRole('menuitem', { name: /^Calendar/ });
    await expect(calendar).toHaveAccessibleName(/^Calendar\s*Shared schedule\s*Alt C$/);
    await expect(calendar.locator('.ui-menu-item__icon')).toBeVisible();
    const label = await calendar.locator('.ui-menu-item__label').boundingBox();
    const note = await calendar.locator('.ui-menu-item__description').boundingBox();
    expect(label && note && Math.abs(label.y - note.y) < 4 && note.x > label.x, 'one line').toBe(
      true,
    );
    const voice = menu.getByRole('menuitem', {
      name: 'Record a voice note Allow the microphone first',
    });
    await expect(voice).toHaveAttribute('aria-disabled', 'true');
    expect(await menu.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    await lab.expectAccessible('.ui-menu-popover');
    await menu.getByRole('menuitem', { name: 'Files Team drive' }).click();
    const files = page.getByRole('menu', { name: /^Files/ });
    await expect(files.getByRole('menuitem', { name: 'Report.pdf Edited today' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(files).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(plus).toBeFocused();
  });

  test('UIC-MESSAGE-COMPOSER-5.3 UIC-MESSAGE-COMPOSER-5.4 inserts at the caret, attaches files and flips a toggle from the menu', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const target = composer(page, 'menu');
    const input = target.getByRole('textbox');
    const plus = target.getByRole('button', { name: 'Add and more' });
    const menu = page.getByRole('menu', { name: 'Add and more' });
    await input.click();
    await page.keyboard.type('Weekend. ');
    await plus.click();
    const plan = menu.getByRole('menuitemcheckbox', { name: /^Plan mode/ });
    await plan.click();
    await expect(plan).toHaveAttribute('aria-checked', 'true');
    await expect(menu).toBeVisible();
    await expect(page.locator('[data-lab-output="plan"]')).toHaveText('on');
    await menu.getByRole('menuitem', { name: /^Insert a goal prompt/ }).click();
    await expect(menu).toHaveCount(0);
    await expect(input).toBeFocused();
    await page.keyboard.type('a calm trip ');
    await expect(input).toHaveValue('Weekend. Goal: a calm trip ');
    await plus.click();
    await menu.getByRole('menuitem', { name: /^Calendar/ }).click();
    await expect(input).toHaveValue('Weekend. Goal: a calm trip /calendar ');
    await expect(input).toBeFocused();
    const chooser = page.waitForEvent('filechooser');
    await plus.click();
    await menu.getByRole('menuitem', { name: /^Attach files/ }).click();
    await (
      await chooser
    ).setFiles({ name: 'Map.png', mimeType: 'image/png', buffer: Buffer.from('x') });
    await expect(target.getByRole('button', { name: 'Remove Map.png' })).toBeVisible();
    await input.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="menu-sent"]')).toHaveText(
      'Weekend. Goal: a calm trip /calendar + Map.png',
    );
  });

  test('UIC-MESSAGE-COMPOSER-5.5 UIC-MESSAGE-COMPOSER-5.3 searches the rich composer menu and inserts a command pill', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const target = composer(page, 'menu-search');
    const input = target.getByRole('textbox');
    await input.click();
    await page.keyboard.type('Check ');
    await target.getByRole('button', { name: 'Add and more' }).click();
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeFocused();
    await page.keyboard.type('inbox');
    const menu = page.getByRole('menu', { name: 'Add and more' });
    await expect(menu.getByRole('menuitem')).toHaveText([/^Mail/]);
    await expect(menu.locator('.ui-menu-section__header')).toHaveText(['Integrations']);
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(input.locator('.ui-message-composer__pill')).toHaveText(['/mail']);
    await expect(input).toBeFocused();
    await page.keyboard.type('for the dates');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="menu-search-sent"]')).toHaveText(
      'Check /mail for the dates (command mail 6–11)',
    );
  });

  test('UIC-MESSAGE-COMPOSER-3.7 inserts an emoji at the caret and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const live = composer(page, 'live');
    const input = live.getByRole('textbox');
    await input.click();
    await page.keyboard.type('Lunch?');
    await page.keyboard.press('ArrowLeft');
    await live.getByRole('button', { name: 'Insert emoji' }).click();
    await page.getByRole('searchbox').fill('pizza');
    await page.getByRole('row', { name: 'pizza' }).click();
    await expect(input).toHaveValue('Lunch🍕?');
    await expect(input).toBeFocused();
    await page.keyboard.type('!');
    await expect(input).toHaveValue('Lunch🍕!?');
  });
});
