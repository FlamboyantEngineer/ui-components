import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  OverlayTriggerStateContext,
} from 'react-aria-components';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { runPendingAction } from '../action-button/action-button.js';
import { Button, type ButtonVariant } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useLayerZIndex } from '../portal/portal.js';

export type ModalVariant = 'default' | 'danger';

/** Dialog width class; the host stylesheet maps each to a width. `full` fills the viewport. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** `column` lays the body out as a vertical stack so one child can take the remaining height. */
export type ModalBodyLayout = 'block' | 'column';

/** `first` focuses the first focusable element on open; `dialog` focuses the dialog itself. */
export type ModalInitialFocus = 'first' | 'dialog';

interface ModalButtonOptions {
  /** Keep the button focusable while disabled, with `aria-disabled="true"`. */
  focusableWhenDisabled?: boolean | undefined;
  /** Focus this button when the modal opens. */
  autoFocus?: boolean | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

/** A footer action: the primary action (rightmost) or the secondary action (between Cancel and it). */
export interface ModalAction extends ModalButtonOptions {
  label: ReactNode;
  /**
   * Runs the action. It receives `close`, which closes this opening of the modal. When it returns
   * a promise the button is pending until it settles, and a rejection is shown in the footer.
   */
  onPress?: ((close: () => void) => void | Promise<unknown>) | undefined;
  isDisabled?: boolean | undefined;
  /** Pending from outside the modal, for example while the caller's own request runs. */
  isPending?: boolean | undefined;
  /** Names the busy indicator while pending. */
  pendingLabel?: string | undefined;
  /** Button variant. Primary defaults to `primary` (`danger` in a danger modal); secondary to `secondary`. */
  variant?: ButtonVariant | undefined;
}

/** The Cancel button, which closes the modal like Escape. */
export interface ModalCancelAction extends ModalButtonOptions {
  /** Defaults to the provider's `cancel` string. */
  label?: ReactNode;
}

export interface ModalRenderProps {
  /** Closes the modal. */
  close: () => void;
}

export interface ModalProps {
  /** Whether the modal is open (controlled). Leave both this and `defaultOpen` out inside a `DialogTrigger`. */
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Called with `false` when Escape, an outside press, Cancel, the close button or an action closes it. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Close on a press outside the dialog. Defaults to false. */
  isDismissable?: boolean | undefined;
  /** Ignore Escape. */
  isKeyboardDismissDisabled?: boolean | undefined;
  /** Refuse every way of dismissing: Cancel, the close button, Escape and outside presses. */
  isDismissDisabled?: boolean | undefined;
  /** The heading, which also names the dialog unless `aria-label` is given. */
  title: ReactNode;
  /** A line under the title; it describes the dialog. */
  description?: ReactNode;
  /** Compact content at the end of the header row, such as a step indicator. */
  headerActions?: ReactNode;
  /** Show a close button in the header. */
  showCloseButton?: boolean | undefined;
  /** The body. A function receives `close`. */
  children?: ReactNode | ((renderProps: ModalRenderProps) => ReactNode);
  primaryAction?: ModalAction | undefined;
  secondaryAction?: ModalAction | undefined;
  /**
   * The Cancel button. Shown by default when there is a primary or secondary action; pass an object to
   * show it alone or relabel it, or `null` to hide it.
   */
  cancelAction?: ModalCancelAction | null | undefined;
  /** Replaces the built-in buttons with the caller's own. Control+Enter then does nothing. */
  actions?: ReactNode;
  /** Content at the start of the footer, before the message and the buttons. */
  footerContent?: ReactNode;
  /** A polite footer message. */
  status?: ReactNode;
  /** An urgent footer message; it takes precedence over `status` and over an action's failure. */
  error?: ReactNode;
  /** Defaults to `default`. */
  variant?: ModalVariant | undefined;
  /** Defaults to `md`. */
  size?: ModalSize | undefined;
  /** Defaults to `block`. */
  bodyLayout?: ModalBodyLayout | undefined;
  /** Where focus goes on open when no element has `autoFocus`. Defaults to `first`. */
  initialFocus?: ModalInitialFocus | undefined;
  /** `alertdialog` for a decision that interrupts the reader. Defaults to `dialog`. */
  role?: 'dialog' | 'alertdialog' | undefined;
  'aria-label'?: string | undefined;
  'aria-describedby'?: string | undefined;
  className?: string | undefined;
  /** Put on the dialog element. */
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('modal', [
  'panel',
  'dialog',
  'header',
  'heading',
  'title',
  'description',
  'header-actions',
  'close',
  'body',
  'footer',
  'footer-content',
  'message',
  'actions',
  'cancel',
  'secondary',
  'primary',
]);

interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean | undefined;
  isComposing?: boolean | undefined;
  defaultPrevented?: boolean | undefined;
}

/**
 * Whether a key press is the modal's primary-action shortcut: Enter with exactly one of Control or
 * Command, no other modifier, not repeated, not composing text and not already handled.
 */
export function isModalPrimaryShortcut(event: ShortcutEvent): boolean {
  return (
    event.key === 'Enter' &&
    event.ctrlKey !== event.metaKey &&
    !event.altKey &&
    !event.shiftKey &&
    !event.repeat &&
    !event.isComposing &&
    !event.defaultPrevented
  );
}

/** Whether the key press comes from a multiline editor, where Control+Enter belongs to the editor. */
function fromMultilineEditor(event: Event): boolean {
  return event.composedPath().some((target) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.tagName === 'TEXTAREA' || target.isContentEditable) return true;
    const editable = target.getAttribute('contenteditable');
    return (
      (editable !== null && editable !== 'false') ||
      target.getAttribute('aria-multiline') === 'true'
    );
  });
}

