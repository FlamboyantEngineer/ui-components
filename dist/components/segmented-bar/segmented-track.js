import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { SegmentedCircle } from './segmented-circle.js';
import { toSegmentProperties } from './segmented-layout.js';
import { useSegmentedAnimation } from './use-segmented-animation.js';
const hooks = createHooks('segmented-bar', ['track', 'segment']);
/** The decorative geometry owns visibility and animation completion, apart from the live legend. */
export function SegmentedTrack({ shape, segments, animated, }) {
    const [element, setElement] = useState(null);
    const animationState = useSegmentedAnimation(element, animated);
    const totalShare = segments.reduce((sum, part) => sum + part.share, 0);
    const style = measuredProperty('segment-total', String(totalShare));
    if (shape !== 'linear') {
        return (_jsx(SegmentedCircle, { shape: shape, segments: segments, animationState: animationState, style: style, ref: setElement }));
    }
    return (_jsx("div", { ...hooks.slot('track', { animationState }), style: style, ref: setElement, "aria-hidden": "true", children: segments.map((part) => part.share > 0 ? (_jsx("div", { ...hooks.slot('segment', { tone: part.segment.tone ?? 'neutral' }), style: { width: `${part.share}%`, ...toSegmentProperties(part) } }, toKeyIdentity(part.segment.id))) : null) }));
}
//# sourceMappingURL=segmented-track.js.map