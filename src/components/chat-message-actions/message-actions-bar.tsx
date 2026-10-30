'use client';

import {
  CheckGlyph,
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  EmojiGlyph,
  ErrorGlyph,
  ReplyGlyph,
  ThumbsDownGlyph,
  ThumbsUpGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { useRef, type ReactNode, type SyntheticEvent } from 'react';
import { Toolbar } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { ChatFeedbackRating, MessageCommands } from './message-commands.js';

interface MessageActionsBarProps extends BaseProps, AriaLabellingProps {
  state: MessageCommands;
  /** The overlays, when the bar owns them. */
  children?: ReactNode;
}

interface OverlayButtonProps {
  state: MessageCommands;
  overlay: 'react' | 'delete';
  icon: GlyphComponent;
  label: string;
}

export const actionHooks = createHooks('chat-message-actions', [
  'copy',
  'status',
  'rating',
  'reply',
  'react',
  'edit',
  'delete',
  'feedback',
  'reasons',
  'reason',
  'comment',
  'feedback-actions',
  'emoji-popover',
]);

const copyGlyphs = { idle: CopyGlyph, copied: CheckGlyph, failed: ErrorGlyph } as const;

/**
 * React passes events from portalled overlays up the component tree, so keys, secondary clicks and
 * touches in the bar's overlays would reach the message around it; they stop at the overlays.
 */
function stopPortalledEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

/** Copy, which shows the outcome in its glyph and announces it. */
function CopyCommand({ state }: { state: MessageCommands }) {
  const strings = useUiStrings();
  const announcements = { idle: '', copied: strings.copied, failed: strings.copyFailed };
  return (
    <>
      <Button
        icon={copyGlyphs[state.copyStatus]}
        label={strings.copy}
        size="sm"
        className={actionHooks.slotClass('copy')}
        onPress={state.copy}
      />
      <VisuallyHidden elementType="span" role="status" className={actionHooks.slotClass('status')}>
        {announcements[state.copyStatus]}
        {state.copyStatus !== 'idle' && state.copies % 2 === 0 ? '​' : null}
      </VisuallyHidden>
    </>
  );
}

/** A rating toggle; with feedback reasons it opens the details. */
function RatingButton({ state, rating }: { state: MessageCommands; rating: ChatFeedbackRating }) {
  const strings = useUiStrings();
  const ref = useRef<HTMLButtonElement>(null);
  const asksDetails = state.commands.feedbackReasons !== undefined;
  const isOpen = state.open?.overlay === 'feedback' && state.open.anchor === ref;
  return (
    <Button
      ref={ref}
      icon={rating === 'up' ? ThumbsUpGlyph : ThumbsDownGlyph}
      label={rating === 'up' ? strings.goodResponse : strings.badResponse}
      size="sm"
      className={actionHooks.slotClass('rating')}
      data-rating={rating}
      isSelected={state.rating === rating}
      onChange={() => state.rate(rating, ref)}
      aria-haspopup={asksDetails ? 'dialog' : undefined}
      aria-expanded={asksDetails ? isOpen : undefined}
    />
  );
}

/** A command that opens an overlay placed against it. */
function OverlayButton({ state, overlay, icon, label }: OverlayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Button
      ref={ref}
      icon={icon}
      label={label}
      size="sm"
      className={actionHooks.slotClass(overlay)}
      aria-haspopup="dialog"
      aria-expanded={state.open?.overlay === overlay && state.open.anchor === ref}
      onPress={() => state.openOverlay(overlay, ref)}
    />
  );
}

/** The toolbar of a message's commands, in a fixed order; arrow keys move between them. */
export function MessageActionsBar({ state, children, className, ...rest }: MessageActionsBarProps) {
  const strings = useUiStrings();
  const { commands } = state;
  const label = rest['aria-labelledby']
    ? undefined
    : (rest['aria-label'] ?? strings.messageActions);
  return (
    <Toolbar
      {...rest}
      {...actionHooks.root({
        className,
        props: rest,
        data: { open: state.open !== null, copied: state.copyStatus === 'copied' },
      })}
      aria-label={label}
    >
      {commands.copyText === undefined ? null : <CopyCommand state={state} />}
      {commands.onFeedback ? (
        <>
          <RatingButton state={state} rating="up" />
          <RatingButton state={state} rating="down" />
        </>
      ) : null}
      {commands.onReply ? (
        <Button
          icon={ReplyGlyph}
          label={strings.reply}
          size="sm"
          className={actionHooks.slotClass('reply')}
          onPress={commands.onReply}
        />
      ) : null}
      {commands.onReact ? (
        <OverlayButton
          state={state}
          overlay="react"
          icon={EmojiGlyph}
          label={strings.addReaction}
        />
      ) : null}
      {commands.onEdit ? (
        <Button
          icon={EditGlyph}
          label={strings.edit}
          size="sm"
          className={actionHooks.slotClass('edit')}
          onPress={commands.onEdit}
        />
      ) : null}
      {commands.onDelete ? (
        <OverlayButton state={state} overlay="delete" icon={DeleteGlyph} label={strings.delete} />
      ) : null}
      {children ? (
        <span
          hidden
          onKeyDown={stopPortalledEvent}
          onContextMenu={stopPortalledEvent}
          onPointerDown={stopPortalledEvent}
        >
          {children}
        </span>
      ) : null}
    </Toolbar>
  );
}
