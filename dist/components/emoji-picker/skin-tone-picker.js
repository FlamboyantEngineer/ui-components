import { jsx as _jsx } from "react/jsx-runtime";
import { Radio, RadioGroup } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { skinTones, withSkinTone } from './emoji-catalog.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
const hooks = createHooks('emoji-picker', ['skin-tones', 'skin-tone']);
/** A row of raised-hand swatches, one radio per skin tone, for the enclosing picker. */
export function EmojiPickerSkinTones({ className, ...rest }) {
    const strings = useUiStrings();
    const { tone, setTone } = useEmojiPickerContext();
    return (_jsx(RadioGroup, { ...rest, ...hooks.slot('skin-tones', undefined, className), "aria-label": strings.skinTone, orientation: "horizontal", value: tone, onChange: (value) => setTone(value), children: skinTones.map((item) => (_jsx(Radio, { value: item, className: hooks.slotClass('skin-tone'), "aria-label": strings.skinToneName(item), children: _jsx("span", { "aria-hidden": "true", children: withSkinTone('✋', item) }) }, item))) }));
}
//# sourceMappingURL=skin-tone-picker.js.map