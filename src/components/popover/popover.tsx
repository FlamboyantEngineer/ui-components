'use client';

import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { CloseGlyph } from '../../core/glyphs.js';
import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type JSX,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  OverlayTriggerStateContext,
  PopoverContext,
  Popover as AriaPopover,
  useSlottedContext,
} from '../../primitives/index.js';
import type {
  OpenStateProps,
  OverlayDismissProps,
  OverlayPositionProps,
} from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { stopConsumedEscape } from '../../utils/consumed-escape.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { PopoverPresence } from './popover-presence.js';
import { usePopoverGutter } from './use-popover-gutter.js';
import { useScrollGuardedState } from '../../utils/use-scroll-guarded-state.js';
import { POPOVER_ARROW_OFFSET, POPOVER_OFFSET } from '../../utils/overlay-defaults.js';
import { HeadingLevelContext, dialogTitleLevel } from '../../core/heading-level.js';
import { FormBoundary } from '../../utils/form-boundary.js';

/** A pressable trigger and the `Popover` it opens. */
export interface PopoverTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `Popover`. */
  children: ReactNode;
}

/** The floating panel the library's anchored overlays share, carrying the caller's hooks. */
interface PopoverPanelProps
  extends
    BaseProps,
    RefProps<HTMLElement>,
    OverlayPositionProps,
    Omit<OverlayDismissProps, 'isDismissable'>,
    Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
  /** Internal panel composition, preserving a caller DOM id independently of a dialog's id. */
  render?: ((props: JSX.IntrinsicElements['div']) => ReactElement) | undefined;
  /** The element it is placed against, outside a trigger or instead of the trigger. */
  triggerRef?: RefObject<Element | null> | undefined;
  /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
  isNonModal?: boolean | undefined;
  /** The arrow's hook class; when given, an arrow pointing at the trigger leads the panel. */
  arrowClassName?: string | undefined;
  /** A hint shown on hover, such as a hover card: not counted as an open interactive overlay. */
  isHint?: boolean | undefined;
  /** Places the panel again when true after being false, to follow an anchor that moved. */
  shouldUpdatePosition?: boolean | undefined;
  /** Measured properties for the panel, such as a dropdown's `--ui-trigger-width`. */
  style?: CSSProperties | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  children: ReactNode;
}

export interface PopoverRenderProps {
  /** Closes the popover. */
  close: () => void;
}

export interface PopoverProps
  extends
    RefProps<HTMLElement>,
    BaseProps,
    OverlayPositionProps,
    Omit<OverlayDismissProps, 'isDismissable'>,
    Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
  /** Outside a `PopoverTrigger`, the element it is placed against; inside one, a different anchor. */
  triggerRef?: RefObject<Element | null> | undefined;
  /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
  isNonModal?: boolean | undefined;
  /** The heading, which also names the dialog unless `aria-label` or `aria-labelledby` is given. */
  title?: ReactNode;
  /** Names the dialog. */
  'aria-label'?: string | undefined;
  /** Names the dialog by another element. */
  'aria-labelledby'?: string | undefined;
  /** Shows a close button in the header. */
  showCloseButton?: boolean | undefined;
  /** Shows an arrow pointing at the trigger. */
  showArrow?: boolean | undefined;
  /** The body; a function receives `close`. */
  children?: ReactNode | ((renderProps: PopoverRenderProps) => ReactNode);
}

interface PopoverHeaderProps extends Pick<PopoverProps, 'title' | 'showCloseButton'> {
  onClose: () => void;
}

const hooks = createHooks('popover', ['arrow', 'dialog', 'header', 'title', 'close', 'body']);
const PopoverTriggerContext = createContext(false);

/** The opener toggles on press; its focus must not close the popover before that press ends. */
function useTriggerDismissal(
  shouldClose: PopoverProps['shouldCloseOnInteractOutside'],
  isNonModal: boolean,
) {
  const inTrigger = useContext(PopoverTriggerContext);
  const triggerRef = useSlottedContext(PopoverContext)?.triggerRef;
  const onOutside = (element: Element) => {
    if (triggerRef?.current?.contains(element)) return false;
    return shouldClose?.(element) ?? true;
  };
  return inTrigger && isNonModal ? onOutside : shouldClose;
}

