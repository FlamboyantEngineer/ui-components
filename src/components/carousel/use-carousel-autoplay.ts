import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type RefObject,
} from 'react';

interface CarouselAutoplayOptions {
  /** Whether the carousel rotates on its own at all. */
  isEnabled: boolean;
  /** The time each slide shows, in milliseconds. */
  interval: number;
  /** The shown slide; each new slide gets a whole interval. */
  index: number;
  /** Shows the next slide. */
  onAdvance: () => void;
}

export interface CarouselAutoplay {
  /** Advancing on its own now: enabled, not stopped, and neither hovered nor focused. */
  isRotating: boolean;
  /** The reader stopped rotation, or it started stopped because they prefer reduced motion. */
  isStopped: boolean;
  /** Stops or restarts rotation. */
  toggle: () => void;
  /** The button that stops and starts rotation, whose own focus does not pause it. */
  rotationRef: RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
  /** Handlers for the carousel's root that pause rotation while it is hovered or focused. */
  pauseHandlers: {
    onPointerEnter: (event: PointerEvent) => void;
    onPointerLeave: () => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
  };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Advances a carousel every `interval` while it is enabled and not stopped, pausing while the
 * pointer rests on it or focus is inside it, except on its rotation button. A reader who prefers
 * reduced motion starts with rotation stopped.
 */
export function useCarouselAutoplay({
  isEnabled,
  interval,
  index,
  onAdvance,
}: CarouselAutoplayOptions): CarouselAutoplay {
  const [isStopped, setStopped] = useState(prefersReducedMotion);
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const rotationRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const advance = useRef(onAdvance);
  advance.current = onAdvance;
  const isRotating = isEnabled && !isStopped && !isHovered && !isFocused;
  useEffect(() => {
    if (!isRotating) return undefined;
    const timer = setTimeout(() => advance.current(), interval);
    return () => clearTimeout(timer);
  }, [isRotating, interval, index]);
  return {
    isRotating,
    isStopped,
    toggle: () => setStopped((stopped) => !stopped),
    rotationRef,
    pauseHandlers: {
      onPointerEnter: (event) => setHovered(event.pointerType === 'mouse'),
      onPointerLeave: () => setHovered(false),
      onFocus: (event) => setFocused(event.target !== rotationRef.current),
      onBlur: (event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node && event.currentTarget.contains(next))) setFocused(false);
      },
    },
  };
}
