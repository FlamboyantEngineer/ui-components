import { jsx as _jsx } from "react/jsx-runtime";
import { DropIndicator } from '../primitives/index.js';
/** A stable collection landing renderer with the owning component's styling hook. */
export function createDropIndicator(className) {
    return (target) => (_jsx(DropIndicator, { target: target, className: className, render: (props) => (_jsx("div", { ...props, "data-position": target.type === 'item' ? target.dropPosition : undefined })) }));
}
//# sourceMappingURL=create-drop-indicator.js.map