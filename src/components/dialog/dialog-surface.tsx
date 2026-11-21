'use client';

import {
  type KeyboardEvent,
  type RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useDataSlotHooks } from '../../core/data-slot-names.js';
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
import type { DialogProps, DialogRenderProps } from './dialog.js';
import { InitialFocus, useFocusReturn } from './dialog-focus.js';
import { BuiltInFooter } from './dialog-footer.js';
import { BuiltInHeader } from './dialog-header.js';
import { dialogHooks } from './dialog-hooks.js';
import { DialogBody, DialogPartContext } from './dialog-parts.js';
import { DialogShownContext } from './dialog-retained.js';
import { claimPrimaryShortcut } from './dialog-shortcut.js';
import type { DialogActions } from './use-dialog-actions.js';

type DialogSurfaceProps = Omit<
  DialogProps,
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
  Required<Pick<DialogProps, 'tone' | 'initialFocus' | 'isDismissDisabled'>> & {
    /** Escape would close the dialog: neither keyboard dismissal nor every dismissal is refused. */
    canEscape: boolean;
    /** The dialog floats over a page it does not block, so it handles Escape and focus return. */
    isFloating: boolean;
    /** The dialog stays mounted while closed, so it returns focus itself at each close. */
    isRetained: boolean;
    actionState: DialogActions;
  };

interface DialogOpeningProps extends Pick<DialogProps, 'finalFocus' | 'onExitComplete'> {
  /** Focus returns to the element focused at the opening when nothing else restores it. */
  returnsToOpener: boolean;
  dialogRef: RefObject<HTMLElement | null>;
}

interface EscapeOptions {
  canEscape: boolean;
  isFloating: boolean;
  shouldCloseOnEscape: DialogProps['shouldCloseOnEscape'];
  close: () => void;
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
  { actionState, hasCustomActions }: { actionState: DialogActions; hasCustomActions: boolean },
) {
  if (!claimPrimaryShortcut(event) || hasCustomActions) return;
  if (!actionState.canRun('primary')) return;
  event.preventDefault();
  actionState.run('primary');
}

/** What function children receive: `close`, and the primary action unless `actions` replace it. */
function toRenderProps(actionState: DialogActions, hasCustomActions: boolean): DialogRenderProps {
  return {
    close: actionState.close,
    runPrimaryAction: () => {
      if (!hasCustomActions) actionState.run('primary');
    },
  };
}

/** Calls `onExitComplete` when the dialog leaves the page after closing, not when torn down open. */
function useExitComplete(onExitComplete: DialogProps['onExitComplete']) {
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
function DialogOpening({
  finalFocus,
  onExitComplete,
  returnsToOpener,
  dialogRef,
}: DialogOpeningProps) {
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
}: Pick<DialogSurfaceProps, 'canEscape' | 'isFloating' | 'shouldCloseOnEscape'> & {
  actionState: DialogActions;
  hasCustomActions: boolean;
  onCallerKeyDown: DialogSurfaceProps['onKeyDown'];
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

function DialogContents({
  children,
  renderProps,
  ...header
}: Pick<DialogProps, 'title' | 'description' | 'headerActions' | 'showCloseButton' | 'children'> & {
  renderProps: DialogRenderProps;
}) {
  const content = typeof children === 'function' ? children(renderProps) : children;
  const hasHeading =
    !isEmptyNode(header.title) ||
    !isEmptyNode(header.description) ||
    !isEmptyNode(header.headerActions);
  return (
    <>
      {hasHeading || header.showCloseButton ? <BuiltInHeader {...header} /> : null}
      {hasHeading && content != null ? <DialogBody>{content}</DialogBody> : content}
    </>
  );
}

/** The dialog element: header, body and footer, with its focus, Escape and shortcut handling. */
export function DialogSurface({
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
  actionState,
  ...footer
}: DialogSurfaceProps) {
  const hooks = useDataSlotHooks(dialogHooks);
  const [descriptionId, setDescriptionId] = useState<string>();
  const dialogRef = useRef<HTMLElement>(null);
  const isShown = useContext(DialogShownContext);
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
            {...hooks.slot('dialog')}
            aria-label={ariaLabel}
            aria-describedby={descriptionId ?? ariaDescribedby}
            // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
            render={(props) => <section {...props} onKeyDown={onKeyDown} />}
          >
            <DialogPartContext
              value={{ close: actionState.close, isDismissDisabled, setDescriptionId }}
            >
              <DialogContents
                {...{ title, description, headerActions, showCloseButton, children }}
                renderProps={toRenderProps(actionState, hasCustomActions)}
              />
              <BuiltInFooter {...footer} {...{ actionState, isDismissDisabled }} />
              {initialFocus === 'dialog' || !isShown ? null : (
                <InitialFocus
                  dialogRef={dialogRef}
                  target={initialFocus === 'first' ? undefined : initialFocus}
                />
              )}
            </DialogPartContext>
          </Dialog>
        </AvailableLoadingBoundary>
      </PrimaryActionKeysContext>
      {isShown ? (
        <DialogOpening
          {...{ finalFocus, onExitComplete, dialogRef }}
          // A floating or retained dialog returns focus itself, to the element focused at opening.
          returnsToOpener={isFloating || isRetained}
        />
      ) : null}
    </>
  );
}
