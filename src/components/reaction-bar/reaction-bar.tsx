'use client';

import { EmojiGlyph } from '../../core/glyphs.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { useLocale } from '../../primitives/index.js';
import { Button } from '../button/button.js';
import { EmojiPickerTrigger, type EmojiPickerProps } from '../emoji-picker/emoji-picker.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { FallbackImage } from '../../utils/fallback-image.js';

/** The reactions with one emoji. */
export interface ReactionEntry {
  /** The emoji: a standard glyph, in a skin tone or not, or `:shortcode:` for a custom emoji. */
  emoji: string;
  /** How many people reacted. Defaults to the number of `people`. */
  count?: number | undefined;
  /** The reader is one of them. */
  isReacted?: boolean | undefined;
  /** Names of people who reacted, in the order to list them; may be fewer than `count`. */
  people?: readonly string[] | undefined;
}

export interface ReactionBarProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<EmojiPickerProps, 'customEmoji' | 'recentEmoji' | 'onRecentEmojiChange' | 'loadEmoji'>,
    RefProps<HTMLDivElement> {
  /** The reactions, one chip each in order. Entries counting nobody draw no chip. */
  reactions: readonly ReactionEntry[];
  /**
   * Called with an emoji and whether the reader now reacts with it, from a chip press or a choice
   * in the add-reaction picker. Without it the bar is read-only.
   */
  onToggle?: ((emoji: string, isReacted: boolean) => void) | undefined;
  /** How many names a chip's name lists before it counts the others. Defaults to 3. */
  maxNames?: number | undefined;
}

interface ReactionChipProps {
  reaction: ReactionEntry & { count: number };
  customEmoji: EmojiPickerProps['customEmoji'];
  maxNames: number;
  onToggle: ReactionBarProps['onToggle'];
}

const hooks = createHooks('reaction-bar', ['reaction', 'emoji', 'image', 'count', 'add']);

const customShortcode = /^:([^:\s]+):$/;

function findCustomEmoji(emoji: string, customEmoji: EmojiPickerProps['customEmoji']) {
  const shortcode = customShortcode.exec(emoji)?.[1];
  return shortcode ? customEmoji?.find((entry) => entry.shortcode === shortcode) : undefined;
}

/** One emoji's chip: a toggle button named by the emoji, the count and who reacted. */
function ReactionChip({ reaction, customEmoji, maxNames, onToggle }: ReactionChipProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const custom = findCustomEmoji(reaction.emoji, customEmoji);
  const names = (reaction.people ?? []).slice(0, maxNames);
  const label = strings.reactionLabel(custom?.label ?? reaction.emoji, reaction.count, names);
  return (
    <Tooltip content={label} relationship="label">
      <Button
        variant="chip"
        size="sm"
        content="parts"
        className={hooks.slotClass('reaction')}
        isSelected={reaction.isReacted ?? false}
        onChange={(isReacted) => onToggle?.(reaction.emoji, isReacted)}
        isDisabled={!onToggle}
        focusableWhenDisabled
      >
        <span {...hooks.slot('emoji')}>
          {custom ? (
            // A custom emoji whose image fails shows its shortcode instead.
            <FallbackImage
              {...hooks.slot('image')}
              src={custom.src}
              alt=""
              fallback={reaction.emoji}
            />
          ) : (
            reaction.emoji
          )}
        </span>
        <span {...hooks.slot('count')}>{formatCount(reaction.count, locale)}</span>
      </Button>
    </Tooltip>
  );
}

/**
 * A row of reaction chips, each an emoji with its count that the reader toggles, and an
 * add-reaction button that opens an `EmojiPicker`. Each chip is named by who reacted.
 */
export function ReactionBar({
  reactions,
  onToggle,
  maxNames = 3,
  customEmoji,
  recentEmoji,
  onRecentEmojiChange,
  loadEmoji,
  className,
  ...rest
}: ReactionBarProps) {
  const strings = useUiStrings();
  const chips = reactions.flatMap((reaction) => {
    const count = normalizeCount(reaction.count ?? reaction.people?.length) ?? 0;
    return count > 0 ? [{ ...reaction, count }] : [];
  });
  if (chips.length === 0 && !onToggle) return null;
  const add = (emoji: string) => {
    if (!chips.some((chip) => chip.emoji === emoji && chip.isReacted)) onToggle?.(emoji, true);
  };
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { readonly: !onToggle } })}
      role="group"
      aria-label={rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.reactions)}
    >
      {chips.map((reaction) => (
        <ReactionChip
          key={reaction.emoji}
          reaction={reaction}
          customEmoji={customEmoji}
          maxNames={maxNames}
          onToggle={onToggle}
        />
      ))}
      {onToggle ? (
        <EmojiPickerTrigger
          customEmoji={customEmoji}
          recentEmoji={recentEmoji}
          onRecentEmojiChange={onRecentEmojiChange}
          loadEmoji={loadEmoji}
          onSelect={(selection) =>
            add(selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`)
          }
        >
          <Button
            icon={EmojiGlyph}
            label={strings.addReaction}
            size="sm"
            className={hooks.slotClass('add')}
          />
        </EmojiPickerTrigger>
      ) : null}
    </div>
  );
}
