import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { VisuallyHidden as AriaVisuallyHidden, useFocusWithin } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { mergeProps } from '../../utils/merge-props.js';
const hooks = createHooks('visually-hidden');
/**
 * Content only assistive technology perceives, such as the name of an icon-only control. With
 * `isFocusable` it shows while it or a descendant has focus, as a skip link does.
 */
export function VisuallyHidden({ className, isFocusable = false, ...rest }) {
    const [isFocusWithin, setFocusWithin] = useState(false);
    const { focusWithinProps } = useFocusWithin({
        isDisabled: !isFocusable,
        onFocusWithinChange: setFocusWithin,
    });
    const hookProps = hooks.root({
        className,
        props: rest,
        data: { focusWithin: isFocusable && isFocusWithin },
    });
    return (_jsx(AriaVisuallyHidden, { ...mergeProps(rest, focusWithinProps), ...hookProps, isFocusable: isFocusable }));
}
//# sourceMappingURL=visually-hidden.js.map