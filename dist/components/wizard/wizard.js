import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { Form } from '../form/form.js';
import { InlineError } from '../inline-error/inline-error.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { Steps } from '../steps/steps.js';
import { useWizardNavigation } from './wizard-navigation.js';
const hooks = createHooks('wizard', [
    'steps',
    'form',
    'panel',
    'heading',
    'error',
    'footer',
    'action',
]);
function WizardFooter({ navigation, steps, onCancel, finishLabel }) {
    const strings = useUiStrings();
    const { index, isPending, goTo, skip } = navigation;
    const previous = steps[index - 1];
    const isLast = index >= steps.length - 1;
    const action = (name) => hooks.slot('action', { action: name });
    return (_jsxs("div", { ...hooks.slot('footer'), children: [onCancel ? (_jsx(Button, { ...action('cancel'), variant: "tertiary", isDisabled: isPending, onPress: onCancel, children: strings.cancel })) : null, previous ? (_jsx(Button, { ...action('back'), isDisabled: isPending, onPress: () => goTo(previous.id), children: strings.back })) : null, steps[index]?.isOptional && !isLast ? (_jsx(Button, { ...action('skip'), variant: "tertiary", isDisabled: isPending, onPress: skip, children: strings.skip })) : null, _jsx(Button, { ...action(isLast ? 'finish' : 'next'), type: "submit", variant: "primary", isPending: isPending, children: isLast ? (finishLabel ?? strings.finish) : strings.next })] }));
}
/**
 * A multi-step task: the list of steps, the current step's panel, and Back, Skip, Next and Finish.
 * Next checks the step's fields as a form submit does, then the step's own `validate`, before
 * moving on; focus moves to the new step's heading. It renders inline or inside a `Modal`.
 */
export function Wizard({ steps, currentId, defaultCurrentId, onCurrentIdChange, onFinish, onCancel, finishLabel, orientation = 'horizontal', headingLevel, className, ...rest }) {
    const navigation = useWizardNavigation({
        steps,
        currentId,
        defaultCurrentId,
        onCurrentIdChange,
        onFinish,
    });
    const headingId = useId();
    const Heading = `h${useHeadingLevel(headingLevel)}`;
    const step = steps[navigation.index];
    const items = steps.map((entry, position) => ({
        id: entry.id,
        label: entry.label,
        description: entry.description,
        isOptional: entry.isOptional,
        status: navigation.statuses[position],
    }));
    const data = { orientation, pending: navigation.isPending };
    return (_jsxs("div", { role: "group", ...rest, ...hooks.root({ className, props: rest, data }), children: [_jsx(Steps, { items: items, currentId: step?.id, orientation: orientation, isDisabled: navigation.isPending, onAction: navigation.goTo, className: hooks.slotClass('steps') }), _jsxs(Form, { className: hooks.slotClass('form'), onSubmit: navigation.submit, children: [step ? (_jsxs("div", { ...hooks.slot('panel'), role: "group", "aria-labelledby": headingId, children: [_jsx(Heading, { ...hooks.slot('heading'), id: headingId, ref: navigation.headingRef, tabIndex: -1, children: step.label }), step.content] }, toKeyIdentity(step.id))) : null, navigation.failure?.message ? (_jsx(InlineError, { className: hooks.slotClass('error'), children: navigation.failure.message })) : null, _jsx(WizardFooter, { navigation: navigation, steps: steps, onCancel: onCancel, finishLabel: finishLabel })] })] }));
}
//# sourceMappingURL=wizard.js.map