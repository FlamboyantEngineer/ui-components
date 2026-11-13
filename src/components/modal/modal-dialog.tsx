'use client';

import {
  type KeyboardEvent,
  type RefObject,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { dialogTitleLevel, HeadingLevelContext } from '../../core/heading-level.js';
import { AvailableLoadingBoundary, useHoldFocusOnLeave } from '../../core/loading-boundary.js';
import { Dialog, OverlayTriggerStateContext } from '../../primitives/index.js';
import { stopConsumedEscape } from '../../utils/consumed-escape.js';
import {
  findControllingElement,
  getDeepActiveElement,
  resolveFocusTarget,
} from '../../utils/focus-target.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import {
  preventPrimaryActionButtonDefault,
  PrimaryActionKeysContext,
} from '../../utils/primary-action-keys.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePortalContainer } from '../portal/portal.js';
import type { ModalProps, ModalRenderProps } from './modal.js';
import { InitialFocus, useFocusReturn } from './modal-focus.js';
import { ModalFooter } from './modal-footer.js';
import { ModalHeader } from './modal-header.js';
import { modalHooks as hooks } from './modal-hooks.js';
import { ModalShownContext } from './modal-retained.js';
import { claimPrimaryShortcut } from './modal-shortcut.js';
import { type ModalActions, useModalActions } from './use-modal-actions.js';

type ModalDialogProps = Omit<
  ModalProps,
  | 'isOpen'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'isDismissable'
  | 'isKeyboardDismissDisabled'
  | 'shouldCloseOnInteractOutside'
  | 'isNonModal'
  | 'placement'
  | 'size'
  | 'bodyLayout'
  | 'className'
> &
  Required<Pick<ModalProps, 'tone' | 'initialFocus' | 'isDismissDisabled'>> & {
    /** Escape would close the dialog: neither keyboard dismissal nor every dismissal is refused. */
    canEscape: boolean;
    /** The dialog floats over a page it does not block, so it handles Escape and focus return. */
    isFloating: boolean;
    /** The dialog stays mounted while closed, so it returns focus itself at each close. */
    isRetained: boolean;
  };

interface ModalOpeningProps extends Pick<ModalProps, 'finalFocus' | 'onExitComplete'> {
  /** Focus returns to the element focused at the opening when nothing else restores it. */
  returnsToOpener: boolean;
  dialogRef: RefObject<HTMLElement | null>;
}

interface EscapeOptions {
  canEscape: boolean;
  isFloating: boolean;
  shouldCloseOnEscape: ModalProps['shouldCloseOnEscape'];
  close: () => void;
}

function ModalBody({
  children,
  renderProps,
  ref,
}: Pick<ModalProps, 'children'> & {
  renderProps: ModalRenderProps;
  ref: RefObject<HTMLDivElement | null>;
}) {
  if (children === undefined || children === null) return null;
  return (
    <div ref={ref} {...hooks.slot('body')}>
      <HeadingLevelContext value={dialogTitleLevel}>
        {typeof children === 'function' ? children(renderProps) : children}
      </HeadingLevelContext>
    </div>
  );
}

/**
 * Escape that would close the dialog: the caller may refuse it; a floating dialog closes itself,
 * and a blocking one leaves it to React Aria's overlay above. An Escape the content already
 * handled, or a refused one, stops here.
 */
function handleEscape(event: KeyboardEvent<HTMLElement>, options: EscapeOptions) {
  if (stopConsumedEscape(event)) return;
  if (!options.canEscape || isComposingKey(event.nativeEvent)) return;
  const isRefused = options.shouldCloseOnEscape?.() === false;
  if (!isRefused && !options.isFloating) return;
  event.stopPropagation();
  event.preventDefault();
  if (!isRefused) options.close();
}

/** Runs the primary action on Control+Enter when it can run. */
function handlePrimaryShortcut(
  event: KeyboardEvent<HTMLElement>,
  { actionState, hasCustomActions }: { actionState: ModalActions; hasCustomActions: boolean },
) {
  if (!claimPrimaryShortcut(event) || hasCustomActions) return;
  if (!actionState.canRun('primary')) return;
  event.preventDefault();
  actionState.run('primary');
}

/** What function children receive: `close`, and the primary action unless `actions` replace it. */
function toRenderProps(actionState: ModalActions, hasCustomActions: boolean): ModalRenderProps {
  return {
    close: actionState.close,
    runPrimaryAction: () => {
      if (!hasCustomActions) actionState.run('primary');
    },
  };
}

/** Calls `onExitComplete` when the dialog leaves the page after closing, not when torn down open. */
function useExitComplete(onExitComplete: ModalProps['onExitComplete']) {
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? true;
  const latest = useLatest({ isOpen, onExitComplete });
  useLayoutEffect(
    () => () => {
      if (!latest.current.isOpen) latest.current.onExitComplete?.();
    },
    [latest],
  );
}

