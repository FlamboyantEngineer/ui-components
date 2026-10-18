import type { KeyboardEvent, ReactNode } from 'react';
import {
  Heading,
  Sheet,
  SheetBackdrop,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
  type SheetOverlayProps,
  type SheetTriggerProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useLayerZIndex } from '../portal/portal.js';

/** The trigger and drawer pair: React Aria's `SheetTrigger` open state. */
export type DrawerTriggerProps = SheetTriggerProps;

/** The viewport edge the drawer slides in from; `start` and `end` follow the reading direction. */
export type DrawerPosition = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';

/** The drawer's extent away from its edge, which the host stylesheet maps to a length. */
export type DrawerSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface DrawerRenderProps {
  /** Closes the drawer. */
  close: () => void;
}

export interface DrawerProps
  // The overlay holds React Aria's swipe geometry, so its element is not swappable.
  extends
    Omit<SheetOverlayProps, 'className' | 'style' | 'children' | 'render' | 'position'>,
    BaseProps {
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
  /** Whether a press outside the drawer closes it. Defaults to true. */
  isDismissable?: boolean | undefined;
  /** Keeps Escape from closing the drawer. */
  isKeyboardDismissDisabled?: boolean | undefined;
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
        <IconButton
          icon="close"
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
export function DrawerTrigger(props: DrawerTriggerProps) {
  return <SheetTrigger {...props} />;
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
  preventDismissal = false,
  id,
  className,
  ...rest
}: DrawerProps) {
  const zIndex = useLayerZIndex('drawer');
  // React Aria's sheet offers no keyboard-only refusal, so a refused Escape stops at the dialog.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !isKeyboardDismissDisabled) return;
    event.stopPropagation();
    event.preventDefault();
  };
  return (
    <SheetOverlay
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      position={position}
      preventDismissal={preventDismissal}
      shouldCloseOnInteractOutside={(element) =>
        isDismissable && (shouldCloseOnInteractOutside?.(element) ?? true)
      }
      style={{ zIndex }}
    >
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
                isDisabled={preventDismissal}
                onClose={close}
              />
              {children === undefined || children === null ? null : (
                <div {...hooks.slot('body')}>
                  {typeof children === 'function' ? children({ close }) : children}
                </div>
              )}
              {isEmptyNode(footer) ? null : <div {...hooks.slot('footer')}>{footer}</div>}
            </>
          )}
        </SheetContent>
      </Sheet>
    </SheetOverlay>
  );
}
