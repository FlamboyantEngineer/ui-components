'use client';

import { useState, type ReactNode, type Ref } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button, type ButtonVariant } from '../button/button.js';
import type { ModalAction, ModalCancelAction, ModalProps } from './modal.js';
import type { ModalActionSlot, ModalActions } from './use-modal-actions.js';
import { modalHooks as hooks } from './modal-hooks.js';
import type { Tone } from '../../core/props.js';

interface ModalFooterProps extends Pick<
  ModalProps,
  | 'primaryAction'
  | 'secondaryAction'
  | 'cancelAction'
  | 'actions'
  | 'footerContent'
  | 'status'
  | 'error'
  | 'tone'
> {
  /** The action lifecycle of this opening. */
  actionState: ModalActions;
  /** Disables Cancel. */
  isDismissDisabled: boolean;
  ref?: Ref<HTMLDivElement> | undefined;
}

type BuiltInActionsProps = Omit<
  ModalFooterProps,
  'actions' | 'footerContent' | 'status' | 'error' | 'ref'
>;

interface FooterMessage {
  tone: Tone;
  content: ReactNode;
}

/** The one message the footer shows: `error`, else an action's failure, as an alert; else `status`. */
function resolveFooterMessage(error: ReactNode, failure: string | null, status: ReactNode) {
  const alert = isEmptyNode(error) ? failure : error;
  const message: FooterMessage = isEmptyNode(alert)
    ? { tone: 'neutral', content: status }
    : { tone: 'danger', content: alert };
  return message;
}

/** Cancel shows by default beside a built-in action, alone when given, and never when `null`. */
function isCancelShown({ cancelAction, primaryAction, secondaryAction }: BuiltInActionsProps) {
  if (cancelAction === null) return false;
  return cancelAction !== undefined || primaryAction !== undefined || secondaryAction !== undefined;
}

function CancelButton({
  action,
  isDismissDisabled,
  onPress,
}: {
  action: ModalCancelAction;
  isDismissDisabled: boolean;
  onPress: () => void;
}) {
  const strings = useUiStrings();
  const { label, className, ...buttonProps } = action;
  return (
    <Button
      {...buttonProps}
      className={mergeClassNames(hooks.slotClass('cancel'), className)}
      variant="secondary"
      isDisabled={isDismissDisabled}
      onPress={onPress}
    >
      {label ?? strings.cancel}
    </Button>
  );
}

function FooterActionButton({
  slot,
  action,
  defaultVariant,
  actionState,
}: {
  slot: ModalActionSlot;
  action: ModalAction;
  defaultVariant: ButtonVariant;
  actionState: ModalActions;
}) {
  const {
    label,
    onPress: _onPress,
    variant,
    isDisabled,
    isPending,
    className,
    ...buttonProps
  } = action;
  const [isFocused, setFocused] = useState(false);
  const isOtherRunning = actionState.running !== null && actionState.running !== slot;
  return (
    <Button
      {...buttonProps}
      className={mergeClassNames(hooks.slotClass(slot), className)}
      variant={variant ?? defaultVariant}
      isDisabled={Boolean(isDisabled) || isOtherRunning}
      // A focused action the other action disables keeps the focus, refusing presses meanwhile.
      focusableWhenDisabled={(isOtherRunning && isFocused) || buttonProps.focusableWhenDisabled}
      onFocusChange={setFocused}
      isPending={actionState.running === slot || Boolean(isPending)}
      onPress={() => actionState.run(slot)}
    >
      {label}
    </Button>
  );
}

/** Cancel, the secondary action and the primary action, so the primary action is rightmost. */
function BuiltInActions(props: BuiltInActionsProps) {
  const { primaryAction, secondaryAction, cancelAction, tone, isDismissDisabled, actionState } =
    props;
  return (
    <>
      {isCancelShown(props) ? (
        <CancelButton
          action={cancelAction ?? {}}
          isDismissDisabled={isDismissDisabled}
          onPress={actionState.close}
        />
      ) : null}
      {secondaryAction ? (
        <FooterActionButton
          slot="secondary"
          action={secondaryAction}
          defaultVariant="secondary"
          actionState={actionState}
        />
      ) : null}
      {primaryAction ? (
        <FooterActionButton
          slot="primary"
          action={primaryAction}
          defaultVariant={tone === 'danger' ? 'danger' : 'primary'}
          actionState={actionState}
        />
      ) : null}
    </>
  );
}

/** The footer: caller content, the status or error message, and the action bar. */
export function ModalFooter({
  actions,
  footerContent,
  status,
  error,
  ref,
  ...builtIn
}: ModalFooterProps) {
  const message = resolveFooterMessage(error, builtIn.actionState.failure, status);
  const hasActionBar =
    actions !== undefined ||
    isCancelShown(builtIn) ||
    Boolean(builtIn.primaryAction || builtIn.secondaryAction);
  if (!hasActionBar && isEmptyNode(footerContent) && isEmptyNode(message.content)) return null;
  return (
    <div ref={ref} {...hooks.slot('footer')}>
      {isEmptyNode(footerContent) ? null : (
        <div {...hooks.slot('footer-content')}>{footerContent}</div>
      )}
      {isEmptyNode(message.content) ? null : (
        <div
          key={message.tone}
          {...hooks.slot('message', { tone: message.tone })}
          role={message.tone === 'danger' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          {message.content}
        </div>
      )}
      {hasActionBar ? (
        <div {...hooks.slot('actions')}>
          {actions !== undefined ? actions : <BuiltInActions {...builtIn} />}
        </div>
      ) : null}
    </div>
  );
}
