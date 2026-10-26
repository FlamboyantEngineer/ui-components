import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { toSegmentProperties } from './segmented-layout.js';
const hooks = createHooks('segmented-bar', ['ring', 'track', 'segment']);
/** The same shares around a full circle; a pie's thicker stroke reaches its center. */
export function SegmentedCircle({ shape, segments, animationState, style, ref, }) {
    const radius = shape === 'pie' ? 8 : 13;
    return (_jsxs("svg", { ...hooks.slot('ring', { animationState }), style: style, ref: ref, viewBox: "0 0 32 32", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { ...hooks.slot('track'), cx: "16", cy: "16", r: radius, fill: "none" }), segments.map((part) => {
                const { segment, share, start } = part;
                return share > 0 ? (_jsx("circle", { ...hooks.slot('segment', { tone: segment.tone ?? 'neutral' }), cx: "16", cy: "16", r: radius, fill: "none", pathLength: 100, strokeDasharray: `${share} ${100 - share}`, strokeDashoffset: -start, transform: "rotate(-90 16 16)", style: toSegmentProperties(part) }, toKeyIdentity(segment.id))) : null;
            })] }));
}
//# sourceMappingURL=segmented-circle.js.map