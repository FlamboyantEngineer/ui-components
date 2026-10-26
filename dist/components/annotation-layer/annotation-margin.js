import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { useAnnotationContext } from './annotation-context.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import { getLayerOrigin } from './anchor-geometry.js';
import { stackAnnotationCards } from './stack-cards.js';
const steps = {
    ArrowDown: (index, last) => Math.min(last, index + 1),
    ArrowUp: (index) => Math.max(0, index - 1),
    Home: () => 0,
    End: (_, last) => last,
};
function isSameGeometry(a, b) {
    if (a.offset !== b.offset || a.heights.size !== b.heights.size)
        return false;
    for (const [id, height] of a.heights)
        if (b.heights.get(id) !== height)
            return false;
    return true;
}
/** Measures the margin's place in its layer and its cards' heights, again on every resize. */
function useMarginGeometry(margin, layer) {
    const cards = useRef(new Map());
    const [geometry, setGeometry] = useState({ offset: 0, heights: new Map() });
    const measure = () => {
        if (!margin || !layer)
            return;
        const heights = new Map();
        for (const [id, card] of cards.current)
            heights.set(id, card.offsetHeight);
        const offset = margin.getBoundingClientRect().top + margin.clientTop - getLayerOrigin(layer).top;
        const next = { offset, heights };
        setGeometry((current) => (isSameGeometry(current, next) ? current : next));
    };
    useLayoutEffect(measure);
    useResizeObserver(() => [margin, ...cards.current.values()], measure);
    const register = (id) => (element) => {
        if (element)
            cards.current.set(id, element);
        else
            cards.current.delete(id);
    };
    return { geometry, cards: cards.current, register };
}
/**
 * Lays out a card for each annotation of the layer around it, level with its anchor and stacked
 * without overlap, the active card kept level with its anchor. The cards are a list; arrow keys,
 * Home and End move between them, and focusing a card makes its annotation active.
 */
export function AnnotationMargin({ renderCard, gap = 8, className, ...rest }) {
    const strings = useUiStrings();
    const { anchors, activeId, setActiveId, layer } = useAnnotationContext();
    const [margin, setMargin] = useState(null);
    const { geometry, cards, register } = useMarginGeometry(margin, layer);
    const byId = new Map(anchors.map((anchor) => [anchor.annotation.id, anchor.annotation]));
    const placements = stackAnnotationCards(anchors.map(({ annotation, rects }) => ({
        id: annotation.id,
        anchorTop: rects.length === 0
            ? null
            : rects.reduce((top, rect) => Math.min(top, rect.top), Infinity) - geometry.offset,
        height: geometry.heights.get(annotation.id) ?? 0,
    })), { activeId, gap });
    const tabStop = placements.some((card) => card.id === activeId) ? activeId : placements[0]?.id;
    const height = placements.reduce((end, card) => Math.max(end, card.top + (geometry.heights.get(card.id) ?? 0)), 0);
    const onKeyDown = (event, index) => {
        const step = steps[event.key];
        if (event.target !== event.currentTarget || !step)
            return;
        event.preventDefault();
        const card = placements[step(index, placements.length - 1)];
        if (card)
            cards.get(card.id)?.focus();
    };
    return (_jsx("div", { "aria-label": strings.annotations, ...rest, ...hooks.slot('margin', undefined, className), ref: setMargin, role: "list", style: { position: 'relative', minHeight: height }, children: placements.map((card, index) => {
            const isActive = card.id === activeId;
            return (_jsx("div", { ref: register(card.id), role: "listitem", tabIndex: card.id === tabStop ? 0 : -1, ...hooks.slot('card', { active: isActive, orphaned: card.isOrphaned }), style: { position: 'absolute', top: card.top }, onFocus: () => {
                    if (!isActive)
                        setActiveId(card.id);
                }, onKeyDown: (event) => onKeyDown(event, index), children: renderCard(byId.get(card.id), { isActive, isOrphaned: card.isOrphaned }) }, toKeyIdentity(card.id)));
        }) }));
}
//# sourceMappingURL=annotation-margin.js.map