import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { OverlayScrollbars, useOverlayMetrics } from '../scroll-region/scroll-region.js';
import { codeEditorHooks as hooks } from './code-layers.js';
function measureMarks({ input, gutter, diagnostics }) {
    const viewport = input.current;
    const lines = gutter.current?.children;
    if (!viewport || !lines || viewport.scrollHeight <= viewport.clientHeight)
        return [];
    const origin = gutter.current.getBoundingClientRect().top - gutter.current.scrollTop;
    return diagnostics.flatMap((diagnostic) => {
        const start = diagnostic.line === undefined ? undefined : lines[diagnostic.line - 1];
        if (!start)
            return [];
        const end = lines[Math.max(diagnostic.line - 1, Math.min(lines.length - 1, (diagnostic.endLine ?? diagnostic.line) - 1))] ?? start;
        const top = start.getBoundingClientRect().top - origin;
        const bottom = end.getBoundingClientRect().bottom - origin;
        return [
            {
                top: top / viewport.scrollHeight,
                height: (bottom - top) / viewport.scrollHeight,
                severity: diagnostic.severity ?? 'error',
            },
        ];
    });
}
/** The editor's custom scrollbars share the native viewport, with diagnostics painted inside the vertical track. */
export function CodeScrollbars(props) {
    const { input, inputId, gutter, value, wrap } = props;
    const measurement = useOverlayMetrics({ viewport: input, enabled: true, headerInset: false });
    const [marks, setMarks] = useState([]);
    const { schedule } = measurement;
    useEffect(() => {
        const viewport = input.current;
        if (!viewport)
            return undefined;
        viewport.addEventListener('scroll', schedule);
        schedule();
        return () => viewport.removeEventListener('scroll', schedule);
    }, [input, schedule, value, wrap]);
    useEffect(() => {
        const update = () => {
            const next = measureMarks(props);
            setMarks((previous) => previous.length === next.length &&
                previous.every((mark, index) => mark.top === next[index]?.top &&
                    mark.height === next[index]?.height &&
                    mark.severity === next[index]?.severity)
                ? previous
                : next);
        };
        update();
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
        if (input.current)
            observer?.observe(input.current);
        if (gutter.current) {
            observer?.observe(gutter.current);
            for (const line of gutter.current.children)
                observer?.observe(line);
        }
        return () => observer?.disconnect();
    }, [props, input, gutter]);
    const { metrics } = measurement;
    return (_jsx("div", { ...hooks.slot('scrollbars'), children: _jsx(OverlayScrollbars, { tabIndex: -1, viewport: input, viewportId: inputId, measurement: measurement, drawX: metrics.contentWidth > metrics.width + 1, drawY: metrics.contentHeight > metrics.height + 1, isVisible: true, verticalMarks: marks.map((mark, index) => (_jsx("span", { ...hooks.slot('scroll-marker', { severity: mark.severity }), "aria-hidden": "true", style: { top: `${mark.top * 100}%`, height: `${mark.height * 100}%` } }, index))) }) }));
}
//# sourceMappingURL=code-scrollbars.js.map