// Element swapping (specs/COMPOSITION.md).
import { createElement } from 'react';
/** Renders `type` with `props`, or the caller's element from `render` with the same props. */
export function renderElement(type, props, { render, state }) {
    return render ? render(props, state) : createElement(type, props);
}
//# sourceMappingURL=render-element.js.map