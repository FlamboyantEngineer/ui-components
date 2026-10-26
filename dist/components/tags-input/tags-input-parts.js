import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useMemo, useState, } from 'react';
import { Group, Input, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { createSlotRegistry } from '../../utils/slot-registry.js';
import { assignOccurrenceKeys } from '../../utils/stable-keys.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
export const tagsInputHooks = createHooks('tags-input', ['group', 'tags', 'input']);
const hooks = tagsInputHooks;
/** The keys that move from the input into the tags and from the last tag back, in reading order. */
function useArrowKeys() {
    const { direction } = useLocale();
    return direction === 'rtl'
        ? { towardTags: 'ArrowRight', towardInput: 'ArrowLeft' }
        : { towardTags: 'ArrowLeft', towardInput: 'ArrowRight' };
}
/**
 * The input's keys (Enter adds, Backspace in an empty input and the arrow key at its start move to
 * the last tag), the last tag's key back to the input, and adding on blur.
 */
function useEntryKeys(entry, slots) {
    const keys = useArrowKeys();
    const focusInput = () => slots.read('input')?.focus();
    const readRows = () => [
        ...(slots.read('group')?.querySelectorAll('[role="row"]') ?? []),
    ];
    const focusLastTag = () => readRows().at(-1)?.focus();
    const onInputKeyDown = (event) => {
        if (event.nativeEvent.isComposing)
            return;
        const { selectionStart, selectionEnd } = event.currentTarget;
        if (event.key === 'Enter' && entry.text.trim() !== '') {
            event.preventDefault();
            entry.enter(entry.text);
        }
        else if (event.key === 'Backspace' && entry.text === '') {
            focusLastTag();
        }
        else if (event.key === keys.towardTags && selectionStart === 0 && selectionEnd === 0) {
            event.preventDefault();
            focusLastTag();
        }
    };
    // The tag group wraps from its last tag to its first; in a tags input that key returns to the input.
    const onTagKeyDownCapture = (event) => {
        if (event.key !== keys.towardInput || event.target !== readRows().at(-1))
            return;
        event.preventDefault();
        event.stopPropagation();
        focusInput();
    };
    const onBlur = (event) => {
        const isInside = slots.read('group')?.contains(event.relatedTarget);
        if (entry.addOnBlur && !isInside && entry.text.trim() !== '')
            entry.enter(entry.text);
    };
    return { focusInput, onInputKeyDown, onTagKeyDownCapture, onBlur };
}
/** Pastes text with a delimiter or line break as tags, in place of the input's selection. */
function pasteTags(event, entry) {
    const pasted = event.clipboardData.getData('text/plain');
    if (!entry.splits(pasted))
        return;
    event.preventDefault();
    const { value, selectionStart, selectionEnd } = event.currentTarget;
    const start = selectionStart ?? value.length;
    entry.enter(value.slice(0, start) + pasted + value.slice(selectionEnd ?? start));
}
/** Hidden inputs that submit each tag under the form name; a disabled field submits nothing. */
function TagInputs({ name, tags, isDisabled, }) {
    return tags.map((tag) => (_jsx("input", { type: "hidden", name: name, value: tag.value, disabled: isDisabled }, tag.key)));
}
/**
 * The tags in the library's `TagGroup`. It renders again only when the tags or their state change,
 * not on each keystroke in the input, so typing stays fast with many tags.
 */
const TagsInputTags = memo(function TagsInputTags({ tags, label, isDisabled, onRemove, }) {
    return (_jsx(TagGroup, { className: hooks.slotClass('tags'), "aria-label": label, items: tags, onRemove: onRemove, disabledKeys: isDisabled ? tags.map((tag) => tag.key) : undefined, children: (tag) => _jsx(Tag, { id: tag.key, children: tag.value }) }));
});
/**
 * The field's control: the tags in the library's `TagGroup`, then the text input, framed as one
 * box, and a hidden input per tag for the form. Removing a tag returns focus to the input.
 */
export function TagsInputControl({ control, state, label, entry, placeholder, name, }) {
    const strings = useUiStrings();
    const [slots] = useState(() => createSlotRegistry());
    const inputRef = useMemo(() => mergeRefs(control.ref, slots.ref('input')), [control.ref, slots]);
    const { focusInput, onInputKeyDown, onTagKeyDownCapture, onBlur } = useEntryKeys(entry, slots);
    const tags = useMemo(() => assignOccurrenceKeys(state.value, (tag) => tag), [state.value]);
    const isEditable = !state.isReadOnly && !state.isDisabled;
    const { setValue, commit } = state;
    const remove = useCallback((removed) => {
        setValue(tags.filter((tag) => !removed.has(tag.key)).map((tag) => tag.value));
        commit();
        slots.read('input')?.focus();
    }, [tags, setValue, commit, slots]);
    return (_jsxs(_Fragment, { children: [_jsxs(Group, { ...hooks.slot('group'), ref: slots.ref('group'), role: "presentation", isDisabled: state.isDisabled, isInvalid: control['aria-invalid'], isReadOnly: state.isReadOnly, onClick: (event) => (event.target === event.currentTarget ? focusInput() : undefined), onKeyDownCapture: onTagKeyDownCapture, children: [tags.length > 0 ? (_jsx(TagsInputTags, { tags: tags, label: strings.selectedValues(label), isDisabled: state.isDisabled, onRemove: isEditable ? remove : undefined })) : null, _jsx(Input, { ...control, ...hooks.slot('input'), ref: inputRef, value: entry.text, placeholder: placeholder, onChange: (event) => entry.type(event.target.value), onKeyDown: onInputKeyDown, onPaste: (event) => pasteTags(event, entry), onBlur: onBlur })] }), name ? _jsx(TagInputs, { name: name, tags: tags, isDisabled: state.isDisabled }) : null] }));
}
//# sourceMappingURL=tags-input-parts.js.map