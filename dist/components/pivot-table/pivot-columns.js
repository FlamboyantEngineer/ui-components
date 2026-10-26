import { jsx as _jsx } from "react/jsx-runtime";
import { findField } from './pivot-fields.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';
/** The text of a key in a field's headers: the field's format, or the key as text. */
function formatKey(field, key, strings) {
    if (key === null)
        return strings.pivotEmptyKey;
    return field.formatKey ? field.formatKey(key) : String(key);
}
function cellsOf(row, result) {
    return row.group ? row.group.cells : result.totals;
}
function totalOf(row, result) {
    return row.group ? row.group.total : result.grandTotal;
}
function Value({ value, isTotal }) {
    return _jsx("span", { ...hooks.slot('value', { total: isTotal }), children: value });
}
/** A column's header text: its key in each column field, outermost first. */
function columnLabel(column, options) {
    return column.path
        .map((key, index) => formatKey(findField(options.fields, options.layout.columns[index]), key, options.strings))
        .join(' / ');
}
/** A value's header text: its label, else its aggregation and field, else the field alone. */
export function getValueLabel(value, field, strings) {
    if (value.label)
        return value.label;
    const { aggregate = 'sum' } = value;
    if (typeof aggregate === 'function')
        return field.label;
    return strings.pivotValueLabel(strings.pivotAggregate(aggregate), field.label);
}
function createFormatter(value, field, locale) {
    const format = new Intl.NumberFormat(locale, value.aggregate === 'count' ? undefined : field.formatOptions);
    return (number) => (number === null ? '' : format.format(number));
}
function createRowColumn(options) {
    const { layout, fields, strings } = options;
    const header = layout.rows.map((id) => findField(fields, id).label).join(' / ') || strings.pivotRows;
    return {
        id: 'row',
        header,
        isRowHeader: true,
        allowsSorting: true,
        getValue: (row) => row.order,
        renderCell: (row) => (_jsx("span", { ...hooks.slot('key', { total: row.group === null }), children: row.group
                ? formatKey(findField(fields, row.group.field), row.group.value, strings)
                : strings.pivotTotal })),
        renderFooter: layout.rows.length > 0
            ? () => _jsx("span", { ...hooks.slot('key', { total: true }), children: strings.pivotTotal })
            : undefined,
    };
}
/** A value column: its cells and, with row fields, its total in the summary row. */
function createValueColumn(column, value, footer) {
    const { read } = column;
    return {
        id: column.id,
        header: column.header,
        align: 'end',
        allowsSorting: true,
        getValue: read,
        renderCell: (row) => (_jsx(Value, { value: value.format(read(row)), isTotal: footer.isTotal || row.group === null })),
        renderFooter: footer.hasFooter
            ? () => _jsx(Value, { value: value.format(column.total), isTotal: true })
            : undefined,
    };
}
/** One column per column key and value, grouped under the column key with several values. */
function createKeyColumns(options, values) {
    const { result, layout } = options;
    const isGrouped = values.length > 1;
    const footer = { hasFooter: layout.rows.length > 0, isTotal: false };
    const columns = [];
    const groups = [];
    result.columns.forEach((column, columnIndex) => {
        const label = layout.columns.length > 0 ? columnLabel(column, options) : '';
        const ids = values.map((value, valueIndex) => {
            const id = `c${columnIndex}v${valueIndex}`;
            const read = (row) => cellsOf(row, result)[column.key]?.[valueIndex] ?? null;
            const header = isGrouped || label === '' ? value.label : label;
            const total = result.totals[column.key]?.[valueIndex] ?? null;
            columns.push(createValueColumn({ id, header, read, total }, value, footer));
            return id;
        });
        if (isGrouped && label !== '')
            groups.push({ id: `g${columnIndex}`, header: label, columns: ids });
    });
    const [only] = values;
    if (!isGrouped && only && layout.columns.length > 0 && columns.length > 0) {
        groups.push({ id: 'value', header: only.label, columns: columns.map((column) => column.id) });
    }
    return { columns, groups };
}
/** With column fields, one row total column per value, grouped under the total header. */
function createTotalColumns(options, values) {
    const { result, layout, strings } = options;
    if (layout.columns.length === 0)
        return { columns: [], groups: [] };
    const isGrouped = values.length > 1;
    const footer = { hasFooter: layout.rows.length > 0, isTotal: true };
    const columns = values.map((value, valueIndex) => createValueColumn({
        id: `t${valueIndex}`,
        header: isGrouped ? value.label : strings.pivotTotal,
        read: (row) => totalOf(row, result)[valueIndex] ?? null,
        total: result.grandTotal[valueIndex] ?? null,
    }, value, footer));
    const ids = columns.map((column) => column.id);
    return {
        columns,
        groups: isGrouped ? [{ id: 'total', header: strings.pivotTotal, columns: ids }] : [],
    };
}
/**
 * The pivot's columns: the row header column, a column per column key and value, and with column
 * fields one row total column per value. With row fields, the summary row holds the column totals.
 * Several values group each column key's value columns under its header; one value groups every
 * column key under the value's header.
 */
export function createPivotColumns(options) {
    const { layout, fields, strings, locale } = options;
    const values = layout.values.map((value) => {
        const field = findField(fields, value.field);
        return {
            label: getValueLabel(value, field, strings),
            format: createFormatter(value, field, locale),
        };
    });
    const keyed = createKeyColumns(options, values);
    const totals = createTotalColumns(options, values);
    return {
        columns: [createRowColumn(options), ...keyed.columns, ...totals.columns],
        groups: [...keyed.groups, ...totals.groups],
    };
}
//# sourceMappingURL=pivot-columns.js.map