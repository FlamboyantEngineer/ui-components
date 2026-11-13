'use client';

import {
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusVisible } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { TOOLTIP_DELAY } from '../../utils/overlay-defaults.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { tabbableSelector } from '../../utils/tabbable.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useLatest } from '../../utils/use-latest.js';
import { useLayoutChanges } from '../../utils/use-layout-changes.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { Button } from '../button/button.js';
import {
  ManualTooltip,
  type ManualTooltipState,
  type TooltipPlacement,
  useManualTooltipState,
} from '../tooltip/tooltip.js';

/** The pointer handlers the component owns on its text. */
type TruncationPointerHandler = 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown';

export interface TruncationTooltipProps
  extends Omit<ContainerProps<'span'>, 'children' | TruncationPointerHandler>, BaseProps {
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

const hooks = createHooks('truncation-tooltip', ['panel', 'toggle']);

/** Whether an element's content is cut by its box (an inline ellipsis or a line clamp). */
function isTruncated(element: Element): boolean {
  return isOverflowing(element, 'horizontal') || isOverflowing(element, 'vertical');
}

/**
 * Opens on keyboard focus of the nearest focusable element holding the text and closes on its blur.
 * Focus while the reader uses a pointer (a press, or focus a script moves after one) is not visible
 * focus and opens nothing, as React Aria's tooltips decide.
 */
function useFocusReveal(ref: RefObject<HTMLElement | null>, { open, close }: ManualTooltipState) {
  const { isFocusVisible } = useFocusVisible();
  const isVisible = useLatest(isFocusVisible);
  useEffect(() => {
    const target = ref.current?.closest<HTMLElement>(tabbableSelector);
    if (!target) return;
    const onFocus = () => {
      if (isVisible.current) open(true);
    };
    const onBlur = () => close();
    target.addEventListener('focus', onFocus);
    target.addEventListener('blur', onBlur);
    return () => {
      target.removeEventListener('focus', onFocus);
      target.removeEventListener('blur', onBlur);
    };
  }, [ref, open, close, isVisible]);
}

/**
 * Closes on Escape while the tooltip is open, without consuming the key, so a field, menu or dialog
 * around the text still applies its own Escape. An Escape that belongs to an input method's
 * composition, or that something already handled, is left alone.
 */
function useEscapeToClose({ isOpen, close }: ManualTooltipState, ref: RefObject<Element | null>) {
  useEffect(() => {
    if (!isOpen) return;
    const owner = getOwnerDocument(ref.current);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isComposingKey(event)) return;
      // Closing synchronously takes React Aria's own Escape listener away before the key reaches it.
      flushSync(close);
    };
    owner.addEventListener('keydown', onKeyDown, true);
    return () => owner.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, close, ref]);
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
  // A child re-rendering its own text, or a late font, cuts the text without resizing the box.
  useLayoutChanges(ref, measure);
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

/**
 * The panel's copy of the text: an inert, hidden copy of the page's elements without their ids, so
 * the panel keeps the text's markup (such as its direction) but owns no second instance of the
 * children's ids, refs or focusable controls.
 */
function PanelText({
  sourceRef,
  children,
}: {
  sourceRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const copyRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const copy = copyRef.current;
    const source = sourceRef.current;
    if (!copy || !source) return;
    copy.replaceChildren(...Array.from(source.childNodes, (node) => node.cloneNode(true)));
    for (const element of copy.querySelectorAll('[id]')) element.removeAttribute('id');
  }, [sourceRef, children]);
  return <span ref={copyRef} aria-hidden="true" inert />;
}

/** The text's pointer handlers: rest to open after `delay`, leave or press to close. */
function createPointerHandlers(state: ManualTooltipState, delay: number) {
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
  const state = useManualTooltipState(() => ref.current !== null && isTruncated(ref.current));
  useFocusReveal(ref, state);
  useEscapeToClose(state, ref);
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
      {/* Without trigger props the panel is isolated from an enclosing tooltip trigger. */}
      <ManualTooltip
        state={state}
        triggerRef={ref}
        className={hooks.slotClass('panel')}
        placement={placement}
      >
        <PanelText sourceRef={ref}>{children}</PanelText>
      </ManualTooltip>
    </>
  );
}
