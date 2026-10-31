'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { useLayerZIndex, usePortalTarget } from '../portal/portal.js';
import type { TooltipPlacement, TooltipRelationship, TooltipVariant } from './tooltip.js';

/** A rectangle in viewport pixels, as `getBoundingClientRect` returns it. */
export interface TooltipRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A place with no element of its own, such as a text range or a region of a canvas: its rectangle
 * is read again at each opening, scroll and resize, so it may move.
 */
export interface TooltipVirtualAnchor {
  getBoundingClientRect(): TooltipRect;
}

/** What an anchored tooltip points at: an element the caller owns, a ref to one, or a rectangle. */
export type TooltipAnchor = Element | RefObject<Element | null> | TooltipVirtualAnchor;

/**
 * How the hint relates to an element anchor while open: `description` adds the panel to the
 * element's `aria-describedby`, `label` to its `aria-labelledby`, and `none` shows the hint only
 * visually, hidden from assistive technology, for a hint that repeats a name already there.
 */
export type AnchoredTooltipRelationship = TooltipRelationship | 'none';

export interface AnchoredTooltipProps extends BaseProps {
  /** Shows the hint. The caller owns the state: nothing in the tooltip opens or closes it. */
  isOpen: boolean;
  /** The element or rectangle the hint points at; with none, or a detached element, nothing shows. */
  anchor: TooltipAnchor | null | undefined;
  /** The hint. Plain text or inline content; never interactive. */
  content: ReactNode;
  /** `default` for a hint on a control, `info` for a softer explanatory note. Defaults to `default`. */
  variant?: TooltipVariant | undefined;
  /** Preferred side of the anchor. Defaults to `top`; the hint flips when it does not fit. */
  placement?: TooltipPlacement | undefined;
  /** Defaults to `description`. A rectangle anchor has no element to relate, so it takes none. */
  relationship?: AnchoredTooltipRelationship | undefined;
}

type RelatedAttribute = 'aria-describedby' | 'aria-labelledby';

const hooks = createHooks('tooltip', ['arrow', 'content']);

/** The gap between the panel and its anchor, room for the arrow, in pixels. */
const tooltipOffset = 8;

function isVirtualAnchor(anchor: TooltipAnchor): anchor is TooltipVirtualAnchor {
  return !(anchor instanceof Element) && !('current' in anchor);
}

/** The anchor's element, or `null` for a rectangle, a missing anchor or a detached element. */
function resolveElement(anchor: TooltipAnchor | null | undefined): Element | null {
  if (!anchor || isVirtualAnchor(anchor)) return null;
  const element = anchor instanceof Element ? anchor : anchor.current;
  return element?.isConnected ? element : null;
}

/** Adds `id` to an attribute's id list and returns the function that takes it out again. */
function addIdToken(element: Element, attribute: RelatedAttribute, id: string): () => void {
  const tokens = (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
  if (!tokens.includes(id)) element.setAttribute(attribute, [...tokens, id].join(' '));
  return () => {
    const rest = (element.getAttribute(attribute) ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== id);
    if (rest.length > 0) element.setAttribute(attribute, rest.join(' '));
    else element.removeAttribute(attribute);
  };
}

/**
 * The element the panel is positioned against, read once committed, since a ref is set during
 * the commit; `null` while closed, for a rectangle, and for an element that left the page.
 */
function useAnchorElement(anchor: TooltipAnchor | null | undefined, isOpen: boolean) {
  const [element, setElement] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setElement(isOpen ? resolveElement(anchor) : null);
  }, [anchor, isOpen]);
  return element;
}

/** While open, relates the anchor element to the panel by `id`, and undoes it on close or unmount. */
function useAnchorRelationship(
  element: Element | null,
  { id, relationship }: { id: string; relationship: AnchoredTooltipRelationship },
) {
  useLayoutEffect(() => {
    if (!element || relationship === 'none') return undefined;
    const attribute = relationship === 'label' ? 'aria-labelledby' : 'aria-describedby';
    return addIdToken(element, attribute, id);
  }, [element, id, relationship]);
}

/** Places the panel again on every scroll while it is open, so it follows its anchor. */
function useFollowScroll(isOpen: boolean, updatePosition: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    let frame: number | undefined;
    const onScroll = () => {
      frame ??= requestAnimationFrame(() => {
        frame = undefined;
        updatePosition();
      });
    };
    const options = { capture: true, passive: true };
    window.addEventListener('scroll', onScroll, options);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, options);
    };
  }, [isOpen, updatePosition]);
}

