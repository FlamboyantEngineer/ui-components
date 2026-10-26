import { useEffect, useRef, useState, } from 'react';
function prefersReducedMotion() {
    return (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
/**
 * Advances a carousel every `interval` while it is enabled and not stopped, pausing while the
 * pointer rests on it or focus is inside it, except on its rotation button. A reader who prefers
 * reduced motion starts with rotation stopped.
 */
export function useCarouselAutoplay({ isEnabled, interval, index, onAdvance, }) {
    const [isStopped, setStopped] = useState(prefersReducedMotion);
    const [isHovered, setHovered] = useState(false);
    const [isFocused, setFocused] = useState(false);
    const rotationRef = useRef(null);
    const advance = useRef(onAdvance);
    advance.current = onAdvance;
    const isRotating = isEnabled && !isStopped && !isHovered && !isFocused;
    useEffect(() => {
        if (!isRotating)
            return undefined;
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
                if (!(next instanceof Node && event.currentTarget.contains(next)))
                    setFocused(false);
            },
        },
    };
}
//# sourceMappingURL=use-carousel-autoplay.js.map