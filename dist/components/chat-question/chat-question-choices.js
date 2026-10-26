import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from 'react';
import { CheckboxGroup as AriaCheckboxGroup, RadioGroup as AriaRadioGroup, } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Markdown } from '../markdown/markdown.js';
import { ChoiceOption, QuestionTextField } from './chat-question-fields.js';
import { chatQuestionHooks as hooks, findPreviewOption, pickMultiple, pickSingle, } from './chat-question-model.js';
/** The option a focused radio or checkbox input stands for, by its value. */
function readFocusedValue(target) {
    const isChoice = target instanceof HTMLInputElement && (target.type === 'radio' || target.type === 'checkbox');
    return isChoice ? target.value : null;
}
/** The question's options, then Other when it allows one, each as a radio or a checkbox. */
function ChoiceOptions({ item, draft, otherValue, }) {
    const strings = useUiStrings();
    const mode = item.selectionMode === 'multiple' ? 'multiple' : 'single';
    return (_jsxs(_Fragment, { children: [item.options.map((option) => (_jsx(ChoiceOption, { option: option, selectionMode: mode, isSelected: draft.optionIds.includes(option.id) }, option.id))), item.allowsOther ? (_jsx(ChoiceOption, { option: { id: otherValue, label: strings.questionOther }, selectionMode: mode, isSelected: draft.isOther, isOther: true })) : null] }));
}
/** A radio group (one option) or a checkbox group (any options), named by the question. */
function ChoiceGroup(props) {
    const { item, draft, isReadOnly, labelId, otherValue, onPick } = props;
    const options = _jsx(ChoiceOptions, { item: item, draft: draft, otherValue: otherValue });
    if (item.selectionMode === 'multiple') {
        return (_jsx(AriaCheckboxGroup, { ...hooks.slot('options'), "aria-labelledby": labelId, isReadOnly: isReadOnly, value: draft.isOther ? [...draft.optionIds, otherValue] : [...draft.optionIds], onChange: (values) => onPick(pickMultiple(draft, values, otherValue)), children: options }));
    }
    return (_jsx(AriaRadioGroup, { ...hooks.slot('options'), "aria-labelledby": labelId, isReadOnly: isReadOnly, value: draft.isOther ? otherValue : (draft.optionIds[0] ?? null), onChange: (value) => onPick(pickSingle(draft, value, otherValue)), children: options }));
}
/** The preview of the focused or chosen option, as Markdown, in a group named after the option. */
function ChoicePreview({ label, source }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...hooks.slot('preview'), role: "group", "aria-label": strings.questionPreview(label), children: _jsx(Markdown, { source: source }) }));
}
/**
 * The answer area of a question with options: the group, the Other field once Other is chosen,
 * and the preview of the focused or chosen option. Choosing Other focuses its field, except when
 * an arrow key chose it while moving through the radios, so the arrow keys keep moving.
 */
export function QuestionChoices({ item, draft, onDraftChange, isReadOnly, labelId, isRevealed, onEnter, }) {
    const strings = useUiStrings();
    const otherValue = `${useId()}-other`;
    const [focusedId, setFocusedId] = useState(null);
    const [focusesOther, setFocusesOther] = useState(false);
    const isArrowKey = useRef(false);
    const preview = findPreviewOption(item, { draft, focusedId });
    const pick = (next) => {
        if (next.isOther && !draft.isOther)
            setFocusesOther(!isArrowKey.current);
        onDraftChange(next);
    };
    const onBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
            setFocusedId(null);
    };
    return (_jsxs("div", { ...hooks.slot('answer', { hasPreview: item.options.some((option) => option.preview) }), onKeyDownCapture: (event) => {
            isArrowKey.current = event.key.startsWith('Arrow');
        }, onPointerDownCapture: () => {
            isArrowKey.current = false;
        }, onFocus: (event) => setFocusedId(readFocusedValue(event.target)), onBlur: onBlur, children: [_jsx(ChoiceGroup, { item: item, draft: draft, isReadOnly: isReadOnly, labelId: labelId, otherValue: otherValue, onPick: pick }), draft.isOther ? (_jsx(QuestionTextField, { slot: "other", label: strings.questionOtherAnswer, draft: draft, onDraftChange: onDraftChange, isReadOnly: isReadOnly, isRevealed: isRevealed, onEnter: onEnter, autoFocus: focusesOther })) : null, preview?.preview ? _jsx(ChoicePreview, { label: preview.label, source: preview.preview }) : null] }));
}
//# sourceMappingURL=chat-question-choices.js.map