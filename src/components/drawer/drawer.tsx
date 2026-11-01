'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import {
  Heading,
  DialogContext,
  Sheet,
  SheetBackdrop,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
  useSlottedContext,
} from '../../primitives/index.js';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { stopConsumedEscape } from '../../utils/consumed-escape.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { DialogEnteringContext } from '../../utils/dialog-entering.js';
import {
  OverlayLayerScope,
  useLayerZIndex,
  usePortalContainer,
  useStackedLayer,
} from '../portal/portal.js';
import { AvailableLoadingBoundary, useHoldFocusOnLeave } from '../../core/loading-boundary.js';
import { getDeepActiveElement } from '../../utils/focus-target.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { isHTMLElement } from '../../utils/is-element.js';
import type { OverlayLayer } from '../portal/layers.js';
import { HeadingLevelContext, dialogTitleLevel } from '../../core/heading-level.js';
import { FormBoundary } from '../../utils/form-boundary.js';

/** A pressable trigger and the `Drawer` it opens. */
export interface DrawerTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `Drawer`. */
  children: ReactNode;
}

/** The viewport edge the drawer slides in from; `start` and `end` follow the reading direction. */
export type DrawerPosition = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';

/** The way a swipe dismisses the drawer: toward an edge, or either way along an axis. */
export type DrawerSwipeDirection = DrawerPosition | 'vertical' | 'horizontal';

/** The drawer's extent away from its edge, which the host stylesheet maps to a length. */
export type DrawerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface DrawerRenderProps {
  /** Closes the drawer. */
  close: () => void;
}

// The overlay holds the sheet's swipe geometry, so its element is not swappable.
export interface DrawerProps extends OpenStateProps, OverlayDismissProps, BaseProps {
  /** The edge it slides in from. Defaults to `end`. */
  position?: DrawerPosition | undefined;
  /** Defaults to `md`. */
  size?: DrawerSize | undefined;
  /** The heading, which names the dialog. */
  title: ReactNode;
  /** Shows a close button in the header. */
  showCloseButton?: boolean | undefined;
  /** Content at the bottom of the drawer, such as its actions. */
  footer?: ReactNode;
  /** The body; a function receives `close`. */
  children?: ReactNode | ((renderProps: DrawerRenderProps) => ReactNode);
  /** The direction a swipe dismisses it. Defaults to its `position`. */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * Amounts of the panel left visible that it rests at, opening at the first: pixels, or
   * percentages of the panel such as `'50%'`.
   */
  snapPoints?: ReadonlyArray<number | string> | undefined;
  /** Refuses Escape, outside presses, swiping it away and the close button. */
  isDismissDisabled?: boolean | undefined;
  /**
   * The overlay layer, which sets the z-index. Defaults to `drawer`, raised to the layer of the
   * overlay it is rendered in, such as a modal's, when that one stacks higher.
   */
  layer?: OverlayLayer | undefined;
}

interface DrawerHeaderProps extends Pick<DrawerProps, 'title' | 'showCloseButton'> {
  isDisabled: boolean;
  onClose: () => void;
}

const hooks = createHooks('drawer', [
  'backdrop',
  'panel',
  'dialog',
  'header',
  'title',
  'close',
  'body',
  'footer',
]);

function DrawerHeader({ title, showCloseButton, isDisabled, onClose }: DrawerHeaderProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      <Heading slot="title" className={hooks.slotClass('title')}>
        {title}
      </Heading>
      {showCloseButton ? (
        <Button
          icon={CloseGlyph}
          label={strings.close}
          className={hooks.slotClass('close')}
          isDisabled={isDisabled}
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}

/** Opens the `Drawer` among its children when its trigger, such as a `Button`, is pressed. */
export function DrawerTrigger({ children, ...openState }: DrawerTriggerProps) {
  return <SheetTrigger {...openState}>{children}</SheetTrigger>;
}

/**
 * What a drawer gives its content while it shows: the sheet's entrance as React Aria defers it for
 * the dialog (until the panel has slid in), so a field with `autoFocus` waits for it too, and an
 * available loading boundary. Closing while the content it was opened from loads, focus waits on
 * that content's boundary to return to the opener.
 */
function DrawerOpening({
  overlayRef,
  children,
}: {
  overlayRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const dialog = useSlottedContext(DialogContext);
  const container = usePortalContainer();
  const [opener] = useState(() => getDeepActiveElement(getOwnerDocument(container)));
  useHoldFocusOnLeave(
    () => overlayRef.current,
    () => (isHTMLElement(opener) ? opener : null),
  );
  return (
    <DialogEnteringContext value={dialog?.isEntering ?? false}>
      <AvailableLoadingBoundary>{children}</AvailableLoadingBoundary>
    </DialogEnteringContext>
  );
}

/**
 * A panel that slides in from an edge of the viewport over a page it blocks (React Aria `Sheet`):
 * a title, an optional close button, the body and a footer. Focus moves in once it has entered and
 * stays inside; Escape, an outside press and a swipe toward its edge close it, and focus returns to
 * the trigger. Snap points, swipe directions and nested drawers come from React Aria.
 */
export function Drawer({
  position = 'end',
  size = 'md',
  title,
  showCloseButton = false,
  footer,
  children,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  shouldCloseOnInteractOutside,
  isDismissDisabled = false,
  snapPoints,
  layer,
  id,
  className,
  ...rest
}: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const stackedLayer = useStackedLayer('drawer');
  const resolvedLayer = layer ?? stackedLayer;
  const zIndex = useLayerZIndex(resolvedLayer);
  // React Aria's sheet offers no keyboard-only refusal, so a refused Escape stops at the dialog, as
  // does one the content already handled.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (stopConsumedEscape(event)) return;
    if (event.key !== 'Escape' || !isKeyboardDismissDisabled) return;
    event.stopPropagation();
    event.preventDefault();
  };
  return (
    <SheetOverlay
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      position={position}
      snapPoints={snapPoints ? [...snapPoints] : undefined}
      preventDismissal={isDismissDisabled}
      shouldCloseOnInteractOutside={(element) =>
        isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true)
      }
      style={{ zIndex }}
      ref={overlayRef}
    >
      <DrawerOpening overlayRef={overlayRef}>
        <SheetBackdrop className={hooks.slotClass('backdrop')} />
        <Sheet className={hooks.slotClass('panel')}>
          <SheetContent
            id={id}
            className={hooks.slotClass('dialog')}
            // React Aria's Dialog forwards no keyboard handlers, so the listener goes on its element.
            render={(props) => <section {...props} onKeyDown={onKeyDown} />}
          >
            {({ close }) => (
              <>
                <DrawerHeader
                  title={title}
                  showCloseButton={showCloseButton}
                  isDisabled={isDismissDisabled}
                  onClose={close}
                />
                {children === undefined || children === null ? null : (
                  <div {...hooks.slot('body')}>
                    <OverlayLayerScope layer={resolvedLayer}>
                      <HeadingLevelContext value={dialogTitleLevel}>
                        <FormBoundary>
                          {typeof children === 'function' ? children({ close }) : children}
                        </FormBoundary>
                      </HeadingLevelContext>
                    </OverlayLayerScope>
                  </div>
                )}
                {isEmptyNode(footer) ? null : <div {...hooks.slot('footer')}>{footer}</div>}
              </>
            )}
          </SheetContent>
        </Sheet>
      </DrawerOpening>
    </SheetOverlay>
  );
}
