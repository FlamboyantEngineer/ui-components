import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../../primitives/index.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { chatQuestionHooks as hooks, isQuestionAnswered, } from './chat-question-model.js';
/**
 * A pending card's questions as tabs, one per question labelled by its header, the shown one
 * selected; the counter after them; and the shown question in the panel. An answered question's
 * tab says so in its description and, with the `icon` mark, with a check before its label.
 */
export function QuestionTabs({ questions, drafts, step, answeredMark, onSelect, children, }) {
    const strings = useUiStrings();
    const answeredId = useId();
    const current = questions[step];
    const select = (key) => {
        const index = questions.findIndex((item) => item.id === key);
        if (index !== -1)
            onSelect(index);
    };
    return (_jsxs(Tabs, { className: hooks.slotClass('tabs'), size: "sm", selectedKey: current?.id, onSelectionChange: select, children: [_jsx(TabList, { "aria-label": strings.questionSteps, scrollButtons: true, children: questions.map((item, index) => {
                    const isAnswered = isQuestionAnswered(item, drafts[item.id]);
                    return (_jsx(Tab, { id: item.id, ...hooks.slot('tab', { answered: isAnswered }), icon: isAnswered && answeredMark === 'icon' ? 'check' : undefined, "aria-describedby": isAnswered ? answeredId : undefined, children: item.header || strings.questionStep(index + 1) }, item.id));
                }) }), _jsxs("span", { ...hooks.slot('progress'), children: [_jsx("span", { "aria-hidden": "true", children: strings.questionCounter(step + 1, questions.length) }), _jsx(VisuallyHidden, { elementType: "span", children: strings.questionProgress(step + 1, questions.length) })] }), _jsx("span", { id: answeredId, hidden: true, children: strings.questionAnsweredTab }), questions.map((item) => (_jsx(TabPanel, { id: item.id, className: hooks.slotClass('panel'), children: item.id === current?.id ? children : null }, item.id)))] }));
}
//# sourceMappingURL=chat-question-tabs.js.map