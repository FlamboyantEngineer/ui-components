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
