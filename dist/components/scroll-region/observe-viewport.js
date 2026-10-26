// Layout observation shared by the overlay scrollbars and the overview: one measurement per
// animation frame whenever the viewport, its children or other watched elements resize, or its
// content changes.
/**
 * Observes `element` with the observers of its window `view`. Without `ResizeObserver`, content
 * changes and explicit `schedule` calls still remeasure.
 */
export function observeViewport(element, view, { measure, getExtraTargets, subtree = false }) {
    let active = true;
    let frame = null;
    const observed = new Set();
    const schedule = () => {
        if (!active || frame !== null)
            return;
        frame = view.requestAnimationFrame(() => {
            frame = null;
            if (active)
                measure();
        });
    };
    const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
    const observe = () => {
        if (!active)
            return;
        if (resize) {
            const wanted = new Set([element, ...element.children, ...(getExtraTargets?.() ?? [])]);
            for (const target of observed) {
                if (wanted.has(target))
                    continue;
                resize.unobserve(target);
                observed.delete(target);
            }
            for (const target of wanted) {
                if (!target || observed.has(target))
                    continue;
                resize.observe(target);
                observed.add(target);
            }
        }
        schedule();
    };
    const mutations = new view.MutationObserver(observe);
    mutations.observe(element, { childList: true, subtree });
    observe();
    return {
        schedule,
        observe,
        disconnect() {
            active = false;
            resize?.disconnect();
            observed.clear();
            mutations.disconnect();
            if (frame !== null)
                view.cancelAnimationFrame(frame);
            frame = null;
        },
    };
}
//# sourceMappingURL=observe-viewport.js.map