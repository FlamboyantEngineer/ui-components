import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { EmojiPicker } from '../emoji-picker/emoji-picker.js';
import { Modal } from '../modal/modal.js';
import { Popover, PopoverPanel } from '../popover/popover.js';
import { FeedbackForm } from './feedback-form.js';
import { actionHooks } from './message-actions-bar.js';
import type { MessageCommands, OpenMessageOverlay } from './message-commands.js';

/**
 * The overlay last opened, kept while it closes so its anchor and title stay put during the exit
 * transition.
 */
function useLastOverlay(open: OpenMessageOverlay | null) {
  const [last, setLast] = useState(open);
  if (open && open !== last) setLast(open);
  return open ?? last;
}

/**
 * The overlays a message's commands open, placed against the control or message that opened them:
 * the feedback details, the emoji picker and the delete confirmation.
 */
export function MessageCommandOverlays({ state }: { state: MessageCommands }) {
  const strings = useUiStrings();
  const { commands, open } = state;
  const last = useLastOverlay(open);
  const close = (isOpen: boolean) => (isOpen ? undefined : state.closeOverlay());
  const anchor = last?.anchor;
  return (
    <>
      {commands.onFeedback && commands.feedbackReasons !== undefined && anchor ? (
        <Popover
          isOpen={open?.overlay === 'feedback'}
          onOpenChange={(isOpen) => (isOpen ? undefined : state.finishFeedback())}
          triggerRef={anchor}
          placement="bottom start"
          title={last?.rating ? strings.feedbackDetails(last.rating) : undefined}
          className={actionHooks.slotClass('feedback')}
        >
          <FeedbackForm
            reasons={commands.feedbackReasons}
            onSubmit={state.finishFeedback}
            onSkip={() => state.finishFeedback()}
          />
        </Popover>
      ) : null}
      {commands.onReact && anchor ? (
        <PopoverPanel
          isOpen={open?.overlay === 'react'}
          onOpenChange={close}
          triggerRef={anchor}
          placement="bottom start"
          className={actionHooks.slotClass('emoji-popover')}
        >
          <EmojiPicker
            autoFocus
            customEmoji={commands.customEmoji}
            recentEmoji={commands.recentEmoji}
            onRecentEmojiChange={commands.onRecentEmojiChange}
            loadEmoji={commands.loadEmoji}
            onSelect={(selection) => {
              state.closeOverlay();
              commands.onReact?.(
                selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`,
              );
            }}
          />
        </PopoverPanel>
      ) : null}
      {commands.onDelete ? (
        <Modal
          role="alertdialog"
          isOpen={open?.overlay === 'delete'}
          onOpenChange={close}
          tone="danger"
          title={strings.deleteMessage}
          description={strings.deleteMessageDescription}
          cancelAction={{ autoFocus: true }}
          primaryAction={{
            label: strings.delete,
            onPress: async (closeDialog) => {
              await commands.onDelete?.();
              closeDialog();
            },
          }}
        />
      ) : null}
    </>
  );
}
