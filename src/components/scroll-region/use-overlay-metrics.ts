'use client';

import { findMaximum } from '../../utils/find-maximum.js';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { observeViewport } from './observe-viewport.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';

/** Registers a sticky header to keep the vertical thumb below; returns its unregistration. */
export type HeaderRegistration = (element: HTMLElement | null) => (() => void) | undefined;

/** The viewport's measured geometry, as the overlay scrollbars draw it. */
export interface OverlayMetrics {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  top: number;
  /** The horizontal scroll position from the left edge, also in right-to-left viewports. */
  left: number;
  /** The tallest registered header. */
  header: number;
  rtl: boolean;
  /** Empty height below content shorter than the viewport. */
  lift: number;
  trackX: number;
  trackY: number;
}

interface OverlayMetricsOptions {
  viewport: RefObject<HTMLElement | null>;
  /** Overlay mode is on; otherwise nothing is measured. */
  enabled: boolean;
  /** Measure registered headers and keep the vertical thumb below them. */
  headerInset: boolean;
}

export interface OverlayMeasurement {
  metrics: OverlayMetrics;
  /** Schedules a measurement for the next animation frame. */
  schedule: () => void;
  /** Header registration, when header insets are on. */
  registerHeader: HeaderRegistration | undefined;
  verticalTrackRef: (element: HTMLElement | null) => void;
  horizontalTrackRef: (element: HTMLElement | null) => void;
}

interface Tracks {
  x: HTMLElement | null;
  y: HTMLElement | null;
}

const emptyMetrics: OverlayMetrics = {
  width: 0,
  height: 0,
  contentWidth: 0,
  contentHeight: 0,
  top: 0,
  left: 0,
  header: 0,
  rtl: false,
  lift: 0,
  trackX: 0,
  trackY: 0,
};

/** Space below content shorter than the viewport, which the horizontal thumb rises over. */
function measureLift(element: HTMLElement): number {
  if (element.scrollHeight > element.clientHeight + 1 || element.children.length === 0) return 0;
  const top = element.getBoundingClientRect().top;
  const bottom = findMaximum(
    element.children,
    (child) => child.getBoundingClientRect().bottom - top,
    0,
  );
  return Math.max(0, Math.floor(element.clientHeight - bottom));
}

function measureHeaders(headers: Iterable<HTMLElement>): number {
  return findMaximum(headers, (header) => header.getBoundingClientRect().height, 0);
}

function readMetrics(element: HTMLElement, tracks: Tracks, header: number): OverlayMetrics {
  const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
  return {
    width: element.clientWidth,
    height: element.clientHeight,
    contentWidth: element.scrollWidth,
    contentHeight: element.scrollHeight,
    top: element.scrollTop,
    // Right-to-left positions run from 0 down to the negative range; measure from the left.
    left: rtl ? element.scrollWidth - element.clientWidth + element.scrollLeft : element.scrollLeft,
    header,
    rtl,
    lift: measureLift(element),
    trackX: tracks.x?.clientWidth ?? 0,
    trackY: tracks.y?.clientHeight ?? 0,
  };
}

/**
 * Measures a natively scrolling viewport for overlay thumbs: its size, content size and position,
 * its registered headers and the tracks the stylesheet places. Re-measures once per animation frame
 * when any of them resizes, the content changes or `schedule` is called.
 */
export function useOverlayMetrics({
  viewport,
  enabled,
  headerInset,
}: OverlayMetricsOptions): OverlayMeasurement {
  const headers = useRef(new Set<HTMLElement>());
  const tracks = useRef<Tracks>({ x: null, y: null });
  const observer = useRef<{ observe(): void; schedule(): void } | null>(null);
  const [metrics, setMetrics] = useState(emptyMetrics);

  const registerHeader = useCallback<HeaderRegistration>((element) => {
    if (!element) return undefined;
    headers.current.add(element);
    observer.current?.observe();
    return () => {
      headers.current.delete(element);
      observer.current?.observe();
    };
  }, []);
  const verticalTrackRef = useCallback((element: HTMLElement | null) => {
    tracks.current.y = element;
    observer.current?.observe();
  }, []);
  const horizontalTrackRef = useCallback((element: HTMLElement | null) => {
    tracks.current.x = element;
    observer.current?.observe();
  }, []);
  const schedule = useCallback(() => observer.current?.schedule(), []);

  useEffect(() => {
    const element = viewport.current;
    const view = element?.ownerDocument.defaultView;
    if (!enabled || !element || !view) return undefined;
    const measure = () => {
      const header = headerInset ? measureHeaders(headers.current) : 0;
      const next = readMetrics(element, tracks.current, header);
      setMetrics((previous) => (isShallowEqual(previous, next) ? previous : next));
    };
    const getExtraTargets = () => [...headers.current, tracks.current.x, tracks.current.y];
    const current = observeViewport(element, view, { measure, getExtraTargets, subtree: true });
    observer.current = current;
    return () => {
      observer.current = null;
      current.disconnect();
    };
  }, [enabled, headerInset, viewport]);

  return {
    metrics,
    schedule,
    registerHeader: enabled && headerInset ? registerHeader : undefined,
    verticalTrackRef,
    horizontalTrackRef,
  };
}
