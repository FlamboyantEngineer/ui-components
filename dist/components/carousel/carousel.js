import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, isValidElement, useEffect, useId, useRef, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { CarouselControls, CarouselPaginationButtons, } from './carousel-parts.js';
import { useCarouselAutoplay } from './use-carousel-autoplay.js';
const hooks = createHooks('carousel', ['viewport', 'slide']);
const defaultInterval = 5000;
/**
 * Keys that move between slides, unless pressed with a modifier, inside a control that uses them, or
 * already handled by a widget inside a slide.
 */
function resolveSlideKey(event, direction) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
        return 0;
    if (isEditableTarget(event.target, '[role="slider"]'))
        return 0;
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    return event.key === forward ? 1 : event.key === backward ? -1 : 0;
}
/** Moves focus to the shown slide after a change made while focus was inside the slide it hid. */
function useSlideFocus(index) {
    const viewportRef = useRef(null);
    const pending = useRef(false);
    useEffect(() => {
        if (!pending.current)
            return;
        pending.current = false;
        viewportRef.current?.querySelector(`:scope > [data-current]`)?.focus();
    }, [index]);
    const markIfFocusInside = () => {
        pending.current = viewportRef.current?.contains(document.activeElement) ?? false;
    };
    return { viewportRef, markIfFocusInside };
}
/** The shown slide, kept within the slides, and the moves between slides. */
function useCarouselIndex({ index, defaultIndex = 0, onIndexChange, loop = false, count, }) {
    const [requested, setIndex] = useControllableState(index, defaultIndex, onIndexChange);
    const current = Math.min(Math.max(0, Math.trunc(requested) || 0), Math.max(0, count - 1));
    const { viewportRef, markIfFocusInside } = useSlideFocus(current);
    const goTo = (next) => {
        if (next === current || next < 0 || next >= count)
            return;
        markIfFocusInside();
        setIndex(next);
    };
    return {
        index: current,
        viewportRef,
        goTo,
        step: (delta) => goTo(loop ? (current + delta + count) % count : current + delta),
        canGoPrevious: loop || current > 0,
        canGoNext: loop || current < count - 1,
    };
}
/** The live region holding every slide, only the shown one visible. */
function CarouselViewport({ id, slides, index, isRotating, viewportRef, }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...hooks.slot('viewport'), ref: viewportRef, id: id, "aria-live": isRotating ? 'off' : 'polite', children: slides.map((slide, position) => {
            const isCurrent = position === index;
            return (_jsx("div", { ...hooks.slot('slide', { current: isCurrent }), role: "group", "aria-roledescription": strings.slide, "aria-label": strings.stepOfTotal(position + 1, slides.length), tabIndex: -1, hidden: !isCurrent, inert: !isCurrent, children: slide }, isValidElement(slide) && slide.key !== null ? slide.key : position));
        }) }));
}
/**
 * Slides shown one at a time, following the ARIA carousel pattern: previous and next buttons,
 * dots or thumbnails, the arrow keys, and optional automatic rotation with a button that stops it.
 */
export function Carousel({ children, index: indexProp, defaultIndex, onIndexChange, pagination = 'dots', renderThumbnail, loop, autoplay = false, interval = defaultInterval, className, ...rest }) {
    const strings = useUiStrings();
    const { direction } = useLocale();
    const viewportId = useId();
    const slides = Children.toArray(children);
    const count = slides.length;
    const isNavigable = count > 1;
    const nav = useCarouselIndex({ index: indexProp, defaultIndex, onIndexChange, loop, count });
    const rotation = useCarouselAutoplay({
        isEnabled: autoplay && isNavigable,
        interval: Number.isFinite(interval) && interval > 0 ? interval : defaultInterval,
        index: nav.index,
        onAdvance: () => nav.goTo((nav.index + 1) % count),
    });
    return (_jsxs("section", { ...rest, ...hooks.root({ className, data: { pagination, rotating: rotation.isRotating } }), "aria-roledescription": strings.carousel, ...rotation.pauseHandlers, onKeyDown: (event) => {
            const delta = resolveSlideKey(event, direction);
            if (delta === 0 || !isNavigable)
                return;
            event.preventDefault();
            nav.step(delta);
        }, children: [isNavigable ? (_jsx(CarouselControls, { viewportId: viewportId, canGoPrevious: nav.canGoPrevious, canGoNext: nav.canGoNext, onPrevious: () => nav.step(-1), onNext: () => nav.step(1), rotation: autoplay ? rotation : undefined })) : null, _jsx(CarouselViewport, { id: viewportId, slides: slides, index: nav.index, isRotating: rotation.isRotating, viewportRef: nav.viewportRef }), isNavigable && pagination !== 'none' ? (_jsx(CarouselPaginationButtons, { pagination: pagination, count: count, index: nav.index, viewportId: viewportId, onSelect: nav.goTo, renderThumbnail: renderThumbnail })) : null] }));
}
//# sourceMappingURL=carousel.js.map