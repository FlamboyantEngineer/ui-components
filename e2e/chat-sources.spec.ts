import { expect, test, matrixCell } from './fixtures.js';

test.describe('Chat Sources lab', () => {
  test('UIC-CHAT-SOURCES-1.1 UIC-CHAT-SOURCES-1.2 lists sources with their details', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-sources');
    const full = matrixCell(page, 'count=several details=full');
    const list = full.getByRole('list', { name: '3 sources' });
    await expect(list.getByRole('listitem')).toHaveCount(3);
    const first = list.getByRole('listitem').first();
    await expect(first.getByRole('link', { name: /Lisbon weather by month/ })).toHaveAttribute(
      'target',
      '_blank',
    );
    await expect(first.locator('.ui-chat-sources__site')).toHaveText('example.com');
    await expect(first.locator('.ui-chat-sources__snippet')).toBeVisible();
    const minimal = matrixCell(page, 'count=one details=minimal');
    await expect(minimal.getByRole('list', { name: '1 source' })).toBeVisible();
    await expect(minimal.getByRole('link')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-CHAT-SOURCES-2.1 UIC-CHAT-SOURCES-2.2 previews a citation by keyboard and closes it with Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-sources');
    const sentence = page.locator('[data-lab-demo="citations"]');
    const citation = sentence.getByRole('link', { name: /^Source 1: Lisbon weather by month/ });
    await expect(citation.locator('.ui-chat-citation__marker')).toHaveText('[1]');
    await expect(citation).toHaveAttribute('href', 'https://www.example.com/lisbon/weather');
    await expect(citation.locator('.ui-link__external-icon')).toBeHidden();
    await citation.focus();
    const card = page.getByRole('dialog', { name: 'Lisbon weather by month' });
    await expect(card).toBeVisible();
    await expect(card).not.toHaveAttribute('data-entering');
    await expect(citation).toBeFocused();
    await expect(card.locator('.ui-chat-citation__site')).toHaveText('example.com');
    await expect(card.locator('.ui-chat-citation__snippet')).toContainText('Winters are mild');
    await lab.expectAccessible('.ui-chat-citation__card');
    await page.keyboard.press('Tab');
    await expect(card.getByRole('link', { name: /Lisbon weather by month/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(citation).toBeFocused();
  });

  test('UIC-CHAT-SOURCES-2.2 previews a citation when the pointer rests on it', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-sources');
    const citation = page
      .locator('[data-lab-demo="citations"]')
      .getByRole('link', { name: /^Source 2: Coastal rail timetable/ });
    await citation.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 300);
    await citation.hover();
    await expect(page.getByRole('dialog', { name: 'Coastal rail timetable' })).toBeVisible();
    await expect(citation).toHaveCSS('vertical-align', 'super');
  });

  test('UIC-CHAT-SOURCES-2.3 opens the card of a source without a URL on press', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-sources');
    const marker = page
      .locator('[data-lab-demo="citations"]')
      .getByRole('button', { name: 'Source 3: Trip notes' });
    await marker.focus();
    await page.keyboard.press('Enter');
    const card = page.getByRole('dialog', { name: 'Trip notes' });
    await expect(card).toBeVisible();
    await expect(card.locator('.ui-chat-citation__title')).toHaveText('Trip notes');
  });

  test('UIC-CHAT-SOURCES-3.1 turns an answer’s markers into citations of its sources', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-sources');
    const answer = page.locator('[data-lab-demo="answer"]');
    await expect(answer.locator('.ui-markdown .ui-chat-citation')).toHaveCount(5);
    await expect(answer.locator('.ui-markdown')).toContainText('such as [7], stays text');
    await expect(answer.getByText('list[1]')).toHaveJSProperty('tagName', 'CODE');
    const link = answer.getByRole('link', { name: /^the timetable \[2\]/ });
    await expect(link).toHaveAttribute('href', 'https://example.com/timetable');
    await expect(link.locator('a, button')).toHaveCount(0);
    await expect(answer.locator('label a, label button')).toHaveCount(0);
    await expect(answer.getByRole('checkbox', { name: 'Booked the train [2]' })).toBeChecked();
    await expect(answer.getByRole('list', { name: '3 sources' })).toBeVisible();
    await lab.expectAccessible('[data-lab-demo="answer"]');
  });
});