/**
 * The end of one opening of the dialog: when it unmounts after closing, focus returns and
 * `onExitComplete` runs. It lives as long as the dialog, or, for a retained dialog, as long as one
 * showing. It renders after the dialog element, so the dialog's ref is set when its effects run.
 */
function ModalOpening({
  finalFocus,
  onExitComplete,
  returnsToOpener,
  dialogRef,
}: ModalOpeningProps) {
  // The dialog has no element yet: the opener is focused in its portal container's document.
  const container = usePortalContainer();
  const [focusedAtOpening] = useState(() => getDeepActiveElement(getOwnerDocument(container)));
  // React Aria's own restoration cannot see an opener inside a shadow root.
  const isShadowed =
    focusedAtOpening !== null && focusedAtOpening.getRootNode() !== focusedAtOpening.ownerDocument;
  const opener = returnsToOpener || isShadowed ? focusedAtOpening : null;
  // An opener inside a menu leaves with the menu: focus then goes to the control that opened it.
  const [successor] = useState(() => (opener ? findControllingElement(opener) : null));
  // Closing while the content it was opened from loads, focus waits on that content's boundary.
  useHoldFocusOnLeave(
    () => dialogRef.current,
    () =>
      resolveFocusTarget(finalFocus) ?? (isHTMLElement(focusedAtOpening) ? focusedAtOpening : null),
  );
  useFocusReturn({
    containerRef: dialogRef,
    finalFocus,
    fallback: () => (opener?.isConnected ? opener : successor),
  });
  useExitComplete(onExitComplete);
  return null;
}

/** The dialog's key handler: Escape, the primary shortcut, then the caller's handler. */
function toDialogKeyDown({
  canEscape,
  isFloating,
  shouldCloseOnEscape,
  actionState,
  hasCustomActions,
  onCallerKeyDown,
}: Pick<ModalDialogProps, 'canEscape' | 'isFloating' | 'shouldCloseOnEscape'> & {
  actionState: ModalActions;
  hasCustomActions: boolean;
  onCallerKeyDown: ModalDialogProps['onKeyDown'];
}) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      handleEscape(event, { canEscape, isFloating, shouldCloseOnEscape, close: actionState.close });
      return;
    }
    handlePrimaryShortcut(event, { actionState, hasCustomActions });
    if (!event.defaultPrevented) onCallerKeyDown?.(event);
    preventPrimaryActionButtonDefault(event);
  };
}

/** The dialog element: header, body and footer, with its focus, Escape and shortcut handling. */
export function ModalDialog({
  title,
  description,
  headerActions,
  showCloseButton,
  children,
  initialFocus,
  finalFocus,
  isDismissDisabled,
  canEscape,
  isFloating,
  isRetained,
  shouldCloseOnEscape,
  onExitComplete,
  role,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  onKeyDown: onCallerKeyDown,
  ...footer
}: ModalDialogProps) {
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const isShown = useContext(ModalShownContext);
  const actionState = useModalActions(footer);
  const hasCustomActions = footer.actions !== undefined;
  const onKeyDown = toDialogKeyDown({
    ...{ canEscape, isFloating, shouldCloseOnEscape, actionState, hasCustomActions },
    onCallerKeyDown,
  });
  return (
    <>
      {/* Its own place to work: menus and popups inside stay usable while the page beneath loads. */}
      <PrimaryActionKeysContext value={true}>
        <AvailableLoadingBoundary>
          <Dialog
            ref={dialogRef}
            id={id}
            role={role}
            className={hooks.slotClass('dialog')}
            aria-label={ariaLabel}
            aria-describedby={isEmptyNode(description) ? ariaDescribedby : descriptionId}
            // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
            render={(props) => <section {...props} onKeyDown={onKeyDown} />}
          >
            <ModalHeader
              {...{ title, description, descriptionId, headerActions, showCloseButton }}
              isDismissDisabled={isDismissDisabled}
              onClose={actionState.close}
            />
            <ModalBody ref={bodyRef} renderProps={toRenderProps(actionState, hasCustomActions)}>
              {children}
            </ModalBody>
            <ModalFooter
              {...footer}
              ref={footerRef}
              actionState={actionState}
              isDismissDisabled={isDismissDisabled}
            />
            {initialFocus === 'dialog' || !isShown ? null : (
              <InitialFocus
                dialogRef={dialogRef}
                bodyRef={bodyRef}
                footerRef={footerRef}
                target={initialFocus === 'first' ? undefined : initialFocus}
              />
            )}
          </Dialog>
        </AvailableLoadingBoundary>
      </PrimaryActionKeysContext>
      {isShown ? (
        <ModalOpening
          {...{ finalFocus, onExitComplete, dialogRef }}
          // A floating or retained dialog returns focus itself, to the element focused at opening.
          returnsToOpener={isFloating || isRetained}
        />
      ) : null}
    </>
  );
}
