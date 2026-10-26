const armedElements = new WeakMap();
/** Captures the gesture's pointer on its element, including when a drag starts after a threshold. */
export function capturePointer(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
}
/** Releases a capture only while the element still owns it. */
export function releasePointer(element, pointerId) {
    if (element.hasPointerCapture?.(pointerId))
        element.releasePointerCapture(pointerId);
}
/** The half of an item under a local point, in reading order along the collection's axis. */
export function resolveDropPosition(options) {
    const { width, height, x, y, orientation, isRtl } = options;
    const before = orientation === 'vertical' ? y < height / 2 : x < width / 2 !== isRtl;
    return before ? 'before' : 'after';
}
/** Listens outside an uncaptured gesture's element, in that element's own document. */
export function listenPointerRelease(options) {
    const { element, pointerId, onRelease, onCancel } = options;
    const document = element.ownerDocument;
    const stop = () => {
        document.removeEventListener('pointerup', release, true);
        document.removeEventListener('pointercancel', cancel, true);
    };
    const finish = (event, callback) => {
        if (pointerId !== undefined && pointerId !== event.pointerId)
            return;
        stop();
        callback();
    };
    const release = (event) => finish(event, onRelease);
    const cancel = (event) => finish(event, onCancel ?? onRelease);
    document.addEventListener('pointerup', release, true);
    if (onCancel)
        document.addEventListener('pointercancel', cancel, true);
    return stop;
}
/** Arms a native drag until the press or drag ends, sharing cleanup across handle-driven rows. */
export function armElementDrag(element) {
    armedElements.get(element)?.();
    const disarm = () => {
        element.removeAttribute('draggable');
        stop();
        element.removeEventListener('dragend', disarm);
        armedElements.delete(element);
    };
    const stop = listenPointerRelease({ element, onRelease: disarm });
    element.setAttribute('draggable', 'true');
    armedElements.set(element, disarm);
    element.addEventListener('dragend', disarm);
}
//# sourceMappingURL=pointer-drag.js.map