import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { Form as AriaForm } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { FieldScopeContext, useFieldScope, } from '../field/field.js';
import { FormProblemContext, createFormProblemStore, inDocumentOrder, } from './form-problems.js';
const hooks = createHooks('form');
/** The errors as the building block takes them: each list a copy it may own. */
function toErrorLists(errors) {
    if (!errors)
        return undefined;
    return Object.fromEntries(Object.entries(errors).map(([name, error]) => [
        name,
        typeof error === 'string' ? error : [...error],
    ]));
}
/**
 * Notifies the problem store once for all the fields that register or change their issues in one
 * commit (a mount, a submit that reveals every field), rather than once for each field.
 */
function useBatchedNotify(problems) {
    const [requests, setRequests] = useState(0);
    useEffect(() => {
        if (requests > 0)
            problems.notify();
    }, [requests, problems]);
    return useCallback(() => setRequests((count) => count + 1), []);
}
/**
 * The browser fires `invalid` at each invalid control of a native submit it blocked, in document
 * order. The first event of that run shows every field's validation and focuses its control.
 */
function useInvalidFocus(fields) {
    const form = useRef(null);
    useEffect(() => {
        const element = form.current;
        if (!element)
            return undefined;
        let isFocusing = false;
        const onInvalid = (event) => {
            for (const field of fields)
                field.revealValidation();
            if (isFocusing || !(event.target instanceof HTMLElement))
                return;
            isFocusing = true;
            queueMicrotask(() => (isFocusing = false));
            event.target.focus();
        };
        element.addEventListener('invalid', onInvalid, true);
        return () => element.removeEventListener('invalid', onInvalid, true);
    }, [fields]);
    return form;
}
/**
 * A form on React Aria's `Form` that validates its fields on submit: it shows every field's
 * validation and, while any field has an error or is still being checked, blocks the submit and
 * focuses the first such field. `validationErrors` (a server's answer) show on the fields they name
 * until their values change. A `ProblemList` inside it lists the problems its fields show.
 */
export function Form({ validationMode = 'submit', validationBehavior = 'native', validationErrors, onSubmit, className, children, ref, ...rest }) {
    const parent = useFieldScope();
    const [fields] = useState(() => new Set());
    const [problems] = useState(() => createFormProblemStore(fields));
    const notify = useBatchedNotify(problems);
    const register = useCallback((field) => {
        fields.add(field);
        notify();
        return () => {
            fields.delete(field);
            notify();
        };
    }, [fields, notify]);
    const scope = useMemo(() => ({
        ...parent,
        validationMode,
        validationBehavior,
        validationErrors,
        register,
        onIssuesChange: notify,
    }), [parent, validationMode, validationBehavior, validationErrors, register, notify]);
    const form = useInvalidFocus(fields);
    const formRef = useMemo(() => mergeRefs(form, ref), [form, ref]);
    const errorLists = useMemo(() => toErrorLists(validationErrors), [validationErrors]);
    const submit = (event) => {
        const ordered = inDocumentOrder(fields);
        for (const field of ordered)
            field.revealValidation();
        const blocking = ordered.find((field) => field.isBlocking());
        if (!blocking)
            return onSubmit?.(event);
        event.preventDefault();
        blocking.focus();
    };
    return (_jsx(AriaForm, { ...rest, ...hooks.root({ className, props: rest }), ref: formRef, validationBehavior: validationBehavior, validationErrors: errorLists, onSubmit: submit, children: _jsx(FieldScopeContext.Provider, { value: scope, children: _jsx(FormProblemContext.Provider, { value: problems, children: children }) }) }));
}
export { useFormProblems } from './form-problems.js';
//# sourceMappingURL=form.js.map