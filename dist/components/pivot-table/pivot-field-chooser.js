import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { UiProvider, useUiStrings } from '../../core/provider.js';
import { Board } from '../board/board.js';
import { SelectField } from '../select-field/select-field.js';
import { getValueLabel } from './pivot-columns.js';
import { applyFieldMove, createFieldCards, setValueAggregate, } from './pivot-fields.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';
const aggregates = ['sum', 'count', 'min', 'max', 'average'];
function FieldCard({ card, layout, onLayoutChange, }) {
    const strings = useUiStrings();
    const { value } = card;
    const aggregate = value?.value.aggregate ?? 'sum';
    return (_jsxs("div", { ...hooks.slot('field', { zone: card.zone }), children: [_jsx("span", { ...hooks.slot('field-label'), children: card.field.label }), value && typeof aggregate === 'string' ? (_jsx(SelectField, { className: hooks.slotClass('aggregate'), label: strings.pivotAggregationOf(card.field.label), labelLayout: "control-only", options: aggregates.map((id) => ({ id, label: strings.pivotAggregate(id) })), value: aggregate, committedValue: aggregate, onChange: (id) => id === null
                    ? undefined
                    : onLayoutChange(setValueAggregate(layout, value.index, id)) })) : null] }));
}
/**
 * The field chooser: a board whose columns are the unused fields, the row fields, the column fields
 * and the values, its cards moving between them by drag and drop or Alt+Arrow keys. A value's card
 * picks its aggregation.
 */
export function PivotFieldChooser({ fields, layout, onLayoutChange }) {
    const strings = useUiStrings();
    const columns = [
        { id: 'fields', title: strings.pivotFields },
        { id: 'rows', title: strings.pivotRows },
        { id: 'columns', title: strings.pivotColumns },
        { id: 'values', title: strings.pivotValues },
    ];
    const cards = createFieldCards(fields, layout);
    const labelOf = (card) => card.value ? getValueLabel(card.value.value, card.field, strings) : card.field.label;
    return (_jsx(UiProvider, { strings: { noCards: strings.pivotNoFields }, children: _jsx(Board, { className: hooks.slotClass('chooser'), "aria-label": strings.pivotFieldChooser, columns: columns, items: cards, getColumn: (card) => card.zone, getTextValue: labelOf, renderCard: (card) => (_jsx(FieldCard, { card: card, layout: layout, onLayoutChange: onLayoutChange })), onMove: (move) => onLayoutChange(applyFieldMove(layout, fields, move)) }) }));
}
//# sourceMappingURL=pivot-field-chooser.js.map