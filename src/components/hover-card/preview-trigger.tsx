'use client';

import { createContext, type ReactNode, useContext, useId, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, PressEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Button as AriaButton, Dialog, Provider } from '../../primitives/index.js';
import { containsFocus } from '../../utils/focus-target.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { PopoverPanel } from '../popover/popover.js';
import { HoverCard, type HoverCardTriggerProps } from './hover-card.js';
import { type PreviewTriggerType, restoreFocus, usePreviewOpening } from './preview-opening.js';

export type { PreviewTriggerType } from './preview-opening.js';

export interface PreviewTriggerProps
  extends
    RefProps<HTMLButtonElement>,
    OpenStateProps,
    Pick<HoverCardTriggerProps, 'delay' | 'closeDelay'>,
    PressEventProps,
    BaseProps {
  /** Opens nothing and refuses presses. */
  isDisabled?: boolean | undefined;
  /**
   * The preview to open, any host-owned content. Without one the trigger is a plain button; a preview that
   * arrives or leaves later keeps the same button, and its focus.
   */
  preview?: ReactNode;
  /** Accessible name of the preview; defaults to the trigger's name. */
  previewLabel?: string | undefined;
  /** What the trigger shows: the preview button content. */
  children: ReactNode;
  /**
   * `press` (the default) opens the preview on a click, Enter or Space. `hover` opens it `delay`
   * milliseconds after hover or keyboard focus, or on a long press, without moving focus, and closes
   * it `closeDelay` milliseconds after the pointer and focus leave; pressing then runs `onPress` only.
   */
  trigger?: PreviewTriggerType | undefined;
}

const hooks = createHooks('preview-trigger', ['popover', 'content'], {
  root: 'hover-card-trigger',
});

/** The `PreviewTrigger` that opened a preview, which its actions dismiss. */
export interface PreviewOwner {
  /** The preview opened on hover, where it must not take focus as a dialog would. */
  isPreview: boolean;
  /** Closes the preview from the pressed action, returning focus to the trigger if the action held it. */
  dismiss: (action: Element) => void;
}

/**
 * Set by a `PreviewTrigger` around its own preview only; a preview rendered anywhere else, an ancestor's
 * overlay included, has no owner to close.
 */
const PreviewOwnerContext = createContext<PreviewOwner | null>(null);

/** The `PreviewTrigger` that opened the preview being rendered, or `null` outside one's preview. */
export function usePreviewOwner(): PreviewOwner | null {
  return useContext(PreviewOwnerContext);
}

/** Hover previews announce their content without taking focus; press previews take dialog focus. */
function PreviewDialog({
  isPreview,
  label,
  triggerId,
  children,
}: {
  isPreview: boolean;
  label: string | undefined;
  triggerId: string;
  children: ReactNode;
}) {
  const props = {
    className: hooks.slotClass('content'),
    'aria-label': label,
    'aria-labelledby': label ? undefined : triggerId,
  };
  return isPreview ? (
    <section {...props} role="dialog">
      {children}
    </section>
  ) : (
    <Dialog {...props}>{children}</Dialog>
  );
}

/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `preview` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the preview's actions close it, returning focus to the trigger. The button
 * stays the same element while `preview` comes and goes.
 */
export function PreviewTrigger({
  ref,
  preview,
  previewLabel,
  children,
  trigger = 'press',
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  delay,
  closeDelay,
  className,
  onPress,
  isDisabled,
  ...rest
}: PreviewTriggerProps) {
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  // A preview open when the trigger turns disabled closes once and stays closed when it is enabled.
  useCloseWhenLocked(isOpen, Boolean(isDisabled), () => setOpen(false));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRefs = useMergedRefs(buttonRef, ref);
  const hasPreview = preview !== undefined && preview !== null && preview !== false;
  const isPreview = trigger === 'hover';
  const fallbackId = useId();
  const triggerId = rest.id ?? fallbackId;
  const opening = usePreviewOpening({
    mode: hasPreview ? trigger : undefined,
    isOpen: isOpen && !isDisabled,
    setOpen,
    buttonRef,
    triggerId,
    delay,
    closeDelay,
    isDisabled,
  });
  const owner: PreviewOwner = {
    isPreview,
    dismiss: (action) => {
      const hadFocus = containsFocus(action);
      setOpen(false);
      // A press preview's dialog returns focus as it closes; a hover preview only returns it to where it
      // was when the preview opened, which after a hover is the page.
      if (isPreview && hadFocus && buttonRef.current) restoreFocus(buttonRef.current);
    },
  };
  const popover = hasPreview ? (
    <PreviewOwnerContext value={owner}>
      <PreviewDialog isPreview={isPreview} label={previewLabel} triggerId={triggerId}>
        {preview}
      </PreviewDialog>
    </PreviewOwnerContext>
  ) : null;
  return (
    // The same providers and button render with or without a preview, so the button keeps its focus.
    <Provider values={opening.contexts as never}>
      <AriaButton
        {...rest}
        {...opening.triggerProps}
        id={triggerId}
        ref={rootRefs}
        isDisabled={isDisabled}
        onPress={(event) => {
          onPress?.(event);
          opening.onPress?.();
        }}
        // The slot marks a button that opens a preview.
        {...(hasPreview ? hooks.root({ className }) : { className })}
      >
        {children}
      </AriaButton>
      {popover && isPreview ? (
        <HoverCard className={hooks.slotClass('popover')}>{popover}</HoverCard>
      ) : null}
      {popover && !isPreview ? (
        <PopoverPanel className={hooks.slotClass('popover')}>{popover}</PopoverPanel>
      ) : null}
    </Provider>
  );
}
