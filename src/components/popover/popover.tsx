import { useContext, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  OverlayTriggerStateContext,
  Popover as AriaPopover,
} from '../../primitives/index.js';
import type {
  OpenStateProps,
  OverlayDismissProps,
  OverlayPositionProps,
} from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { usePopoverGutter } from './use-popover-gutter.js';

/** A pressable trigger and the `Popover` it opens. */
export interface PopoverTriggerProps extends OpenStateProps {
  /** The trigger (a `Button` or another pressable), then its `Popover`. */
  children: ReactNode;
}

/** The floating panel the library's anchored overlays share, carrying the caller's hooks. */
export interface PopoverPanelProps
  extends
    BaseProps,
    OverlayPositionProps,
    Omit<OverlayDismissProps, 'isDismissable'>,
    Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
  /** The element it is placed against, outside a trigger or instead of the trigger. */
  triggerRef?: RefObject<Element | null> | undefined;
  /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
  isNonModal?: boolean | undefined;
  /** The arrow's hook class; when given, an arrow pointing at the trigger leads the panel. */
  arrowClassName?: string | undefined;
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
export function PopoverTrigger({ children, ...openState }: PopoverTriggerProps) {
  return <DialogTrigger {...openState}>{children}</DialogTrigger>;
}

/**
 * The floating panel the library's anchored overlays share: a React Aria popover on the `dropdown`
 * layer, with an optional arrow. It adds no hooks of its own; the caller passes them.
 */
export function PopoverPanel({ arrowClassName, children, style, ...rest }: PopoverPanelProps) {
  const zIndex = useLayerZIndex('dropdown');
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const gutter = usePopoverGutter(panel);
  return (
    <AriaPopover
      {...rest}
      style={({ placement }) => ({
        ...style,
        zIndex,
        translate: placement === 'left' && gutter > 0 ? `${gutter}px 0` : style?.translate,
      })}
      ref={setPanel}
    >
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
  offset,
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
      offset={offset ?? (showArrow ? 7 : 8)}
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
