import { expect, test } from './fixtures.js';

test('UIC-MESSAGE-1.1 exposes named articles, busy state and footer actions', async ({
  page,
  lab,
}) => {
  await lab.open('message');
  const complete = page.getByRole('article', { name: 'start complete message' });
  const streaming = page.getByRole('article', { name: 'end streaming message' });
  await expect(complete.getByRole('button', { name: 'Copy reply' })).toBeVisible();
  await expect(streaming).toHaveAttribute('aria-busy', 'true');
  await expect(streaming).toHaveAttribute('data-align', 'end');
  await lab.expectAccessible();
});

test('UIC-MESSAGE-1.2 sets the avatar beside the content on the message side', async ({
  page,
  lab,
}) => {
  await lab.open('message');
  for (const align of ['start', 'end']) {
    const message = page.getByRole('article', { name: `${align} first message with avatar` });
    const avatar = await message.locator('.ui-message__avatar').boundingBox();
    const content = await message.locator('.ui-message__content').boundingBox();
    if (!avatar || !content) throw new Error('Expected a laid-out message');
    if (align === 'start') expect(avatar.x + avatar.width).toBeLessThanOrEqual(content.x);
    else expect(avatar.x).toBeGreaterThanOrEqual(content.x + content.width);
    await expect(message.locator('.ui-message__header')).toContainText('Rosa Vidal');
    const bare = page.getByRole('article', { name: `${align} first message without avatar` });
    const bareContent = await bare.locator('.ui-message__content').boundingBox();
    const bareFrame = await bare.boundingBox();
    expect(bareContent?.width).toBeCloseTo(bareFrame?.width ?? 0, 0);
  }
  await lab.expectAccessible();
});
