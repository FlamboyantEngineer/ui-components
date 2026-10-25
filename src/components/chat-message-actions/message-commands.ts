import { useState, type RefObject } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useClipboard, type CopyStatus } from '../../utils/use-clipboard.js';
import type { EmojiPickerProps } from '../emoji-picker/emoji-picker.js';

/** A reply rated good (`up`) or bad (`down`). */
export type ChatFeedbackRating = 'up' | 'down';

/** What the reader said about a reply. */
export interface ChatFeedback {
  /** The rating, or `null` when the reader cleared it. */
  rating: ChatFeedbackRating | null;
  /** The reasons the reader picked from `feedbackReasons`, in their order. */
  reasons: string[];
  /** The reader's comment, trimmed; absent when they wrote none. */
  comment?: string | undefined;
}

/**
 * The commands a message offers. Each shows only when its value or callback is given. The emoji
 * picker of React takes the same custom emoji, recent emoji and loader as a `ReactionBar`.
 */
export interface ChatMessageCommandProps extends Pick<
  EmojiPickerProps,
  'customEmoji' | 'recentEmoji' | 'onRecentEmojiChange' | 'loadEmoji'
> {
  /** The text Copy puts on the clipboard. Without it there is no Copy. */
  copyText?: string | undefined;
  /** Called once Copy has put `copyText` on the clipboard. */
  onCopy?: (() => void) | undefined;
  /** The current rating, controlled (`null` for none). Left out, the actions keep it. */
  feedback?: ChatFeedbackRating | null | undefined;
  /** Called with each rating, its reasons and comment, or a cleared rating. Shows the ratings. */
  onFeedback?: ((feedback: ChatFeedback) => void) | undefined;
  /**
   * Reasons the reader may pick after rating. When given (even empty), choosing a rating opens
   * details with these reasons and a comment; without it, the rating is reported at once.
   */
  feedbackReasons?: readonly string[] | undefined;
  /** Quotes the message in a reply. Shows Reply. */
  onReply?: (() => void) | undefined;
  /** Called with the emoji the reader reacts with: a glyph or `:shortcode:`. Shows React. */
  onReact?: ((emoji: string) => void) | undefined;
  /** Starts editing the message. Shows Edit. */
  onEdit?: (() => void) | undefined;
  /** Runs once the reader confirms; a returned promise keeps the confirmation pending. Shows Delete. */
  onDelete?: (() => void | Promise<unknown>) | undefined;
}

/** An overlay a command opens: the feedback details, the emoji picker or the delete confirmation. */
export type MessageOverlay = 'feedback' | 'react' | 'delete';

/** The open overlay and the element it is placed against. */
export interface OpenMessageOverlay {
  overlay: MessageOverlay;
  anchor: RefObject<Element | null>;
  /** The rating the feedback details are about. */
  rating?: ChatFeedbackRating | undefined;
}

/** The reasons and comment the reader gave in the feedback details. */
export interface FeedbackDetails {
  reasons: string[];
  comment: string;
}

/** The state the action bar, its context menu and their overlays share. */
export interface MessageCommands {
  commands: ChatMessageCommandProps;
  /** The rating shown: the one being detailed, else the current one. */
  rating: ChatFeedbackRating | null;
  open: OpenMessageOverlay | null;
  copyStatus: CopyStatus;
  /** Counts finished copies, so a repeated outcome is announced again. */
  copies: number;
  copy: () => void;
  /** Chooses a rating from a control, or clears it when it is the rating shown. */
  rate: (rating: ChatFeedbackRating, anchor: RefObject<Element | null>) => void;
  /** Reports the detailed rating with the reader's details, or none when they skipped. */
  finishFeedback: (details?: FeedbackDetails) => void;
  openOverlay: (overlay: 'react' | 'delete', anchor: RefObject<Element | null>) => void;
  closeOverlay: () => void;
}

/** Whether any command shows. */
export function hasCommands(commands: ChatMessageCommandProps): boolean {
  return (
    commands.copyText !== undefined ||
    Boolean(
      commands.onFeedback ||
      commands.onReply ||
      commands.onReact ||
      commands.onEdit ||
      commands.onDelete,
    )
  );
}

/** Splits the command props from the rest of a component's props. */
export function splitCommands<T extends ChatMessageCommandProps>(props: T) {
  const {
    copyText,
    onCopy,
    feedback,
    onFeedback,
    feedbackReasons,
    onReply,
    onReact,
    onEdit,
    onDelete,
    customEmoji,
    recentEmoji,
    onRecentEmojiChange,
    loadEmoji,
    ...rest
  } = props;
  const commands: ChatMessageCommandProps = {
    copyText,
    onCopy,
    feedback,
    onFeedback,
    feedbackReasons,
    onReply,
    onReact,
    onEdit,
    onDelete,
    customEmoji,
    recentEmoji,
    onRecentEmojiChange,
    loadEmoji,
  };
  return [commands, rest] as const;
}

/** Copies `copyText`, counts finished copies and reports a copy that reached the clipboard. */
function useCopyCommand({ copyText, onCopy }: ChatMessageCommandProps) {
  const clipboard = useClipboard();
  const [copies, setCopies] = useState(0);
  const copy = () => {
    void clipboard.copy(copyText ?? '').then((isCopied) => {
      setCopies((count) => count + 1);
      if (isCopied) onCopy?.();
    });
  };
  return { copy, copies, copyStatus: clipboard.status };
}

/**
 * Holds what a message's commands share: the rating (controlled by `feedback` when given), the
 * open overlay and its anchor, and the copy outcome.
 */
export function useMessageCommands(commands: ChatMessageCommandProps): MessageCommands {
  const [current, setCurrent] = useControllableState(commands.feedback, null);
  const [open, setOpen] = useState<OpenMessageOverlay | null>(null);
  const rating = open?.overlay === 'feedback' ? (open.rating ?? null) : current;
  const report = (feedback: ChatFeedback) => {
    setCurrent(feedback.rating);
    commands.onFeedback?.(feedback);
  };
  return {
    commands,
    rating,
    open,
    ...useCopyCommand(commands),
    rate(next, anchor) {
      if (rating === next) {
        setOpen(null);
        report({ rating: null, reasons: [] });
      } else if (commands.feedbackReasons === undefined) {
        report({ rating: next, reasons: [] });
      } else {
        setOpen({ overlay: 'feedback', anchor, rating: next });
      }
    },
    finishFeedback(details) {
      if (open?.overlay !== 'feedback' || !open.rating) return;
      const comment = details?.comment.trim();
      setOpen(null);
      report({
        rating: open.rating,
        reasons: details?.reasons ?? [],
        ...(comment ? { comment } : {}),
      });
    },
    openOverlay: (overlay, anchor) => setOpen({ overlay, anchor }),
    closeOverlay: () => setOpen(null),
  };
}