/** The rectangle of a virtual anchor as the positioning reads it. */
function toDomRect(anchor: TooltipVirtualAnchor): DOMRect {
  const { left, top, width, height } = anchor.getBoundingClientRect();
  return new DOMRect(left, top, width, height);
}

/**
 * Where the panel goes: the anchor element or rectangle, whether the panel shows, its enter and
 * exit phase, and its position against the anchor, which follows scrolling and resizing.
 */
function useAnchoredPanel({
  anchor,
  isOpen,
  placement,
}: Required<Pick<AnchoredTooltipProps, 'anchor' | 'isOpen' | 'placement'>>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const proxyRef = useRef<HTMLSpanElement>(null);
  const element = useAnchorElement(anchor, isOpen);
  const virtual = anchor && isVirtualAnchor(anchor) ? anchor : null;
  const isShown = isOpen && (element !== null || virtual !== null);
  const elementRef = useMemo(() => ({ current: element }), [element]);
  const phase = useEnterExit(panelRef, isShown);
  const position = useOverlayPosition({
    placement,
    targetRef: virtual ? proxyRef : elementRef,
    overlayRef: panelRef,
    arrowRef,
    offset: tooltipOffset,
    isOpen: isShown,
    getTargetRect: virtual ? () => toDomRect(virtual) : undefined,
  });
  useFollowScroll(isShown, position.updatePosition);
  return {
    refs: { panel: panelRef, arrow: arrowRef, proxy: virtual ? proxyRef : null },
    element: isShown ? element : null,
    phase,
    position,
  };
}

/**
 * The arrow's place, as React Aria's `OverlayArrow` sets it: out of the panel's flow, on the side
 * facing the anchor, centred on the offset the positioning measures.
 */
function arrowStyle(
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center' | undefined,
  measured: CSSProperties | undefined,
): CSSProperties {
  const isVertical = placement === 'top' || placement === 'bottom';
  const side = placement === 'center' ? undefined : placement;
  return {
    position: 'absolute',
    transform: isVertical ? 'translateX(-50%)' : 'translateY(-50%)',
    ...(side ? { [side]: '100%' } : {}),
    ...measured,
  };
}

/**
 * A tooltip the caller opens and closes, pointing at an element it already owns (an element or a
 * ref, an SVG element included) or at a rectangle, without a trigger of its own. It shares the
 * child-trigger `Tooltip`'s panel, hooks, placement and flipping, follows its anchor through
 * scrolling and resizing, and relates the panel to an element anchor while open.
 */
export function AnchoredTooltip({
  isOpen,
  anchor,
  content,
  variant = 'default',
  placement = 'top',
  relationship = 'description',
  className,
  id: callerId,
  ...rest
}: AnchoredTooltipProps) {
  const generatedId = useId();
  const id = callerId ?? generatedId;
  const { refs, element, phase, position } = useAnchoredPanel({ anchor, isOpen, placement });
  const zIndex = useLayerZIndex('tooltip');
  useAnchorRelationship(element, { id, relationship });
  const target = usePortalTarget();
  if (!phase.isMounted || !target) return null;
  const resolvedPlacement = position.placement ?? undefined;
  const data = { variant, placement: resolvedPlacement };
  // Straight into the container, as React Aria's own tooltip: a `Portal` wrapper, which has no size,
  // would become the containing block the positioning measures against.
  return createPortal(
    <>
      {refs.proxy ? <span ref={refs.proxy} hidden /> : null}
      <div
        {...rest}
        {...hooks.root({
          className,
          props: rest,
          data: { ...data, entering: phase.isEntering, exiting: phase.isExiting },
        })}
        ref={refs.panel}
        id={id}
        role="tooltip"
        aria-hidden={relationship === 'none' || undefined}
        style={{ ...position.overlayProps.style, zIndex }}
      >
        <span
          {...position.arrowProps}
          style={arrowStyle(resolvedPlacement, position.arrowProps.style)}
          {...hooks.slot('arrow', { placement: resolvedPlacement })}
          ref={refs.arrow}
        />
        <span {...hooks.slot('content')}>{content}</span>
      </div>
    </>,
    target,
  );
}
