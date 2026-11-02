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
  /**
   * `chips` (the default) draws one toggle chip per emoji and an add-reaction button; `summary` draws
   * one chip with a stack of the emoji and the total count, which opens the picker.
   */
  presentation?: ReactionBarPresentation | undefined;
}

/** How a reaction bar draws its reactions. */
export type ReactionBarPresentation = 'chips' | 'summary';

/** A reaction with its count read. */
type CountedReaction = ReactionEntry & { count: number };

type PickerProps = Pick<
  EmojiPickerProps,
  'customEmoji' | 'recentEmoji' | 'onRecentEmojiChange' | 'loadEmoji'
>;

interface ReactionChipProps {
  reaction: CountedReaction;
  customEmoji: EmojiPickerProps['customEmoji'];
  maxNames: number;
  onToggle: ReactionBarProps['onToggle'];
}

const hooks = createHooks('reaction-bar', [
  'reaction',
  'emoji',
  'image',
  'count',
  'add',
  'summary',
  'stack',
]);

/** How many emoji the summary chip stacks; its name lists them all. */
const stackSize = 3;

const customShortcode = /^:([^:\s]+):$/;

function findCustomEmoji(emoji: string, customEmoji: EmojiPickerProps['customEmoji']) {
  const shortcode = customShortcode.exec(emoji)?.[1];
  return shortcode ? customEmoji?.find((entry) => entry.shortcode === shortcode) : undefined;
}

/** An emoji's name: a custom emoji's label, or the emoji itself. */
function readEmojiName(emoji: string, customEmoji: EmojiPickerProps['customEmoji']) {
  return findCustomEmoji(emoji, customEmoji)?.label ?? emoji;
}

/** Names one emoji's reactions by the emoji, the count and who reacted. */
function useReactionLabel(customEmoji: EmojiPickerProps['customEmoji'], maxNames: number) {
  const strings = useUiStrings();
  return (reaction: CountedReaction) =>
    strings.reactionLabel(
      readEmojiName(reaction.emoji, customEmoji),
      reaction.count,
      (reaction.people ?? []).slice(0, maxNames),
    );
}

/** An emoji as drawn: the glyph, or a custom emoji's image that falls back to its shortcode. */
function ReactionEmoji({
  emoji,
  customEmoji,
}: {
  emoji: string;
  customEmoji: EmojiPickerProps['customEmoji'];
}) {
  const custom = findCustomEmoji(emoji, customEmoji);
  return (
    <span {...hooks.slot('emoji')}>
      {custom ? (
        <FallbackImage {...hooks.slot('image')} src={custom.src} alt="" fallback={emoji} />
      ) : (
        emoji
      )}
    </span>
  );
}

/** One emoji's chip: a toggle button named by the emoji, the count and who reacted. */
function ReactionChip({ reaction, customEmoji, maxNames, onToggle }: ReactionChipProps) {
  const { locale } = useLocale();
  const label = useReactionLabel(customEmoji, maxNames)(reaction);
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
        <ReactionEmoji emoji={reaction.emoji} customEmoji={customEmoji} />
        <span {...hooks.slot('count')}>{formatCount(reaction.count, locale)}</span>
      </Button>
    </Tooltip>
  );
}

interface ReactionSummaryProps extends PickerProps {
  reactions: readonly CountedReaction[];
  maxNames: number;
  onToggle: ReactionBarProps['onToggle'];
}

/**
 * Every reaction in one chip: a stack of the first emoji and the total count, named by each emoji's
 * reactions and the reader's own. Pressing it opens the picker, where choosing an emoji toggles the
 * reader's reaction with it; without `onToggle` it only names the reactions.
 */
function ReactionSummary({ reactions, maxNames, onToggle, ...picker }: ReactionSummaryProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const labelOf = useReactionLabel(picker.customEmoji, maxNames);
  const total = reactions.reduce((sum, reaction) => sum + reaction.count, 0);
  const own = reactions.filter((reaction) => reaction.isReacted);
  const label = strings.reactionSummary(
    total,
    reactions.map(labelOf),
    own.map((reaction) => readEmojiName(reaction.emoji, picker.customEmoji)),
  );
  const chip = (
    <Tooltip content={label} relationship="label">
      <Button
        variant="chip"
        size="sm"
        content="parts"
        className={hooks.slotClass('summary')}
        isDisabled={!onToggle}
        focusableWhenDisabled
        data-reacted={own.length > 0 || undefined}
      >
        <span {...hooks.slot('stack')}>
          {reactions.slice(0, stackSize).map((reaction) => (
            <ReactionEmoji
              key={reaction.emoji}
              emoji={reaction.emoji}
              customEmoji={picker.customEmoji}
            />
          ))}
        </span>
        <span {...hooks.slot('count')}>{formatCount(total, locale)}</span>
      </Button>
    </Tooltip>
  );
  if (!onToggle) return chip;
  const toggle = (emoji: string) =>
    onToggle(emoji, !reactions.some((reaction) => reaction.emoji === emoji && reaction.isReacted));
  return (
    <EmojiPickerTrigger
      {...picker}
      onSelect={(selection) =>
        toggle(selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`)
      }
    >
      {chip}
    </EmojiPickerTrigger>
  );
}

/**
 * A row of reaction chips, each an emoji with its count that the reader toggles, and an
 * add-reaction button that opens an `EmojiPicker`; or, as a `summary`, one chip for them all. Each
 * chip is named by who reacted.
 */
export function ReactionBar({
  reactions,
  onToggle,
  maxNames = 3,
  presentation = 'chips',
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
  const isSummary = presentation === 'summary';
  // A summary without reactions draws nothing: the reader reacts from the message's own commands.
  if (chips.length === 0 && (isSummary || !onToggle)) return null;
  const add = (emoji: string) => {
    if (!chips.some((chip) => chip.emoji === emoji && chip.isReacted)) onToggle?.(emoji, true);
  };
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { readonly: !onToggle, presentation } })}
      role="group"
      aria-label={rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.reactions)}
    >
      {isSummary ? (
        <ReactionSummary
          reactions={chips}
          maxNames={maxNames}
          onToggle={onToggle}
          customEmoji={customEmoji}
          recentEmoji={recentEmoji}
          onRecentEmojiChange={onRecentEmojiChange}
          loadEmoji={loadEmoji}
        />
      ) : null}
      {isSummary
        ? null
        : chips.map((reaction) => (
            <ReactionChip
              key={reaction.emoji}
              reaction={reaction}
              customEmoji={customEmoji}
              maxNames={maxNames}
              onToggle={onToggle}
            />
          ))}
      {onToggle && !isSummary ? (
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
