import { expect, matrix, test } from './fixtures.js';

test.describe('Preview Trigger lab', () => {
  test('UIC-HOVER-CARD-4.3 opens the first hover preview after programmatic trigger focus', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-avatar"]');
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    await trigger.focus();
    await expect(card).toHaveCount(0);
    await trigger.hover();
    await expect(card).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('UIC-HOVER-CARD-4.1 UIC-HOVER-CARD-4.2 opens a card from the keyboard and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="name"]');
    await expect(trigger).toHaveAccessibleName('Lena Ortiz');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const card = page.getByRole('dialog', { name: 'Lena Ortiz' });
    await expect(card).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const triggerBox = await trigger.boundingBox();
    const cardBox = await card.boundingBox();
    const below = (cardBox?.y ?? 0) >= (triggerBox?.y ?? 0) + (triggerBox?.height ?? 0);
    const above = (cardBox?.y ?? 0) + (cardBox?.height ?? 0) <= (triggerBox?.y ?? 0);
    expect(below || above).toBe(true);
    await expect(card.locator(':focus')).toHaveCount(0);
    expect(await card.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await lab.expectAccessible('.ui-preview-trigger__popover');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press(' ');
    await expect(card).toBeVisible();
    await page.mouse.click(5, 300);
    await expect(card).toHaveCount(0);
  });

  test('UIC-HOVER-CARD-4.1 sets a name alone on the sentence baseline and keeps avatars centred', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    for (const size of ['small', 'body', 'large']) {
      const sentence = matrix(page, 'preview-trigger').locator(`[data-lab-sentence="${size}"]`);
      await expect(sentence.locator('[data-lab-inline-name]')).toHaveCount(3);
      const shifts = await sentence.evaluate((paragraph) => {
        const charRects = (node: Text) =>
          [...node.data].flatMap((character, index) => {
            if (!character.trim()) return [];
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            return [range.getBoundingClientRect()];
          });
        const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
        const words: DOMRect[] = [];
        const names: DOMRect[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node as Text;
          (text.parentElement?.closest('[data-lab-inline-name]') ? names : words).push(
            ...charRects(text),
          );
        }
        return names.map((name) => {
          const sameLine = words.filter(
            (word) =>
              word.top < name.bottom - name.height / 2 && word.bottom > name.top + name.height / 2,
          );
          return sameLine.length === 0
            ? Number.POSITIVE_INFINITY
            : Math.max(...sameLine.map((word) => Math.abs(word.bottom - name.bottom)));
        });
      });
      for (const shift of shifts) expect(shift, size).toBeLessThanOrEqual(0.5);
      const lines = await sentence.evaluate((paragraph) =>
        Math.round(
          paragraph.getBoundingClientRect().height /
            parseFloat(getComputedStyle(paragraph).lineHeight),
        ),
      );
      expect(lines, size).toBeGreaterThan(1);
    }
    const name = matrix(page, 'preview-trigger')
      .locator('[data-lab-sentence="body"] [data-lab-inline-name]')
      .first();
    await name.focus();
    await expect(name).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Lena Ortiz' })).toBeVisible();
    await page.keyboard.press('Escape');
    for (const trigger of ['avatar', 'identity']) {
      expect(
        await page
          .locator(`[data-lab-trigger="${trigger}"]`)
          .evaluate((node) => [
            getComputedStyle(node).display,
            getComputedStyle(node).verticalAlign,
          ]),
      ).toEqual(['inline-flex', 'middle']);
    }
  });

  test('UIC-HOVER-CARD-4.2 closes the card before reporting an action', async ({ page, lab }) => {
    await lab.open('hover-card');
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="identity"]');
    await trigger.click();
    const card = page.getByRole('dialog', { name: 'Jon Berg' });
    await card.getByRole('button', { name: 'View profile' }).click();
    await expect(card).toHaveCount(0);
    await expect(matrix(page, 'preview-trigger').locator('[data-lab-output="action"]')).toHaveText(
      'profile for Jon Berg',
    );
    await expect(trigger).toBeFocused();
    await expect(
      matrix(page, 'preview-trigger').locator('[data-lab-trigger="disabled"]'),
    ).toBeDisabled();
  });

  test('UIC-HOVER-CARD-4.2 opens cards from a presence strip and passes axe in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card', { theme: 'dark' });
    await lab.expectAccessible();
    const strip = matrix(page, 'preview-trigger').locator('[data-lab-strip="cards"]');
    await strip.getByRole('button', { name: 'Sam Okafor, Idle' }).click();
    const card = page.getByRole('dialog', { name: 'Sam Okafor' });
    await expect(card).toBeVisible();
    await lab.expectAccessible('.ui-preview-trigger__popover');
  });

  test('UIC-HOVER-CARD-4.3 opens on hover after the delay, keeps focus and stays open on the way in', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-avatar"]');
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    // React Aria opens previews for a pointer it has already seen move.
    await page.mouse.move(5, 5);
    await trigger.hover();
    await page.clock.runFor(599);
    await expect(card).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(card).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(card.locator(':focus')).toHaveCount(0);
    await expect(card.locator('xpath=..')).toHaveAttribute('data-trigger', 'PreviewTrigger');
    const box = await card.boundingBox();
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20, { steps: 8 });
    await page.clock.runFor(1000);
    await expect(card).toBeVisible();
    await page.mouse.move(5, 5);
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    await page.clock.resume();
  });

  test('UIC-HOVER-CARD-4.3 Escape dismisses a hovered card while the page keeps focus', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-avatar"]');
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    await trigger.hover();
    await expect(card).toBeVisible();
    await card.hover();
    await expect(page.locator('body')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(page.locator('body')).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('UIC-HOVER-CARD-4.3 closes a hover card before reporting its action', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-avatar"]');
    const card = page.getByRole('dialog', { name: 'Priya Nair' });
    // The page's clock is installed before any card timer starts: a timer of the real clock could
    // not be cancelled afterwards, and would close the card that the keyboard opens below.
    await page.clock.install();
    await page.mouse.move(5, 5);
    await trigger.hover();
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Message' }).click();
    await page.clock.runFor(2000);
    await expect(card).toHaveCount(0);
    await expect(
      matrix(page, 'preview-trigger').locator('[data-lab-output="hover-action"]'),
    ).toHaveText('message for Priya Nair');
    await expect(trigger).toBeFocused();

    // From the keyboard, focus returns without reopening the card.
    await page.mouse.move(5, 5);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Message' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.clock.runFor(2000);
    await expect(card).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(
      matrix(page, 'preview-trigger').locator('[data-lab-output="hover-action"]'),
    ).toHaveText('message for Priya Nair');
  });

  test('UIC-HOVER-CARD-4.3 opens on keyboard focus, lets Tab in and returns focus on Escape', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const trigger = matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-name"]');
    const card = page.getByRole('dialog', { name: 'Tom Li' });
    await matrix(page, 'preview-trigger').locator('[data-lab-trigger="hover-avatar"]').focus();
    await page.clock.runFor(100);
    await page.keyboard.press('Tab');
    await expect(trigger).toBeFocused();
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Message' })).toBeFocused();
    await page.keyboard.press('Escape');
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    // Focus returns in an animation frame once the card has gone.
    await page.clock.runFor(100);
    await expect(trigger).toBeFocused();
    await page.clock.resume();
    await page.clock.runFor(600);
    await lab.expectAccessible();
  });

  test('UIC-HOVER-CARD-4.4 loads a card on opening and follows a controlled state', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    await page.mouse.move(5, 5);
    await matrix(page, 'preview-trigger').locator('[data-lab-trigger="loading"]').hover();
    await page.clock.runFor(600);
    const loading = page.getByRole('dialog', { name: 'Ines Duarte' });
    await expect(loading.locator('.ui-card')).toHaveAttribute('data-loading', 'true');
    await expect(loading.locator('.ui-card__skeleton')).toBeVisible();
    await page.clock.runFor(800);
    await expect(loading.locator('.ui-card')).not.toHaveAttribute('data-loading');
    await expect(loading.locator('.ui-description-list dt')).toHaveText(['Team', 'Local time']);
    await page.mouse.move(5, 5);
    await page.clock.runFor(1000);
    await page.clock.resume();

    const output = matrix(page, 'preview-trigger').locator('[data-lab-output="controlled"]');
    await expect(output).toHaveText('closed');
    await page.getByRole('button', { name: "Show Kofi's card" }).click();
    const controlled = page.getByRole('dialog', { name: 'Kofi Mensah' });
    await expect(controlled).toBeVisible();
    await expect(output).toHaveText('open');
    await expect(
      matrix(page, 'preview-trigger').locator('[data-lab-trigger="controlled"]'),
    ).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(controlled).toHaveCount(0);
    await expect(output).toHaveText('closed');
  });
});