function PopoverHeader({ title, showCloseButton, onClose }: PopoverHeaderProps) {
  const strings = useUiStrings();
  if (isEmptyNode(title) && !showCloseButton) return null;
  return (
    <div {...hooks.slot('header')}>
      {isEmptyNode(title) ? null : (
        <Heading slot="title" className={hooks.slotClass('title')}>
          {title}
        </Heading>
      )}
      {showCloseButton ? (
        <Button
          icon={CloseGlyph}
          label={strings.close}
          size="sm"
          className={hooks.slotClass('close')}
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}

/** Opens the `Popover` among its children when its trigger, such as a `Button`, is pressed. */
export function PopoverTrigger({ children, ...openState }: PopoverTriggerProps) {
  return (
    <DialogTrigger {...openState}>
      <PopoverTriggerContext value>{children}</PopoverTriggerContext>
    </DialogTrigger>
  );
}

const noTrigger: RefObject<Element | null> = { current: null };

interface ScrollGuardOptions {
  isOpen: boolean | undefined;
  onOpenChange: ((isOpen: boolean) => void) | undefined;
  triggerRef: RefObject<Element | null> | undefined;
  isNonModal: boolean;
}

/**
 * The open state a nonmodal panel hands React Aria, which ignores the closes `useScrollCloseGuard`
 * refuses: a queued scroll event of an ancestor that has not moved since the panel opened. React
 * Aria closes through the trigger's state inside a trigger and through `onOpenChange` otherwise, so
 * both are guarded.
 */
function usePanelState({ isOpen, onOpenChange, triggerRef, isNonModal }: ScrollGuardOptions) {
  const anchor = useSlottedContext(PopoverContext)?.triggerRef;
  return useScrollGuardedState({
    isOpen,
    onOpenChange,
    triggerRef: triggerRef ?? anchor ?? noTrigger,
    isGuarded: isNonModal,
    followsPage: false,
  });
}

/**
 * The floating panel the library's anchored overlays share: a React Aria popover on the `dropdown`
 * layer, with an optional arrow. It adds no hooks of its own; the caller passes them.
 */
export function PopoverPanel({
  ref,
  arrowClassName,
  isHint = false,
  children,
  style,
  isOpen,
  onOpenChange,
  ...rest
}: PopoverPanelProps) {
  const zIndex = useLayerZIndex('dropdown');
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const panelRefs = useMergedRefs(setPanel, ref);
  const gutter = usePopoverGutter(panel);
  const guarded = usePanelState({
    isOpen,
    onOpenChange,
    triggerRef: rest.triggerRef,
    isNonModal: rest.isNonModal ?? false,
  });
  return (
    <>
      {isHint ? null : (
        <PopoverPresence
          isOpen={isOpen}
          triggerRef={rest.triggerRef}
          onClose={() => onOpenChange?.(false)}
        />
      )}
      <OverlayTriggerStateContext value={guarded}>
        <AriaPopover
          {...rest}
          style={({ placement }) => ({
            ...style,
            zIndex,
            translate: placement === 'left' && gutter > 0 ? `${gutter}px 0` : style?.translate,
          })}
          ref={panelRefs}
        >
          {arrowClassName ? <OverlayArrow className={arrowClassName} /> : null}
          <FormBoundary>{children}</FormBoundary>
        </AriaPopover>
      </OverlayTriggerStateContext>
    </>
  );
}

/**
 * A dialog floating against its trigger: an optional title and close button, then the body, with an
 * optional arrow. Inside a `PopoverTrigger` it opens when the trigger is pressed; otherwise `isOpen`,
 * `onOpenChange` and `triggerRef` control it. Focus moves in on open, stays inside while open and
 * returns to the trigger on close; Escape and outside presses close it.
 */
export function Popover({
  title,
  showCloseButton = false,
  showArrow = false,
  offset,
  children,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...rest
}: PopoverProps) {
  const trigger = useContext(OverlayTriggerStateContext);
  const shouldCloseOnInteractOutside = useTriggerDismissal(
    rest.shouldCloseOnInteractOutside,
    rest.isNonModal === true,
  );
  // A controlled popover outside a trigger closes through its caller.
  const close = () => (rest.isOpen === undefined ? trigger?.close() : rest.onOpenChange?.(false));
  return (
    <PopoverPanel
      {...rest}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
      offset={offset ?? (showArrow ? POPOVER_ARROW_OFFSET : POPOVER_OFFSET)}
      {...hooks.root({ className, props: rest })}
      arrowClassName={showArrow ? hooks.slotClass('arrow') : undefined}
    >
      <PopoverTriggerContext value={false}>
        <Dialog
          id={id}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={hooks.slotClass('dialog')}
          // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element: an
          // Escape the content already handled stops there, before React Aria's popover closes.
          render={(props) => (
            <section
              {...props}
              onKeyDown={(event) => {
                stopConsumedEscape(event);
              }}
            />
          )}
        >
          <PopoverHeader title={title} showCloseButton={showCloseButton} onClose={close} />
          {children === undefined || children === null ? null : (
            <div {...hooks.slot('body')}>
              <HeadingLevelContext value={dialogTitleLevel}>
                {typeof children === 'function' ? children({ close }) : children}
              </HeadingLevelContext>
            </div>
          )}
        </Dialog>
      </PopoverTriggerContext>
    </PopoverPanel>
  );
}

export { PopoverPresence } from './popover-presence.js';
