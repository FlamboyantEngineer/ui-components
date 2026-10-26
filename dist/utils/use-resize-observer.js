import { useLayoutEffect, useRef } from 'react';
function resolveTarget(target) {
    if ('current' in target)
        return [target.current, 'content-box'];
    if ('element' in target)
        return [target.element, target.box ?? 'content-box'];
    return [target, 'content-box'];
}
function getOrCreate(map, key, create) {
    let value = map.get(key);
    if (value === undefined)
        map.set(key, (value = create()));
    return value;
}
function collectTargets(targets) {
    const wanted = new Map();
    for (const target of typeof targets === 'function' ? targets() : targets) {
        if (!target)
            continue;
        const [element, box] = resolveTarget(target);
        const view = element?.ownerDocument.defaultView;
        if (!element || !view || typeof view.ResizeObserver !== 'function')
            continue;
        getOrCreate(getOrCreate(wanted, view, () => new Map()), box, () => new Set()).add(element);
    }
    return wanted;
}
function release(observation) {
    observation.active = false;
    observation.observer.disconnect();
}
/** Stops watching elements that are no longer wanted, and drops observers left with none. */
function releaseUnwanted(current, wanted) {
    for (const [view, boxes] of current) {
        for (const [box, observation] of boxes) {
            const elements = wanted.get(view)?.get(box);
            if (elements) {
                unobserveMissing(observation, elements);
            }
            else {
                release(observation);
                boxes.delete(box);
            }
        }
        if (boxes.size === 0)
            current.delete(view);
    }
}
function unobserveMissing(observation, elements) {
    for (const element of observation.elements) {
        if (elements.has(element))
            continue;
        observation.observer.unobserve(element);
        observation.elements.delete(element);
    }
}
function observeMissing(observation, elements, box) {
    for (const element of elements) {
        if (observation.elements.has(element))
            continue;
        observation.elements.add(element);
        observation.observer.observe(element, { box });
    }
}
function createObservation(view, callback) {
    const observation = {
        observer: new view.ResizeObserver((entries, observer) => {
            if (observation.active)
                callback.current(entries, observer);
        }),
        elements: new Set(),
        active: true,
    };
    return observation;
}
/** Starts watching newly wanted elements, sharing one observer per window and box. */
function observeWanted(current, wanted, callback) {
    for (const [view, boxes] of wanted) {
        const byBox = getOrCreate(current, view, () => new Map());
        for (const [box, elements] of boxes) {
            const observation = getOrCreate(byBox, box, () => createObservation(view, callback));
            observeMissing(observation, elements, box);
        }
    }
}
/**
 * Observes the size of committed elements with a `ResizeObserver` from each element's own window,
 * so content inside an iframe is observed there. Targets are resolved after every commit; a fresh
 * array or a new callback does not restart observations of unchanged elements. One observer is
 * shared per window and box, and an element can be watched in two boxes at once.
 */
export function useResizeObserver(targets, onResize) {
    const callback = useRef(onResize);
    const observations = useRef(new Map());
    useLayoutEffect(() => {
        callback.current = onResize;
    }, [onResize]);
    useLayoutEffect(() => {
        const wanted = collectTargets(targets);
        releaseUnwanted(observations.current, wanted);
        observeWanted(observations.current, wanted, callback);
    });
    useLayoutEffect(() => {
        const current = observations.current;
        return () => {
            for (const boxes of current.values())
                boxes.forEach(release);
            current.clear();
        };
    }, []);
}
//# sourceMappingURL=use-resize-observer.js.map