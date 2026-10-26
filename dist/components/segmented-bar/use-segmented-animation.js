import { useLayoutEffect, useState } from 'react';
import { useInView } from '../../utils/use-in-view.js';
/** One entry sequence per mount; updates and later viewport entries keep the completed drawing. */
export function useSegmentedAnimation(element, animated) {
    const [phase, setPhase] = useState('waiting');
    const isInView = useInView(element, { enabled: animated && phase === 'waiting' });
    const current = phase === 'waiting' && animated && isInView
        ? 'running'
        : phase === 'running' && !animated
            ? 'complete'
            : phase;
    if (current !== phase)
        setPhase(current);
    useLayoutEffect(() => {
        if (!element || !animated || current === 'complete')
            return undefined;
        if (typeof element.ownerDocument.defaultView?.IntersectionObserver !== 'function') {
            setPhase('complete');
            return undefined;
        }
        if (current !== 'running')
            return undefined;
        const animations = element.getAnimations?.({ subtree: true }) ?? [];
        if (animations.length === 0) {
            setPhase('complete');
            return undefined;
        }
        let active = true;
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (active)
                setPhase('complete');
        });
        return () => {
            active = false;
        };
    }, [element, animated, current]);
    return animated ? current : 'complete';
}
//# sourceMappingURL=use-segmented-animation.js.map