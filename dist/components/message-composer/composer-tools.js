import { jsx as _jsx } from "react/jsx-runtime";
import { FileTrigger } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusHandback } from '../../utils/use-focus-handback.js';
import { EmojiPickerTrigger } from '../emoji-picker/emoji-picker.js';
import { Button } from '../button/button.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { attachChosenFiles } from './use-file-drop.js';
/** Opens the system file chooser and hands the chosen files to `onAttach`. */
export function AttachButton({ onAttach, isDisabled, }) {
    const strings = useUiStrings();
    return (_jsx(FileTrigger, { allowsMultiple: true, onSelect: (list) => attachChosenFiles(list, onAttach), children: _jsx(Button, { className: hooks.slotClass('attach'), icon: "attach", label: strings.attachFiles, size: "sm", isDisabled: isDisabled }) }));
}
/**
 * Opens the emoji picker; the chosen emoji (or a custom emoji's `:shortcode:`) goes in at the
 * caret, and focus goes back to the text once the picker has closed.
 */
export function EmojiButton({ onInsert, focusInput, isDisabled, }) {
    const strings = useUiStrings();
    const handback = useFocusHandback(focusInput);
    return (_jsx(EmojiPickerTrigger, { onSelect: (selection) => {
            onInsert(selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`);
            handback.request();
        }, children: _jsx(Button, { ref: handback.ref, className: hooks.slotClass('emoji'), icon: "emoji", label: strings.insertEmoji, size: "sm", isDisabled: isDisabled }) }));
}
/** Leaves edit mode without saving. */
export function CancelButton({ onCancel, isDisabled, }) {
    const strings = useUiStrings();
    return (_jsx(Button, { className: hooks.slotClass('cancel'), icon: "close", label: strings.cancel, variant: "secondary", isDisabled: isDisabled, preventFocusOnPress: true, onPress: onCancel }));
}
/** The send button, Stop while a stoppable reply is pending, or Save while editing: one button that keeps focus. */
export function ComposerAction(props) {
    const { mode, isDisabled } = props;
    const strings = useUiStrings();
    const isStop = mode === 'stop';
    return (_jsx(Button, { className: hooks.slotClass('action'), icon: mode, label: strings[mode], variant: isStop ? 'secondary' : 'primary', shortcut: isStop ? undefined : props.shortcut, 
        // A tooltip in both states keeps one button, so keyboard focus on it survives the switch.
        tooltip: isStop ? strings.stop : undefined, isPending: !isStop && props.isPending, isDisabled: isDisabled || (!isStop && !props.canSubmit), focusableWhenDisabled: !isDisabled, preventFocusOnPress: true, onPress: isStop ? props.onStop : props.onSubmit }));
}
//# sourceMappingURL=composer-tools.js.map