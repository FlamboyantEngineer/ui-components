import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { TooltipTriggerStateContext } from '../../primitives/index.js';
import { TooltipPanel } from '../tooltip/tooltip.js';
import { chartHooks as hooks } from './chart-hooks.js';
const horizontalKeys = {
    previous: 'ArrowLeft',
    next: 'ArrowRight',
    previousSeries: 'ArrowUp',
    nextSeries: 'ArrowDown',
};
const verticalKeys = {
    previous: 'ArrowUp',
    next: 'ArrowDown',
    previousSeries: 'ArrowLeft',
    nextSeries: 'ArrowRight',
};
/** The nearest point in the nearest drawn series in `step`'s direction. */
function findAcross(points, from, step) {
    let target;
    let seriesDistance = Infinity;
    let pointDistance = Infinity;
    for (const point of points) {
        const distance = (point.series - from.series) * step;
        if (distance <= 0 || distance > seriesDistance)
            continue;
        const proximity = Math.abs(point.index - from.index);
        if (distance < seriesDistance || proximity < pointDistance) {
            target = point;
            seriesDistance = distance;
            pointDistance = proximity;
        }
    }
    return target;
}
function findAlong(points, from, { key, keys }) {
    let target;
    const isFirst = key === keys.next || key === 'Home';
    for (const point of points) {
        if (point.series !== from.series)
            continue;
        if (key === keys.previous && point.index >= from.index)
            continue;
        if (key === keys.next && point.index <= from.index)
            continue;
        if (!target || (isFirst ? point.index < target.index : point.index > target.index)) {
            target = point;
        }
    }
    return target;
}
/**
 * The point a key moves focus to from `from`, or `undefined` for a key that does not move it. Each
 * key scans the points once, without sorting them; keys outside navigation read none.
 */
function findNextPoint(points, from, { key, keys }) {
    switch (key) {
        case keys.previous:
        case keys.next:
        case 'Home':
        case 'End':
            return findAlong(points, from, { key, keys });
        case keys.previousSeries:
            return findAcross(points, from, -1);
        case keys.nextSeries:
            return findAcross(points, from, 1);
        default:
            return undefined;
    }
}
/**
 * Closes an open tooltip on Escape wherever focus is, as React Aria's tooltips do, so a tooltip
 * opened by hover can be dismissed without moving the pointer. The press goes no further.
 */
function useEscapeToClose(isOpen, close) {
    useEffect(() => {
        if (!isOpen)
            return undefined;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            event.stopPropagation();
            close();
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, close]);
}
/**
 * One tab stop for a chart's drawn values: the arrow keys move along a series (across the
 * categories) and between series, Home and End jump to a series' ends, and the value hovered or
 * focused shows the tooltip until the pointer leaves, focus moves on or Escape is pressed.
 * `isVertical` runs the categories down, as the bars of a horizontal bar chart do.
 */
export function useChartPoints(points, isVertical = false) {
    const elements = useRef(new Map());
    const anchor = useRef(null);
    const [focusKey, setFocusKey] = useState(null);
    const [activeKey, setActiveKey] = useState(null);
    const close = useCallback(() => setActiveKey(null), []);
    useEscapeToClose(activeKey !== null, close);
    const tabKey = points.some((point) => point.key === focusKey) ? focusKey : points[0]?.key;
    const keys = isVertical ? verticalKeys : horizontalKeys;
    const activate = (key, element) => {
        anchor.current = element;
        setActiveKey(key);
    };
    return {
        activeKey,
        anchor,
        getPointProps: (point) => ({
            ref: (element) => {
                if (element)
                    elements.current.set(point.key, element);
                else
                    elements.current.delete(point.key);
            },
            tabIndex: point.key === tabKey ? 0 : -1,
            onFocus: (event) => {
                setFocusKey(point.key);
                activate(point.key, event.currentTarget);
            },
            onBlur: () => setActiveKey(null),
            onPointerEnter: (event) => activate(point.key, event.currentTarget),
            onPointerLeave: () => setActiveKey(null),
            onKeyDown: (event) => {
                const next = findNextPoint(points, point, { key: event.key, keys });
                if (!next)
                    return;
                event.preventDefault();
                elements.current.get(next.key)?.focus();
            },
        }),
    };
}
/** The tooltip of the hovered or focused value, pointing at its element. */
export function ChartTooltip({ activeKey, anchor, title, label, series, tone, value, }) {
    const isOpen = activeKey !== null;
    const state = useMemo(() => ({ isOpen, shouldSkipAnimation: false, open: () => { }, close: () => { } }), [isOpen]);
    return (_jsx(TooltipTriggerStateContext.Provider, { value: state, children: isOpen ? (_jsxs(TooltipPanel, { variant: "default", className: hooks.slotClass('tooltip'), triggerRef: anchor, children: [title ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('tooltip-title'), children: title }), ' '] })) : null, _jsx("span", { ...hooks.slot('tooltip-swatch', { series, tone }), "aria-hidden": "true" }), _jsx("span", { ...hooks.slot('tooltip-label'), children: label }), ' ', _jsx("span", { ...hooks.slot('tooltip-value'), children: value })] }, activeKey)) : null }));
}
//# sourceMappingURL=chart-points.js.map