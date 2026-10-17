import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  TooltipContext,
  TooltipTriggerStateContext,
  type TooltipTriggerState,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { TOOLTIP_DELAY, TooltipPanel, type TooltipPlacement } from '../tooltip/tooltip.js';

/** The pointer handlers the component owns on its text. */
type TruncationPointerHandler = 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown';

export interface TruncationTooltipProps
  extends Omit<NativeProps<'span'>, 'children' | TruncationPointerHandler>, BaseProps {
  /** The text. The stylesheet cuts it (ellipsis or line clamp); the tooltip shows it whole. */
  children: ReactNode;
  /** Preferred side of the text. Defaults to `top`; the tooltip flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
  /** Hover delay before the tooltip opens, in milliseconds. Keyboard focus opens it at once. */
  delay?: number | undefined;
}

interface TruncationState extends TooltipTriggerState {
  /** Opens after `delay` milliseconds if the text is cut by then. */
  schedule: (delay: number) => void;
}

const hooks = createHooks('truncation-tooltip', ['panel']);

/** Elements that take focus; keyboard focus on the nearest one holding the text reveals the tooltip. */
const focusableSelector =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

/** Whether an element's content is cut by its box (an inline ellipsis or a line clamp). */
function isTruncated(element: Element): boolean {
  return (
    element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1
  );
}

/** React Aria tooltip trigger state that opens only while the text in `ref` is cut. */
function useTruncationState(ref: RefObject<HTMLElement | null>): TruncationState {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useState(false);
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const open = useCallback(() => {
    cancel();
    if (ref.current && isTruncated(ref.current)) setOpen(true);
  }, [cancel, ref]);
  const close = useCallback(() => {
    cancel();
    setOpen(false);
  }, [cancel]);
  const schedule = useCallback(
    (delay: number) => {
      cancel();
      timer.current = setTimeout(open, delay);
    },
    [cancel, open],
  );
  useEffect(() => cancel, [cancel]);
  return useMemo(
    () => ({ isOpen, shouldSkipAnimation: false, open, close, schedule }),
    [isOpen, open, close, schedule],
  );
}

/**
 * Opens on keyboard focus of the nearest focusable element holding the text and closes on its blur.
 * Focus that follows a press on that element is pointer focus and opens nothing.
 */
function useFocusReveal(
  ref: RefObject<HTMLElement | null>,
  pressed: RefObject<boolean>,
  { open, close }: TruncationState,
) {
  useEffect(() => {
    const target = ref.current?.closest<HTMLElement>(focusableSelector);
    if (!target) return;
    const onPointerDown = () => {
      pressed.current = true;
    };
    const onFocus = () => {
      if (!pressed.current) open();
    };
    const onBlur = () => {
      pressed.current = false;
      close();
    };
    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('focus', onFocus);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('focus', onFocus);
      target.removeEventListener('blur', onBlur);
    };
  }, [ref, pressed, open, close]);
}

/** Closes on Escape, consuming the key only while the tooltip is open. */
function useEscapeToClose({ isOpen, close }: TruncationState) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, close]);
}

/** The text's pointer handlers: rest to open after `delay`, leave or press to close. */
function createPointerHandlers(pressed: RefObject<boolean>, state: TruncationState, delay: number) {
  const { schedule, close } = state;
  return {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') schedule(delay);
    },
    onPointerLeave: () => {
      pressed.current = false;
      close();
    },
    onPointerDown: () => {
      pressed.current = true;
      close();
    },
  };
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
  ref: callerRef,
  ...rest
}: TruncationTooltipProps) {
  const [ref, setRef] = useForwardedRef(callerRef);
  const pressed = useRef(false);
  const state = useTruncationState(ref);
  useFocusReveal(ref, pressed, state);
  useEscapeToClose(state);
  const pointerHandlers = createPointerHandlers(pressed, state, delay);

  return (
    <>
      <span {...rest} {...hooks.root({ className })} {...pointerHandlers} ref={setRef}>
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
