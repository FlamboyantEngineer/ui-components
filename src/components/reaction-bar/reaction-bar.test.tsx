import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ReactionBar, type ReactionBarProps } from './reaction-bar.js';

type EmojiList = Awaited<ReturnType<NonNullable<ReactionBarProps['loadEmoji']>>>;

const emojiList: EmojiList = [
  {
    unicode: '😀',
    hexcode: '1F600',
    label: 'grinning face',
    category: 'smileys',
    shortcodes: ['grinning'],
    keywords: [],
  },
  {
    unicode: '👍',
    hexcode: '1F44D',
    label: 'thumbs up',
    category: 'people',
    shortcodes: ['thumbsup'],
    keywords: [],
  },
];
const loadEmoji = () => Promise.resolve(emojiList);
const otter = { shortcode: 'otter', src: '/otter.png', label: 'Happy otter' };

const reactions = [
  { emoji: '👍', people: ['Ana Lima', 'Ben Ode'], isReacted: true },
  { emoji: '🎉', count: 5, people: ['Chen Wu'] },
  { emoji: ':otter:', count: 1 },
  { emoji: '🍌', count: 0 },
];

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when overlays change.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('ReactionBar', () => {
  it('UIC-REACTION-BAR-1.1 draws a chip per emoji with a count, skipping those counting nobody', () => {
    const { container } = render(
      <ReactionBar reactions={reactions} customEmoji={[otter]} onToggle={() => {}} />,
    );
    const group = screen.getByRole('group', { name: 'Reactions' });
    expect(group).toHaveClass('ui-reaction-bar');
    const chips = container.querySelectorAll('.ui-reaction-bar__reaction');
    expect(chips).toHaveLength(3);
    expect([...chips].map((chip) => chip.textContent)).toEqual(['👍2', '🎉5', '1']);
    expect(chips[0]).toHaveClass('ui-button');
    expect(chips[0]?.querySelector('.ui-reaction-bar__emoji')).toHaveTextContent('👍');
    expect(chips[0]?.querySelector('.ui-reaction-bar__count')).toHaveTextContent('2');
    const image = chips[2]?.querySelector('img.ui-reaction-bar__image');
    expect(image).toHaveAttribute('src', '/otter.png');
    expect(image).toHaveAttribute('alt', '');
    expectHooksMatchSpec(container, 'REACTION-BAR', { slots: 'all' });
  });

  it('UIC-REACTION-BAR-1.2 names each chip by its emoji, count and the first people who reacted', () => {
    render(
      <ReactionBar
        reactions={[
          ...reactions,
          { emoji: '🚀', people: ['A', 'B', 'C', 'D', 'E'] },
          { emoji: ':unknown:', count: 2 },
        ]}
        customEmoji={[otter]}
        maxNames={2}
        onToggle={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: '👍 2, reacted by Ana Lima and Ben Ode' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '🎉 5, reacted by Chen Wu and 4 others' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Happy otter 1' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '🚀 5, reacted by A, B and 3 others' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ':unknown: 2' })).toHaveTextContent(':unknown:2');
  });

  it('UIC-REACTION-BAR-1.3 toggles the reader reaction on a chip press', async () => {
    const onToggle = vi.fn();
    render(<ReactionBar reactions={reactions} onToggle={onToggle} />);
    const thumbs = screen.getByRole('button', { name: /^👍/ });
    expect(thumbs).toHaveAttribute('aria-pressed', 'true');
    expect(thumbs).toHaveAttribute('data-selected', 'true');
    await userEvent.click(thumbs);
    expect(onToggle).toHaveBeenLastCalledWith('👍', false);
    const party = screen.getByRole('button', { name: /^🎉/ });
    expect(party).toHaveAttribute('aria-pressed', 'false');
    party.focus();
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenLastCalledWith('🎉', true);
  });

  // Three picker round trips; slow on a busy machine.
  it(
    'UIC-REACTION-BAR-1.4 adds a reaction from the emoji picker',
    { timeout: 15_000 },
    async () => {
      const onToggle = vi.fn();
      const onRecentEmojiChange = vi.fn();
      render(
        <ReactionBar
          reactions={reactions}
          onToggle={onToggle}
          loadEmoji={loadEmoji}
          customEmoji={[otter]}
          recentEmoji={['😀']}
          onRecentEmojiChange={onRecentEmojiChange}
        />,
      );
      const add = screen.getByRole('button', { name: 'Add reaction' });
      expect(add).toHaveClass('ui-icon-button', 'ui-reaction-bar__add');
      await userEvent.click(add);
      const picker = await screen.findByRole('dialog', { name: 'Emoji picker' });
      const grids = await within(picker).findAllByRole('grid');
      expect(grids[0]).toHaveAccessibleName('Recently used');
      await userEvent.click(
        within(grids[0] as HTMLElement).getByRole('row', { name: 'grinning face' }),
      );
      expect(onToggle).toHaveBeenLastCalledWith('😀', true);
      expect(onRecentEmojiChange).toHaveBeenCalledWith(['😀']);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // An emoji the reader already reacted with stays as it is; a custom emoji reacts by shortcode.
      await userEvent.click(add);
      await userEvent.type(await screen.findByRole('searchbox'), 'thumbs{Enter}');
      expect(onToggle).toHaveBeenCalledTimes(1);
      await userEvent.click(add);
      await userEvent.type(await screen.findByRole('searchbox'), 'otter{Enter}');
      expect(onToggle).toHaveBeenLastCalledWith(':otter:', true);
    },
  );

  it('UIC-REACTION-BAR-1.5 is read-only without onToggle', async () => {
    const { container, rerender } = render(<ReactionBar reactions={reactions} />);
    const root = container.querySelector('.ui-reaction-bar');
    expect(root).toHaveAttribute('data-readonly', 'true');
    expect(screen.queryByRole('button', { name: 'Add reaction' })).not.toBeInTheDocument();
    const thumbs = screen.getByRole('button', { name: /^👍/ });
    expect(thumbs).toHaveAttribute('aria-disabled', 'true');
    expect(thumbs).toBeEnabled();
    await userEvent.click(thumbs);
    expect(thumbs).toHaveAttribute('aria-pressed', 'true');
    rerender(<ReactionBar reactions={[{ emoji: '🍌', count: 0 }]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ReactionBar reactions={[]} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add reaction' })).toBeInTheDocument();
  });

  it('UIC-REACTION-BAR-1.6 takes its names from the caller and the provider', () => {
    const { container, rerender } = render(
      <UiProvider
        strings={{
          reactions: 'Réactions',
          reactionLabel: (emoji, count, names) => `${emoji}:${count}:${names.join('+')}`,
        }}
      >
        <ReactionBar reactions={reactions.slice(0, 1)} />
      </UiProvider>,
    );
    expect(screen.getByRole('group', { name: 'Réactions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '👍:2:Ana Lima+Ben Ode' })).toBeInTheDocument();
    rerender(
      <ReactionBar
        reactions={reactions.slice(0, 1)}
        aria-label="Reactions to the report"
        className="extra"
        id="bar"
        data-test="bar"
      />,
    );
    const root = screen.getByRole('group', { name: 'Reactions to the report' });
    expect(root).toHaveClass('ui-reaction-bar', 'extra');
    expect(root).toHaveAttribute('id', 'bar');
    expect(root).toHaveAttribute('data-test', 'bar');
    expectHooksMatchSpec(container, 'REACTION-BAR', { callerAttributes: ['data-test'] });
  });
});
