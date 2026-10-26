import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Choice } from '../choice-group/choice-group.js';
import { TextField } from '../text-field/text-field.js';
import { chatQuestionHooks as hooks, } from './chat-question-model.js';
/** Enter without a modifier, outside an input method's composition. */
function isPlainEnter(event) {
    const hasModifier = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
    return event.key === 'Enter' && !hasModifier && !event.nativeEvent.isComposing;
}
/**
 * A required single-line field for the reader's own words. Its committed value follows its value,
 * so it is never dirty: no restore button, and Escape stays with the conversation around it.
 */
export function QuestionTextField({ slot, label, draft, onDraftChange, isReadOnly, isRevealed, onEnter, autoFocus, }) {
    const strings = useUiStrings();
    return (_jsx(TextField, { className: hooks.slotClass(slot), label: label, labelLayout: "control-only", placeholder: strings.questionAnswerPlaceholder, value: draft.otherText, committedValue: draft.otherText, onChange: (otherText) => onDraftChange({ ...draft, otherText }), isReadOnly: isReadOnly, isRequired: !isReadOnly, validationMode: isRevealed ? 'immediate' : 'blur', autoFocus: autoFocus, onKeyDown: (event) => {
            if (!isPlainEnter(event))
                return;
            event.preventDefault();
            onEnter();
        } }));
}
/**
 * One option: its radio or checkbox, named by the label and the "Recommended" badge, and described
 * by the option's description.
 */
export function ChoiceOption({ option, selectionMode, isSelected, isOther }) {
    const strings = useUiStrings();
    const descriptionId = useId();
    const describedBy = option.description ? descriptionId : undefined;
    const label = (_jsxs(_Fragment, { children: [option.label, option.isRecommended ? (_jsxs(_Fragment, { children: [' ', _jsx(Badge, { size: "sm", tone: "info", className: hooks.slotClass('recommended'), children: strings.questionRecommended })] })) : null] }));
    return (_jsxs("div", { ...hooks.slot('option', {
            selected: isSelected,
            recommended: option.isRecommended,
            other: isOther,
        }), children: [selectionMode === 'single' ? (_jsx(Choice, { value: option.id, "aria-describedby": describedBy, children: label })) : (_jsx(Checkbox, { value: option.id, "aria-describedby": describedBy, children: label })), option.description ? (_jsx("span", { ...hooks.slot('description'), id: descriptionId, children: option.description })) : null] }));
}
//# sourceMappingURL=chat-question-fields.js.map