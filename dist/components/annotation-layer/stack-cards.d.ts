import type { Key } from '../../core/props.js';
/** A card to place: the top of its anchor in the margin (`null` when the anchor is gone) and its height. */
export interface CardInput {
    id: Key;
    anchorTop: number | null;
    height: number;
}
/** Where a card goes, in pixels from the top of the margin. */
export interface CardPlacement {
    id: Key;
    top: number;
    isOrphaned: boolean;
}
export interface StackOptions {
    /** The card kept level with its anchor; the others move away from it. */
    activeId: Key | null;
    /** Space kept between two cards, in pixels. */
    gap: number;
}
/**
 * Stacks cards in the order of their anchors, each as close to its anchor as the cards before it
 * allow and never above the margin's top. The active card stays level with its anchor where the
 * cards before it fit above it: they move up from it, and the cards after it move down. Cards whose
 * anchor is gone follow the others in their given order.
 */
export declare function stackAnnotationCards(cards: readonly CardInput[], { activeId, gap }: StackOptions): CardPlacement[];
//# sourceMappingURL=stack-cards.d.ts.map