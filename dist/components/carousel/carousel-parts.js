import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
const hooks = createHooks('carousel', [
    'controls',
    'rotation',
    'previous',
    'next',
    'pagination',
    'dot',
    'thumbnail',
]);
/** The rotation button, then the previous and next buttons. */
export function CarouselControls({ viewportId, canGoPrevious, canGoNext, onPrevious, onNext, rotation, }) {
    const strings = useUiStrings();
    const isRtl = useLocale().direction === 'rtl';
    return (_jsxs("div", { ...hooks.slot('controls'), children: [rotation ? (_jsx(Button, { ref: rotation.rotationRef, icon: rotation.isStopped ? 'play' : 'pause', label: rotation.isStopped ? strings.startSlideRotation : strings.stopSlideRotation, size: "sm", className: hooks.slotClass('rotation'), "aria-controls": viewportId, onPress: rotation.toggle })) : null, _jsx(Button, { icon: isRtl ? 'chevron-right' : 'chevron-left', label: strings.previousSlide, size: "sm", className: hooks.slotClass('previous'), "aria-controls": viewportId, isDisabled: !canGoPrevious, focusableWhenDisabled: true, onPress: onPrevious }), _jsx(Button, { icon: isRtl ? 'chevron-left' : 'chevron-right', label: strings.nextSlide, size: "sm", className: hooks.slotClass('next'), "aria-controls": viewportId, isDisabled: !canGoNext, focusableWhenDisabled: true, onPress: onNext })] }));
}
/** One button per slide, as a dot or as the caller's thumbnail, marking the shown slide current. */
export function CarouselPaginationButtons({ pagination, count, index, viewportId, onSelect, renderThumbnail, }) {
    const strings = useUiStrings();
    const slot = pagination === 'dots' ? 'dot' : 'thumbnail';
    return (_jsx("div", { ...hooks.slot('pagination'), role: "group", "aria-label": strings.chooseSlide, children: Array.from({ length: count }, (_, position) => (_jsx(AriaButton, { ...hooks.slot(slot, { current: position === index }), "aria-label": strings.goToSlide(position + 1), "aria-current": position === index ? 'true' : undefined, "aria-controls": viewportId, onPress: () => onSelect(position), children: slot === 'thumbnail' ? renderThumbnail?.(position) : null }, position))) }));
}
//# sourceMappingURL=carousel-parts.js.map