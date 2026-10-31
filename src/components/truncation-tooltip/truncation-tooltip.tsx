'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
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
  useFocusVisible,
  type TooltipTriggerState,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { tabbableSelector } from '../../utils/tabbable.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { Button } from '../button/button.js';
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
  /** Draws a "Show more" control after cut text that shows it whole in place, then "Show less". */
  expandable?: boolean | undefined;
  /** Whether expandable text is shown whole (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether expandable text starts whole (uncontrolled). Defaults to `false`. */
  defaultExpanded?: boolean | undefined;
  /** Called with the requested state when the reader shows more or less. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

interface TruncationState extends TooltipTriggerState {
  /** Opens after `delay` milliseconds if the text is cut by then. */
  schedule: (delay: number) => void;
}

const hooks = createHooks('truncation-tooltip', ['panel', 'toggle']);

/** Whether an element's content is cut by its box (an inline ellipsis or a line clamp). */
function isTruncated(element: Element): boolean {
  return isOverflowing(element, 'horizontal') || isOverflowing(element, 'vertical');
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
 * Focus while the reader uses a pointer (a press, or focus a script moves after one) is not visible
 * focus and opens nothing, as React Aria's tooltips decide.
 */
function useFocusReveal(ref: RefObject<HTMLElement | null>, { open, close }: TruncationState) {
  const { isFocusVisible } = useFocusVisible();
  const isVisible = useRef(isFocusVisible);
  isVisible.current = isFocusVisible;
  useEffect(() => {
    const target = ref.current?.closest<HTMLElement>(tabbableSelector);
    if (!target) return;
    const onFocus = () => {
      if (isVisible.current) open();
    };
    const onBlur = () => close();
    target.addEventListener('focus', onFocus);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('focus', onFocus);
      target.removeEventListener('blur', onBlur);
    };
  }, [ref, open, close]);
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

/**
 * Whether the text in `ref` is cut, measured when it changes and on resize. Whole text is not
 * measured: it keeps the value it had before it was shown whole, which it returns to when cut again.
 */
function useIsCut(ref: RefObject<HTMLElement | null>, children: ReactNode, isWhole: boolean) {
  const [isCut, setCut] = useState(false);
  const measure = useCallback(() => {
    if (!isWhole) setCut(ref.current !== null && isTruncated(ref.current));
  }, [ref, isWhole]);
  useResizeObserver([ref], measure);
  useLayoutEffect(measure, [measure, children]);
  return isCut;
}

/** The "Show more" or "Show less" control of expandable text. */
function ExpandControl({
  isExpanded,
  textId,
  onPress,
}: {
  isExpanded: boolean;
  textId: string;
  onPress: () => void;
}) {
  const strings = useUiStrings();
  return (
    <Button
      variant="link"
      size="xs"
      className={hooks.slotClass('toggle')}
      aria-expanded={isExpanded}
      aria-controls={textId}
      onPress={onPress}
    >
      {isExpanded ? strings.showLess : strings.showMore}
    </Button>
  );
}

/** The text's pointer handlers: rest to open after `delay`, leave or press to close. */
function createPointerHandlers(state: TruncationState, delay: number) {
  const { schedule, close } = state;
  return {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') schedule(delay);
    },
    onPointerLeave: () => close(),
    onPointerDown: () => close(),
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
  expandable = false,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  className,
  ref: callerRef,
  ...rest
}: TruncationTooltipProps) {
  const [ref, setRef] = useForwardedRef(callerRef);
  const state = useTruncationState(ref);
  useFocusReveal(ref, state);
  useEscapeToClose(state);
  const pointerHandlers = createPointerHandlers(state, delay);
  const [expanded, setExpanded] = useControllableState(
    isExpanded,
    defaultExpanded,
    onExpandedChange,
  );
  const isWhole = expandable && expanded;
  const isCut = useIsCut(ref, children, isWhole);
  const textId = `${useId()}-text`;
  const id = rest.id ?? (expandable ? textId : undefined);

  return (
    <>
      <span
        {...rest}
        id={id}
        {...hooks.root({ className, data: { expanded: isWhole } })}
        {...pointerHandlers}
        ref={setRef}
      >
        {children}
      </span>
      {expandable && (isWhole || isCut) ? (
        <ExpandControl
          isExpanded={isWhole}
          textId={id ?? textId}
          onPress={() => {
            state.close();
            setExpanded(!isWhole);
          }}
        />
      ) : null}
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
