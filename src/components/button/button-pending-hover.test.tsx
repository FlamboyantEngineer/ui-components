import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Button } from './button.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Tooltip } from '../tooltip/tooltip.js';

for (const kind of ['preview', 'tooltip'] as const) {
  for (const pending of [false, true]) {
    it(`UIC-HOVER-CARD-1.1 UIC-TOOLTIP-1.1 UIC-BUTTON-1.6 ${pending ? 'pending ' : ''}${kind} opens on the first pointer entry after keyboard use`, async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const onPress = vi.fn();
      render(
        <>
          <Button>Before</Button>
          {kind === 'preview' ? (
            <HoverCardTrigger delay={0} onOpenChange={onOpenChange}>
              <Button isPending={pending} onPress={onPress}>
                Preview
              </Button>
              <HoverCard aria-label="Details">Details</HoverCard>
            </HoverCardTrigger>
          ) : (
            <Tooltip delay={0} content="Hint" onOpenChange={onOpenChange}>
              <Button isPending={pending} onPress={onPress}>
                Preview
              </Button>
            </Tooltip>
          )}
        </>,
      );
      await user.tab();
      const before = screen.getByRole('button', { name: 'Before' });
      expect(before).toHaveFocus();
      const trigger = screen.getByRole('button', { name: /^Preview/ });
      await user.hover(trigger);
      expect(
        await screen.findByRole(kind === 'preview' ? 'dialog' : 'tooltip'),
      ).toBeInTheDocument();
      expect(before).toHaveFocus();
      expect(trigger).not.toHaveFocus();
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      await user.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          screen.queryByRole(kind === 'preview' ? 'dialog' : 'tooltip'),
        ).not.toBeInTheDocument(),
      );
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      if (pending) {
        expect(trigger).toHaveAttribute('aria-disabled', 'true');
        await user.click(trigger);
        expect(onPress).not.toHaveBeenCalled();
      }
    });
  }
}
