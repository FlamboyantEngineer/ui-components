import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
const hooks = createHooks('field-restore-button');
/**
 * The icon button that puts a committed value back. Pressing it with a pointer leaves focus on the
 * control being edited.
 */
export function FieldRestoreButton({ label, className, ...rest }) {
    const strings = useUiStrings();
    return (_jsx(Button, { ...rest, ...hooks.root({ className, props: rest }), icon: "restore", label: strings.restoreValue(label), preventFocusOnPress: true }));
}
//# sourceMappingURL=field-restore-button.js.map