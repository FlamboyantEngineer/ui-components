// Places annotation cards in a margin beside their anchors without overlap (specs/ANNOTATION-LAYER.md).
/**
 * Stacks cards in the order of their anchors, each as close to its anchor as the cards before it
 * allow and never above the margin's top. The active card stays level with its anchor where the
 * cards before it fit above it: they move up from it, and the cards after it move down. Cards whose
 * anchor is gone follow the others in their given order.
 */
export function stackAnnotationCards(cards, { activeId, gap }) {
    const anchored = cards
        .filter((card) => card.anchorTop !== null)
        .sort((a, b) => a.anchorTop - b.anchorTop);
    const tops = anchored.map((card) => card.anchorTop);
    const active = Math.max(0, anchored.findIndex((card) => card.id === activeId));
    for (let index = active - 1; index >= 0; index -= 1) {
        const below = tops[index + 1] - gap - anchored[index].height;
        tops[index] = Math.min(tops[index], below);
    }
    // Downwards from the margin's top: cards that did not fit above the active one push it down.
    tops[0] = Math.max(0, tops[0] ?? 0);
    for (let index = 1; index < anchored.length; index += 1) {
        const above = tops[index - 1] + anchored[index - 1].height + gap;
        tops[index] = Math.max(tops[index], above);
    }
    const placements = anchored.map((card, index) => ({
        id: card.id,
        top: tops[index],
        isOrphaned: false,
    }));
    let bottom = placements.reduce((end, placement, index) => Math.max(end, placement.top + anchored[index].height + gap), 0);
    for (const card of cards) {
        if (card.anchorTop !== null)
            continue;
        placements.push({ id: card.id, top: bottom, isOrphaned: true });
        bottom += card.height + gap;
    }
    return placements;
}
//# sourceMappingURL=stack-cards.js.map