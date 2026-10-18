import { useContext, type ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  OverlayTriggerStateContext,
  Popover as AriaPopover,
  type DialogTriggerProps,
  type PopoverProps as AriaPopoverProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useLayerZIndex } from '../portal/portal.js';

/** The trigger and popover pair: React Aria's `DialogTrigger` open state. */
export type PopoverTriggerProps = DialogTriggerProps;

/** A floating panel against a trigger (React Aria `Popover`), carrying the caller's hooks. */
export interface PopoverPanelProps
  extends Omit<AriaPopoverProps, 'className' | 'style' | 'children'>, BaseProps {
  /** The arrow's hook class; when given, an arrow pointing at the trigger leads the panel. */
  arrowClassName?: string | undefined;
  children: ReactNode;
}

export interface PopoverRenderProps {
  /** Closes the popover. */
  close: () => void;
}

export interface PopoverProps
  extends Omit<AriaPopoverProps, 'className' | 'style' | 'children' | 'defaultOpen'>, BaseProps {
  /** The heading, which also names the dialog unless `aria-label` or `aria-labelledby` is given. */
  title?: ReactNode;
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
        <IconButton
          icon="close"
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
export function PopoverTrigger(props: PopoverTriggerProps) {
  return <DialogTrigger {...props} />;
}

/**
 * The floating panel the library's anchored overlays share: a React Aria popover on the `dropdown`
 * layer, with an optional arrow. It adds no hooks of its own; the caller passes them.
 */
export function PopoverPanel({ arrowClassName, children, ...rest }: PopoverPanelProps) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <AriaPopover {...rest} style={{ zIndex }}>
      {arrowClassName ? <OverlayArrow className={arrowClassName} /> : null}
      {children}
    </AriaPopover>
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
  children,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...rest
}: PopoverProps) {
  const trigger = useContext(OverlayTriggerStateContext);
  // A controlled popover outside a trigger closes through its caller.
  const close = () => (rest.isOpen === undefined ? trigger?.close() : rest.onOpenChange?.(false));
  return (
    <PopoverPanel
      {...rest}
      {...hooks.root({ className, props: rest })}
      arrowClassName={showArrow ? hooks.slotClass('arrow') : undefined}
    >
      <Dialog
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={hooks.slotClass('dialog')}
      >
        <PopoverHeader title={title} showCloseButton={showCloseButton} onClose={close} />
        {children === undefined || children === null ? null : (
          <div {...hooks.slot('body')}>
            {typeof children === 'function' ? children({ close }) : children}
          </div>
        )}
      </Dialog>
    </PopoverPanel>
  );
}
