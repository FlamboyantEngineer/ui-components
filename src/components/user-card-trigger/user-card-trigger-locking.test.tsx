import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { UserCard } from '../user-card/user-card.js';
import { UserCardTrigger } from './user-card-trigger.js';

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('UserCardTrigger locking', () => {
  it.each(['press', 'hover'] as const)(
    'UIC-USER-CARD-TRIGGER-1.4 closes an open %s card for good when the trigger turns disabled',
    async (trigger) => {
      // Check pressing separately from hovering during the preview's warm handoff window.
      const user = userEvent.setup({ skipHover: true });
      const onOpenChange = vi.fn();
      const card = (isDisabled: boolean) => (
        <UserCardTrigger
          trigger={trigger}
          card={<UserCard name="Maria Santos" />}
          defaultOpen
          onOpenChange={onOpenChange}
          isDisabled={isDisabled}
        >
          Maria Santos
        </UserCardTrigger>
      );
      const { rerender } = render(card(false));
      expect(
        await screen.findByText('Maria Santos', { selector: '.ui-user-card *' }),
      ).toBeVisible();
      rerender(card(true));
      await waitFor(() => expect(document.querySelector('.ui-user-card')).not.toBeInTheDocument());
      expect(onOpenChange.mock.calls).toEqual([[false]]);
      rerender(card(false));
      expect(document.querySelector('.ui-user-card')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Maria Santos' }));
      expect(onOpenChange).toHaveBeenCalledTimes(trigger === 'press' ? 2 : 1);
    },
  );
});
