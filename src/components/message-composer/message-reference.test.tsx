import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MessageReference } from './message-reference.js';

it('UIC-MESSAGE-COMPOSER-10.1 shows host reference content and calls removal', async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  const { container } = render(
    <MessageReference
      label="NOTE-4"
      name="Packing list"
      href="/notes/4"
      description="Shared"
      onRemove={onRemove}
    />,
  );
  expect(screen.getByRole('link', { name: 'NOTE-4 Packing list' })).toHaveAttribute(
    'href',
    '/notes/4',
  );
  expect(screen.getByText('Shared')).toBeInTheDocument();
  expect(container.querySelector('.ui-message-reference')?.textContent).toBe(
    'NOTE-4 Packing list Shared',
  );
  expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
    slots: ['content', 'description', 'remove'],
  });
  await user.click(screen.getByRole('button', { name: 'Remove NOTE-4' }));
  expect(onRemove).toHaveBeenCalledOnce();
});

it('UIC-MESSAGE-COMPOSER-10.1 shows a neutral label without navigation or removal', () => {
  render(<MessageReference label="Unavailable item" />);
  expect(screen.getByText('Unavailable item')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
