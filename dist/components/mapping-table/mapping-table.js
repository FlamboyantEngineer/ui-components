import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { SelectField } from '../select-field/select-field.js';
import { readMappedTarget, suggestMapping, summarizeMapping, } from './mapping.js';
const hooks = createHooks('mapping-table', [
    'table',
    'row',
    'column',
    'samples',
    'sample',
    'target',
    'select',
    'suggested',
    'summary',
    'counts',
    'problem',
]);
function labelOf(items, id) {
    return items.find((item) => item.id === id)?.label ?? id;
}
/** The warning of a column whose target other columns map to as well. */
function describeDuplicate(options) {
    const { column, target, summary, columns, targets, strings } = options;
    const sources = target === null ? undefined : summary.duplicates[target];
    if (target === null || !sources)
        return null;
    const others = sources.filter((id) => id !== column).map((id) => labelOf(columns, id));
    return strings.duplicateTarget(labelOf(targets, target), others);
}
/** One source column: its name, its samples and its choice of target. */
function MappingRow({ column, target, isSuggested, warning, options, isReadOnly, onChange, }) {
    const strings = useUiStrings();
    return (_jsxs("tr", { ...hooks.slot('row', {
            mapped: target !== null,
            suggested: isSuggested,
            duplicate: warning !== null,
        }), "data-key": column.id, children: [_jsx("th", { scope: "row", ...hooks.slot('column'), children: column.label }), _jsx("td", { ...hooks.slot('samples'), children: column.samples?.map((sample, index) => (_jsx("span", { ...hooks.slot('sample'), children: sample }, index))) }), _jsxs("td", { ...hooks.slot('target'), children: [_jsx(SelectField, { className: hooks.slotClass('select'), label: strings.importColumnAs(column.label), labelLayout: "control-only", options: options, emptyLabel: strings.doNotImport, placeholder: strings.doNotImport, isReadOnly: isReadOnly, value: target, committedValue: target, validate: () => (warning ? { severity: 'warning', message: warning } : null), onChange: (next) => onChange(next === null ? null : String(next)) }), isSuggested ? (_jsx(Badge, { size: "sm", className: hooks.slotClass('suggested'), children: strings.suggestedTarget })) : null] })] }));
}
/** The counts of mapped and skipped columns, and the required targets left unmapped. */
function MappingSummaryView({ summary, total, targets, }) {
    const strings = useUiStrings();
    const counts = [strings.mappedColumns(summary.mappedCount, total)];
    if (summary.skippedCount > 0)
        counts.push(strings.skippedColumns(summary.skippedCount));
    return (_jsxs("div", { ...hooks.slot('summary'), role: "status", children: [_jsx("p", { ...hooks.slot('counts'), children: counts.join(' · ') }), summary.isComplete ? null : (_jsx("p", { ...hooks.slot('problem'), children: strings.unmappedRequiredTargets(summary.unmappedRequired.map((id) => labelOf(targets, id))) }))] }));
}
/**
 * Maps the columns of imported data to target fields: one row per source column with its name and
 * sample values, and a choice of target with a "Don't import" option. Suggested choices are marked,
 * a target chosen for several columns warns on each, and a summary counts the mapped and skipped
 * columns and names the required targets still unmapped. The mapping is plain data.
 */
export function MappingTable({ columns, targets, value, defaultValue, onChange, getSuggestion, isReadOnly = false, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const suggestions = useMemo(() => suggestMapping(columns, targets, getSuggestion), [columns, targets, getSuggestion]);
    const [mapping, setMapping] = useControllableState(value, defaultValue ?? suggestions, onChange);
    const summary = summarizeMapping(columns, targets, mapping);
    const options = targets.map((target) => ({
        id: target.id,
        label: target.label,
        description: target.isRequired ? strings.requiredTarget : undefined,
    }));
    const label = ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.columnMapping);
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { complete: summary.isComplete } }), role: "group", "aria-label": label, children: [_jsxs("table", { ...hooks.slot('table'), children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: strings.sourceColumn }), _jsx("th", { scope: "col", children: strings.sampleValues }), _jsx("th", { scope: "col", children: strings.importAs })] }) }), _jsx("tbody", { children: columns.map((column) => {
                            const target = readMappedTarget(mapping, column.id, targets);
                            return (_jsx(MappingRow, { column: column, target: target, isSuggested: target !== null && target === suggestions[column.id], warning: describeDuplicate({
                                    column: column.id,
                                    target,
                                    summary,
                                    columns,
                                    targets,
                                    strings,
                                }), options: options, isReadOnly: isReadOnly, onChange: (next) => setMapping({ ...mapping, [column.id]: next }) }, column.id));
                        }) })] }), _jsx(MappingSummaryView, { summary: summary, total: columns.length, targets: targets })] }));
}
export { suggestMapping, summarizeMapping } from './mapping.js';
//# sourceMappingURL=mapping-table.js.map