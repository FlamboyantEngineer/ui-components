import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Menu, MenuItem, MenuPopover, MenuSection, MenuTrigger } from '../menu/menu.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { useChatModelChoice } from './use-chat-model-choice.js';
const hooks = createHooks('chat-model-picker', ['model', 'effort', 'menu']);
// Menu keys start with their section, so a model and an effort may share an id.
const modelPrefix = 'model:';
const effortPrefix = 'effort:';
/** A model's menu item: its name with its badge, then its description or why it is unavailable. */
function renderModelItem(model) {
    return (_jsxs(MenuItem, { id: modelPrefix + model.id, textValue: model.label, description: model.isDisabled ? (model.disabledReason ?? model.description) : model.description, isDisabled: model.isDisabled, 
        // An unavailable model stays reachable by arrow keys, so its reason can be read.
        focusableWhenDisabled: true, children: [model.label, model.badge ? (_jsxs(_Fragment, { children: [' ', _jsx(Badge, { size: "sm", tone: "info", children: model.badge })] })) : null] }, model.id));
}
function renderEffortItem(effort) {
    return (_jsx(MenuItem, { id: effortPrefix + effort.id, textValue: effort.label, description: effort.description, children: effort.label }, effort.id));
}
/** The menu: the models, then the efforts while the current model takes one, each a single choice. */
function ChatModelMenu({ models, choice, }) {
    const strings = useUiStrings();
    const { model, effort } = choice;
    const choose = (key) => {
        const value = String(key);
        if (value.startsWith(modelPrefix))
            choice.chooseModel(value.slice(modelPrefix.length));
        else
            choice.chooseEffort(value.slice(effortPrefix.length));
    };
    return (_jsxs(Menu, { className: hooks.slotClass('menu'), onAction: choose, shouldCloseOnSelect: true, children: [_jsx(MenuSection, { id: "models", title: strings.chatModel, selectionMode: "single", selectedKeys: model ? [modelPrefix + model.id] : [], children: models.map(renderModelItem) }), effort ? (_jsx(MenuSection, { id: "efforts", title: strings.chatEffort, selectionMode: "single", selectedKeys: [effortPrefix + effort.id], children: choice.efforts.map(renderEffortItem) })) : null] }));
}
/**
 * A compact composer tool that shows the current model, and its effort when the model takes one,
 * and opens a menu to choose them: the models with their descriptions, badges and unavailable
 * reasons, then the efforts the chosen model takes. Each choice is controlled or held, optionally
 * in the provider's storage.
 */
export function ChatModelPicker(props) {
    const { models, isDisabled = false, className, id } = props;
    const strings = useUiStrings();
    const choice = useChatModelChoice(props);
    const { model, effort } = choice;
    if (!model)
        return null;
    return (_jsxs(MenuTrigger, { children: [_jsx(Button, { ...hooks.root({ className, props, data: { hasEffort: effort !== undefined } }), id: id, variant: "ghost", size: "sm", endIcon: "chevron-down", isDisabled: isDisabled, "aria-label": strings.chatModelTrigger(model.label, effort?.label), children: _jsx(MetaLine, { items: [
                        _jsx("span", { ...hooks.slot('model'), children: model.label }, "model"),
                        effort ? (_jsx("span", { ...hooks.slot('effort'), children: effort.label }, "effort")) : null,
                    ] }) }), _jsx(MenuPopover, { placement: "top start", children: _jsx(ChatModelMenu, { models: models, choice: choice }) })] }));
}
//# sourceMappingURL=chat-model-picker.js.map