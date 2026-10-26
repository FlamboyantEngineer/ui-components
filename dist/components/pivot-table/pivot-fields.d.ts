import type { PivotAggregateName, PivotLayout, PivotValue } from '../../utils/pivot.js';
/** A zone of the field chooser: unused fields, row fields, column fields or values. */
export type PivotZone = 'fields' | 'rows' | 'columns' | 'values';
/** A field the pivot offers, by its id in the records. */
export interface PivotFieldInfo {
    id: string;
    label: string;
    /** The aggregation the field takes when it moves into the values. Defaults to `count`. */
    aggregate?: PivotAggregateName | undefined;
}
/** One card of the field chooser. */
export interface PivotFieldCard {
    /** Unique among the cards: the field id, or for a field's later cards its zone and place. */
    id: string;
    zone: PivotZone;
    field: PivotFieldInfo;
    /** The value a card in the values zone stands for, with its index in the layout's values. */
    value: {
        index: number;
        value: PivotValue;
    } | null;
}
/** A card move: the card `key` lands in the zone `column`, beside `targetKey`. */
export interface PivotFieldMove {
    key: string | number;
    column: string | number;
    targetKey: string | number | null;
    position: 'before' | 'after';
}
/** The offered field with `id`, or one labelled by the id when none is offered. */
export declare function findField<F extends PivotFieldInfo>(fields: readonly F[], id: string): F | PivotFieldInfo;
/**
 * The chooser's cards: every offered field the layout does not use in the fields zone, then the
 * layout's row fields, column fields and values in order.
 */
export declare function createFieldCards(fields: readonly PivotFieldInfo[], layout: PivotLayout): PivotFieldCard[];
/**
 * The layout after a card moves: it leaves its zone and lands in the target zone beside the target
 * card. A field landing in the values becomes a value with its default aggregation; a value
 * landing in rows or columns becomes that field unless the zone holds it already; a card landing
 * in the fields zone leaves the layout.
 */
export declare function applyFieldMove(layout: PivotLayout, fields: readonly PivotFieldInfo[], move: PivotFieldMove): PivotLayout;
/** The layout with the value at `index` aggregating by `aggregate`. */
export declare function setValueAggregate(layout: PivotLayout, index: number, aggregate: PivotAggregateName): PivotLayout;
//# sourceMappingURL=pivot-fields.d.ts.map