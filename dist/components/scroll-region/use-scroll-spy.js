import { useEffect, useState } from 'react';
/**
 * The current section of a scrolled viewport: the last of `ids` whose top has reached `offset` below
 * the viewport's top, the first before any has, and the last once the viewport is scrolled to its
 * end. Ids without an element are skipped.
 */
export function resolveScrollSpy(viewport, { ids, offset = 0 }) {
    const document = viewport.ownerDocument;
    const sections = ids.flatMap((id) => {
        const element = document.getElementById(id);
        return element ? [{ id, element }] : [];
    });
    const atEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 1;
    if (atEnd && viewport.scrollTop > 0)
        return sections.at(-1)?.id;
    const line = viewport.getBoundingClientRect().top + offset + 1;
    const reached = sections.filter(({ element }) => element.getBoundingClientRect().top <= line);
    return (reached.at(-1) ?? sections[0])?.id;
}
/**
 * Follows which of the sections `ids` is current in a scrolling viewport, such as a `ScrollRegion`'s
 * (its `ref`), for a table of contents to mark. It updates as the viewport scrolls or resizes, and
 * when the ids change.
 */
export function useScrollSpy(viewport, { ids, offset = 0 }) {
    const [active, setActive] = useState(undefined);
    const key = ids.join('\n');
    useEffect(() => {
        const element = viewport.current;
        const view = element?.ownerDocument.defaultView;
        if (!element || !view)
            return undefined;
        const sectionIds = key ? key.split('\n') : [];
        const update = () => setActive(resolveScrollSpy(element, { ids: sectionIds, offset }));
        const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(update) : null;
        resize?.observe(element);
        element.addEventListener('scroll', update, { passive: true });
        update();
        return () => {
            resize?.disconnect();
            element.removeEventListener('scroll', update);
        };
    }, [key, offset, viewport]);
    return active;
}
//# sourceMappingURL=use-scroll-spy.js.map