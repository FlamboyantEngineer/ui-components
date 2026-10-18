import {
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Dialog, OverlayTriggerStateContext } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ModalProps } from './modal.js';
import { InitialFocus, useFocusReturn } from './modal-focus.js';
import { ModalFooter } from './modal-footer.js';
import { ModalHeader } from './modal-header.js';
import { claimPrimaryShortcut } from './modal-shortcut.js';
import { useModalActions, type ModalActions } from './use-modal-actions.js';

export type ModalDialogProps = Omit<
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
  };

interface EscapeOptions {
  canEscape: boolean;
  isFloating: boolean;
  shouldCloseOnEscape: ModalProps['shouldCloseOnEscape'];
  close: () => void;
}

const hooks = createHooks('modal', ['dialog', 'body']);

function ModalBody({
  children,
  close,
  ref,
}: Pick<ModalProps, 'children'> & { close: () => void; ref: RefObject<HTMLDivElement | null> }) {
  if (children === undefined || children === null) return null;
  return (
    <div ref={ref} {...hooks.slot('body')}>
      {typeof children === 'function' ? children({ close }) : children}
    </div>
  );
}

/**
 * Escape that would close the dialog: the caller may refuse it; a floating dialog closes itself,
 * and a blocking one leaves it to React Aria's overlay above. A refused Escape stops here.
 */
function handleEscape(event: KeyboardEvent<HTMLElement>, options: EscapeOptions) {
  if (!options.canEscape || event.nativeEvent.isComposing) return;
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

/** Calls `onExitComplete` when the dialog leaves the page after closing, not when torn down open. */
function useExitComplete(onExitComplete: ModalProps['onExitComplete']) {
  const isOpen = useContext(OverlayTriggerStateContext)?.isOpen ?? true;
  const latest = useRef({ isOpen, onExitComplete });
  useLayoutEffect(() => {
    latest.current = { isOpen, onExitComplete };
  });
  useLayoutEffect(
    () => () => {
      if (!latest.current.isOpen) latest.current.onExitComplete?.();
    },
    [],
  );
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
  shouldCloseOnEscape,
  onExitComplete,
  role,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...footer
}: ModalDialogProps) {
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  // A floating dialog returns focus itself, to the element focused when it opened.
  const [opener] = useState(() => (isFloating ? document.activeElement : null));
  const actionState = useModalActions(footer);
  useFocusReturn({ containerRef: dialogRef, finalFocus, fallback: opener });
  useExitComplete(onExitComplete);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      handleEscape(event, { canEscape, isFloating, shouldCloseOnEscape, close: actionState.close });
      return;
    }
    handlePrimaryShortcut(event, { actionState, hasCustomActions: footer.actions !== undefined });
  };
  return (
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
        title={title}
        description={description}
        descriptionId={descriptionId}
        headerActions={headerActions}
        showCloseButton={showCloseButton}
        isDismissDisabled={isDismissDisabled}
        onClose={actionState.close}
      />
      <ModalBody ref={bodyRef} close={actionState.close}>
        {children}
      </ModalBody>
      <ModalFooter
        {...footer}
        ref={footerRef}
        actionState={actionState}
        isDismissDisabled={isDismissDisabled}
      />
      {initialFocus === 'dialog' ? null : (
        <InitialFocus
          dialogRef={dialogRef}
          bodyRef={bodyRef}
          footerRef={footerRef}
          target={initialFocus === 'first' ? undefined : initialFocus}
        />
      )}
    </Dialog>
  );
}
