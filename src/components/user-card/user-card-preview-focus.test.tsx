import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import { UserCard } from './user-card.js';
import { UserCardTrigger } from '../user-card-trigger/user-card-trigger.js';

describe('UserCard preview composition', () => {
  it.each([false, true])(
    'UIC-HOVER-CARD-3.1 UIC-USER-CARD-TRIGGER-1.3 Tab enters the preview action inside a tag with specialized trigger %s',
    async (specialized) => {
      const user = userEvent.setup();
      const card = (
        <UserCard name="Morgan Hale" actions={[{ id: 'profile', label: 'View profile' }]} />
      );
      render(
        <TagGroup aria-label="People">
          <Tag id="morgan" textValue="Morgan Hale">
            {specialized ? (
              <UserCardTrigger trigger="hover" delay={0} card={card}>
                Morgan Hale
              </UserCardTrigger>
            ) : (
              <HoverCardTrigger delay={0}>
                <Button>Morgan Hale</Button>
                <HoverCard>{card}</HoverCard>
              </HoverCardTrigger>
            )}
          </Tag>
        </TagGroup>,
      );
      await user.click(screen.getByRole('button', { name: 'Morgan Hale' }));
      await screen.findByRole('dialog', { name: 'Morgan Hale' });
      await user.tab();
      expect(screen.getByRole('button', { name: 'View profile' })).toHaveFocus();
    },
  );

  it('UIC-HOVER-CARD-3.1 Tab leaves a tag preview with no action through ordinary navigation', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TagGroup aria-label="People">
          <Tag id="morgan" textValue="Morgan Hale">
            <HoverCardTrigger delay={0}>
              <Button>Morgan Hale</Button>
              <HoverCard>
                <UserCard name="Morgan Hale" />
              </HoverCard>
            </HoverCardTrigger>
          </Tag>
        </TagGroup>
        <Button>After profiles</Button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Morgan Hale' }));
    await screen.findByRole('dialog', { name: 'Morgan Hale' });
    await user.tab();
    expect(screen.getByRole('button', { name: 'After profiles' })).toHaveFocus();
  });

  it('UIC-HOVER-CARD-2.1 a card in a generic preview leaves keyboard focus on its trigger', async () => {
    const user = userEvent.setup();
    render(
      <HoverCardTrigger delay={0}>
        <Button>Morgan Hale</Button>
        <HoverCard>
          <UserCard name="Morgan Hale" actions={[{ id: 'profile', label: 'View profile' }]} />
        </HoverCard>
      </HoverCardTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Morgan Hale' });
    await user.tab();
    await screen.findByRole('dialog', { name: 'Morgan Hale' });
    expect(trigger).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'View profile' })).toHaveFocus();
  });

  it('UIC-USER-CARD-TRIGGER-1.2 an explicitly pressed card inside a preview keeps dialog focus behavior', async () => {
    const user = userEvent.setup();
    render(
      <HoverCardTrigger delay={0}>
        <Button>Preview directory</Button>
        <HoverCard aria-label="Directory preview">
          <UserCardTrigger
            card={
              <UserCard name="Taylor Quinn" actions={[{ id: 'profile', label: 'View profile' }]} />
            }
          >
            Open Taylor
          </UserCardTrigger>
        </HoverCard>
      </HoverCardTrigger>,
    );
    await user.pointer([
      { target: document.body, coords: { clientX: 1, clientY: 1 } },
      { target: screen.getByRole('button', { name: 'Preview directory' }) },
    ]);
    await screen.findByRole('dialog', { name: 'Directory preview' });
    await user.click(screen.getByRole('button', { name: 'Open Taylor' }));
    const card = await screen.findByRole('dialog', { name: 'Taylor Quinn' });
    await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));
  });
});
