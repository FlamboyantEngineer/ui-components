import { jsx as _jsx } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from './button.js';
/** An edge scroll command, with direction and wording shared by tabs and tool strips. */
export function ScrollStripButton({ edge, isHidden, onPress, ...rest }) {
    const strings = useUiStrings();
    const pointsLeft = (edge === 'start') !== (useLocale().direction === 'rtl');
    return (_jsx(Button, { ...rest, icon: pointsLeft ? 'chevron-left' : 'chevron-right', label: edge === 'start' ? strings.scrollBackward : strings.scrollForward, size: "sm", excludeFromTabOrder: true, hidden: isHidden, onPress: () => onPress(edge) }));
}
//# sourceMappingURL=scroll-strip-button.js.map