// Key presses already seen by a modal; a modal opened inside another claims its own.
const claimedKeyEvents = new WeakSet<Event>();

const TABBABLE =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]';

function firstTabbable(root: Element | null): HTMLElement | null {
  if (!root) return null;
  for (const element of root.querySelectorAll<HTMLElement>(TABBABLE)) {
    if (element.tabIndex < 0 || element.closest('[inert], [hidden]')) continue;
    if ('disabled' in element && element.disabled === true) continue;
    if (element instanceof HTMLInputElement && element.type === 'hidden') continue;
    return element;
  }
  return null;
}

/**
 * Moves focus to the first focusable element on open. It renders inside the dialog so it runs before
 * the dialog focuses itself, and it leaves focus alone when an element with `autoFocus` took it.
 */
function InitialFocus({
  dialogRef,
  regions,
}: {
  dialogRef: RefObject<HTMLElement | null>;
  regions: ReadonlyArray<RefObject<HTMLElement | null>>;
}) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.contains(document.activeElement)) return;
    for (const region of [...regions, dialogRef]) {
      const target = firstTabbable(region.current);
      if (target) {
        target.focus();
        return;
      }
    }
    // Only runs when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

type ActionSlot = 'primary' | 'secondary';

function ModalDialog({
  title,
  description,
  headerActions,
  showCloseButton,
  children,
  primaryAction,
  secondaryAction,
  cancelAction,
  actions,
  footerContent,
  status,
  error,
  variant,
  initialFocus,
  isDismissDisabled,
  role,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: Omit<
  ModalProps,
  | 'isOpen'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'isDismissable'
  | 'isKeyboardDismissDisabled'
  | 'size'
  | 'bodyLayout'
  | 'className'
> & { variant: ModalVariant; initialFocus: ModalInitialFocus; isDismissDisabled: boolean }) {
  const state = useContext(OverlayTriggerStateContext);
  const strings = useUiStrings();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState<ActionSlot | null>(null);
  const runningRef = useRef<ActionSlot | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Each opening gets a generation; a request from an earlier opening changes nothing in a later one.
  const generation = useRef(0);
  const isOpen = state?.isOpen ?? true;

  useEffect(() => {
    if (isOpen) return;
    generation.current += 1;
    runningRef.current = null;
    setRunning(null);
    setActionError(null);
  }, [isOpen]);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );

  const closeOpening = useCallback(
    (opening: number) => {
      if (generation.current === opening) state?.close();
    },
    [state],
  );
  const close = useCallback(() => closeOpening(generation.current), [closeOpening]);

  const run = (slot: ActionSlot) => {
    const action = slot === 'primary' ? primaryAction : secondaryAction;
    if (!action) return;
    const opening = generation.current;
    const onPress = action.onPress;
    void runPendingAction({
      blocked: Boolean(action.isDisabled || action.isPending || runningRef.current),
      setPending: (pending) => {
        if (generation.current !== opening) return;
        runningRef.current = pending ? slot : null;
        setRunning(pending ? slot : null);
        if (pending) setActionError(null);
      },
      action: onPress ? () => onPress(() => closeOpening(opening)) : undefined,
      onError: (failure) => {
        if (generation.current !== opening) return;
        setActionError(
          failure instanceof Error && failure.message ? failure.message : strings.actionFailed,
        );
      },
    });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const native = event.nativeEvent;
    if (claimedKeyEvents.has(native)) return;
    claimedKeyEvents.add(native);
    if (actions !== undefined || !primaryAction) return;
    if (!isModalPrimaryShortcut(native)) return;
    if (fromMultilineEditor(native)) return;
    if (primaryAction.isDisabled || primaryAction.isPending || runningRef.current) return;
    event.preventDefault();
    run('primary');
  };

  const showCancel =
    cancelAction !== null &&
    (cancelAction !== undefined || primaryAction !== undefined || secondaryAction !== undefined);
  const errorMessage = hasContent(error) ? error : actionError;
  const tone = hasContent(errorMessage) ? 'error' : 'status';
  const message = tone === 'error' ? errorMessage : status;

  const actionButton = (slot: ActionSlot, action: ModalAction) => {
    const busy = running === slot || Boolean(action.isPending);
    const defaultVariant: ButtonVariant =
      slot === 'secondary' ? 'secondary' : variant === 'danger' ? 'danger' : 'primary';
    return (
      <Button
        {...pickDataAttributes(action)}
        id={action.id}
        className={hooks.slotClass(slot)}
        variant={action.variant ?? defaultVariant}
        isDisabled={Boolean(action.isDisabled) || (running !== null && running !== slot)}
        isPending={busy}
        pendingLabel={action.pendingLabel}
        focusableWhenDisabled={action.focusableWhenDisabled}
        autoFocus={action.autoFocus}
        onPress={() => run(slot)}
      >
        {action.label}
      </Button>
    );
  };

  const builtInActions = (
    <>
      {showCancel ? (
        <Button
          {...pickDataAttributes(cancelAction ?? {})}
          id={cancelAction?.id}
          className={hooks.slotClass('cancel')}
          variant="secondary"
          isDisabled={isDismissDisabled}
          focusableWhenDisabled={cancelAction?.focusableWhenDisabled}
          autoFocus={cancelAction?.autoFocus}
          onPress={close}
        >
          {cancelAction?.label ?? strings.cancel}
        </Button>
      ) : null}
      {secondaryAction ? actionButton('secondary', secondaryAction) : null}
      {primaryAction ? actionButton('primary', primaryAction) : null}
    </>
  );
  const hasActions = actions !== undefined || showCancel || primaryAction || secondaryAction;
  const hasFooter = hasActions || hasContent(footerContent) || hasContent(message);

  return (
    <Dialog
      ref={dialogRef}
      id={id}
      role={role}
      className={hooks.slotClass('dialog')}
      aria-label={ariaLabel}
      aria-describedby={hasContent(description) ? descriptionId : ariaDescribedby}
      render={(props) => <section {...props} onKeyDown={onKeyDown} />}
    >
      <div {...hooks.slot('header')}>
        <div {...hooks.slot('heading')}>
          <Heading slot="title" className={hooks.slotClass('title')}>
            {title}
          </Heading>
          {hasContent(description) ? (
            <p {...hooks.slot('description')} id={descriptionId}>
              {description}
            </p>
          ) : null}
        </div>
        {hasContent(headerActions) ? (
          <div {...hooks.slot('header-actions')}>{headerActions}</div>
        ) : null}
        {showCloseButton ? (
          <IconButton
            icon="close"
            label={strings.close}
            className={hooks.slotClass('close')}
            isDisabled={isDismissDisabled}
            onPress={close}
          />
        ) : null}
      </div>
      {children !== undefined && children !== null ? (
        <div ref={bodyRef} {...hooks.slot('body')}>
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      ) : null}
      {hasFooter ? (
        <div ref={footerRef} {...hooks.slot('footer')}>
          {hasContent(footerContent) ? (
            <div {...hooks.slot('footer-content')}>{footerContent}</div>
          ) : null}
          {hasContent(message) ? (
            <div
              key={tone}
              {...hooks.slot('message', { tone })}
              role={tone === 'error' ? 'alert' : 'status'}
              aria-atomic="true"
            >
              {message}
            </div>
          ) : null}
          {hasActions ? (
            <div {...hooks.slot('actions')}>{actions !== undefined ? actions : builtInActions}</div>
          ) : null}
        </div>
      ) : null}
      {initialFocus === 'first' ? (
        <InitialFocus dialogRef={dialogRef} regions={[bodyRef, footerRef]} />
      ) : null}
    </Dialog>
  );
}

/**
 * A blocking dialog over the page: title, body and a footer with Cancel, secondary and primary
 * actions. Focus moves in on open, stays inside while open and returns to where it was on close.
 * Escape closes it, and Control+Enter (or Command+Enter) runs the primary action.
 */
export function Modal({
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = false,
  isKeyboardDismissDisabled = false,
  isDismissDisabled = false,
  variant = 'default',
  size = 'md',
  bodyLayout = 'block',
  initialFocus = 'first',
  className,
  ...rest
}: ModalProps) {
  const zIndex = useLayerZIndex('modal');
  return (
    <ModalOverlay
      {...(isOpen !== undefined ? { isOpen } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable && !isDismissDisabled}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled || isDismissDisabled}
      {...hooks.root({
        className,
        props: rest,
        data: { layer: 'modal', variant, size, bodyLayout },
      })}
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      <AriaModal className={hooks.slotClass('panel')}>
        <ModalDialog
          {...rest}
          variant={variant}
          initialFocus={initialFocus}
          isDismissDisabled={isDismissDisabled}
        />
      </AriaModal>
    </ModalOverlay>
  );
}
