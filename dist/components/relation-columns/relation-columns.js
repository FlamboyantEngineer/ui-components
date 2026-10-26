import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Walks relations upstream and downstream of an item in Miller columns: choosing an item in a
// column opens the column of its related items beyond it.
import { useId, useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Breadcrumb } from '../breadcrumb/breadcrumb.js';
import { RelationColumnView } from './relation-column.js';
import { relationColumnsHooks as hooks } from './relation-columns-hooks.js';
import { chooseRelation, emptyRelationPath, listRelationTrail, resolveRelationColumns, } from './relation-columns-model.js';
const rowSelector = '[role="row"]';
/** The path, the caller's when controlled, otherwise one of its own that resets with the item. */
function useRelationPath(options) {
    const { itemKey, path, defaultPath, onPathChange } = options;
    const [own, setOwn] = useState({ itemKey, path: defaultPath ?? emptyRelationPath });
    const current = path ?? (own.itemKey === itemKey ? own.path : emptyRelationPath);
    const setPath = (next) => {
        if (path === undefined)
            setOwn({ itemKey, path: next });
        onPathChange?.(next);
    };
    return [current, setPath];
}
/**
 * ArrowLeft and ArrowRight on an item move focus to the column beside it (mirrored right to left),
 * onto its chosen item or its first one. They are taken before the grid list's own row handling.
 */
function moveBetweenColumns(event, isRightToLeft) {
    const isArrow = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const row = event.target instanceof Element ? event.target : null;
    if (!isArrow || !row?.matches(rowSelector) || event.altKey || event.ctrlKey || event.metaKey)
        return;
    const columns = [...event.currentTarget.querySelectorAll(`.${hooks.slotClass('column')}`)];
    const index = columns.findIndex((column) => column.contains(row));
    const step = (event.key === 'ArrowRight') !== isRightToLeft ? 1 : -1;
    const target = columns[index + step];
    const rows = target ? [...target.querySelectorAll(rowSelector)] : [];
    const next = rows.find((entry) => entry.getAttribute('aria-selected') === 'true') ?? rows[0];
    event.preventDefault();
    event.stopPropagation();
    next?.focus();
}
/**
 * Relation columns: the item in the middle, the items upstream of it in the column before and those
 * downstream in the column after. Choosing an item in a side column opens the column of its own
 * related items further along that side, Miller-column style; each column counts its items and each
 * item the items further along. A breadcrumb trail shows the chosen path, and the arrow keys move
 * between the items of a column and between columns.
 */
export function RelationColumns({ item, getRelated, getTextValue, renderItem, path, defaultPath, onPathChange, onAction, className, ...rest }) {
    const strings = useUiStrings();
    const { direction: textDirection } = useLocale();
    const baseId = useId();
    const rootId = rest.id ?? `${baseId}-root`;
    const pathLabelId = `${baseId}-path`;
    const [current, setPath] = useRelationPath({ itemKey: item.id, path, defaultPath, onPathChange });
    const columns = resolveRelationColumns({ item, path: current, getRelated });
    const trail = listRelationTrail(columns);
    const context = {
        ...{ getRelated, getTextValue, renderItem, onAction },
        onSelect: (column, key) => {
            if (column.direction === 'item')
                return;
            setPath(chooseRelation(current, { direction: column.direction, depth: column.depth, key }));
        },
    };
    const onTrailAction = (key) => {
        const step = trail[Number(key)];
        if (!step)
            return;
        const { direction, depth } = step.column;
        setPath(direction === 'item'
            ? emptyRelationPath
            : chooseRelation(current, { direction, depth, key: step.item.id }));
    };
    return (_jsxs("div", { role: "group", ...rest, id: rootId, ...hooks.root({ className, props: rest }), children: [_jsx("span", { id: pathLabelId, hidden: true, children: strings.relationPath }), _jsx(Breadcrumb, { "aria-labelledby": `${pathLabelId} ${rootId}`, className: hooks.slotClass('path'), items: trail.map((step, index) => ({ id: index, label: getTextValue(step.item) })), onAction: onTrailAction }), _jsx("div", { ...hooks.slot('columns'), onKeyDownCapture: (event) => moveBetweenColumns(event, textDirection === 'rtl'), children: columns.map((column) => (_jsx(RelationColumnView, { column: column, context: context }, `${column.direction}-${column.depth}`))) })] }));
}
//# sourceMappingURL=relation-columns.js.map