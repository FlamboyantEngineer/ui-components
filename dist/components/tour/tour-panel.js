import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Dialog, Heading } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
const hooks = createHooks('tour', [
    'dialog',
    'header',
    'title',
    'progress',
    'body',
    'footer',
    'skip',
    'back',
    'next',
]);
/**
 * One step's dialog: the title, which names it, the step count, the body, then Skip, Back and Next
 * (Finish on the last step). Escape skips the tour.
 */
export function TourPanel({ id, step, count, title, content, onBack, onNext, onSkip, }) {
    const strings = useUiStrings();
    const isLast = step === count - 1;
    const dialogRef = useRef(null);
    const skip = useRef(onSkip);
    skip.current = onSkip;
    // The dialog takes no key handler, so Escape is heard on its element.
    useEffect(() => {
        const dialog = dialogRef.current;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape' || event.defaultPrevented)
                return;
            event.preventDefault();
            skip.current();
        };
        dialog?.addEventListener('keydown', onKeyDown);
        return () => dialog?.removeEventListener('keydown', onKeyDown);
    }, []);
    return (_jsxs(Dialog, { ref: dialogRef, id: id, className: hooks.slotClass('dialog'), children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx(Heading, { slot: "title", className: hooks.slotClass('title'), children: title }), _jsx("span", { ...hooks.slot('progress'), children: strings.stepOfTotal(step + 1, count) })] }), isEmptyNode(content) ? null : _jsx("div", { ...hooks.slot('body'), children: content }), _jsxs("div", { ...hooks.slot('footer'), children: [isLast ? null : (_jsx(Button, { variant: "ghost", size: "sm", className: hooks.slotClass('skip'), onPress: onSkip, children: strings.skip })), step > 0 ? (_jsx(Button, { variant: "secondary", size: "sm", className: hooks.slotClass('back'), onPress: onBack, children: strings.back })) : null, _jsx(Button, { variant: "primary", size: "sm", className: hooks.slotClass('next'), onPress: onNext, children: isLast ? strings.finish : strings.next })] })] }));
}
//# sourceMappingURL=tour-panel.js.map