import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  TooltipContext,
  TooltipTriggerStateContext,
  type TooltipTriggerState,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { TOOLTIP_DELAY, TooltipPanel, type TooltipPlacement } from '../tooltip/tooltip.js';

export interface TruncationTooltipProps {
  /** The text. The stylesheet cuts it (ellipsis or line clamp); the tooltip shows it whole. */
  children: ReactNode;
  /** Preferred side of the text. Defaults to `top`; the tooltip flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
  /** Hover delay before the tooltip opens, in milliseconds. Keyboard focus opens it at once. */
  delay?: number | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('truncation-tooltip', ['panel']);

/** Elements that take focus; keyboard focus on the nearest one holding the text reveals the tooltip. */
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

/** Whether an element's content is cut by its box (an inline ellipsis or a line clamp). */
function isTruncated(element: Element): boolean {
  return (
    element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1
  );
}

/**
 * Text that shows its full content in a tooltip only while the stylesheet cuts it short. The
 * tooltip is visual: the text is already in the page, so nothing new is announced.
 */
export function TruncationTooltip({
  children,
  placement = 'top',
  delay = TOOLTIP_DELAY,
  className,
  id,
  ...rest
}: TruncationTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pressed = useRef(false);
  const [isOpen, setOpen] = useState(false);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const reveal = useCallback(() => {
    cancel();
    if (ref.current && isTruncated(ref.current)) setOpen(true);
  }, [cancel]);
  const hide = useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  // The panel reads its open state from React Aria's trigger state, which this component drives.
  const state = useMemo<TooltipTriggerState>(
    () => ({ isOpen, shouldSkipAnimation: false, open: reveal, close: hide }),
    [isOpen, reveal, hide],
  );

  useEffect(() => {
    const target = ref.current?.closest<HTMLElement>(FOCUSABLE);
    if (!target) return;
    // Focus that follows a press on the element is pointer focus; any other focus is keyboard focus.
    const onPointerDown = () => {
      pressed.current = true;
    };
    const onFocus = () => {
      if (!pressed.current) reveal();
    };
    const onBlur = () => {
      pressed.current = false;
      hide();
    };
    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('focus', onFocus);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('focus', onFocus);
      target.removeEventListener('blur', onBlur);
    };
  }, [reveal, hide]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      hide();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, hide]);

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    cancel();
    timer.current = setTimeout(reveal, delay);
  };
  const onPointerLeave = () => {
    pressed.current = false;
    hide();
  };
  const onPointerDown = () => {
    pressed.current = true;
    hide();
  };

  return (
    <>
      <span
        {...hooks.root({ className, props: rest })}
        ref={ref}
        id={id}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      >
        {children}
      </span>
      {/* Isolate the panel from an enclosing tooltip trigger, such as a button with a hint. */}
      <TooltipContext.Provider value={null}>
        <TooltipTriggerStateContext.Provider value={state}>
          <TooltipPanel
            variant="default"
            className={hooks.slotClass('panel')}
            triggerRef={ref}
            placement={placement}
          >
            {children}
          </TooltipPanel>
        </TooltipTriggerStateContext.Provider>
      </TooltipContext.Provider>
    </>
  );
}
