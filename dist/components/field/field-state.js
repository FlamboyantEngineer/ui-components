import { useCallback, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useAsyncCheck } from './field-async.js';
import { canStepFieldHistory, createFieldHistory, recordFieldHistory, stepFieldHistory, } from './field-history.js';
import { useFieldScope, } from './field-scope.js';
import { checkFieldValue, resolveFieldValidation, selectShownValidation, useExternalIssues, useFieldReveal, } from './field-validation.js';
import { isFieldValueEqual } from './field-value.js';
function firstDefined(...values) {
    return values.find((value) => value !== undefined);
}
/** Whether a menu action has something to do: the field is editable and the target differs. */
function canApply(value, target, isLocked) {
    return !isLocked && target !== undefined && !isFieldValueEqual(value, target);
}
/**
 * The uncontrolled value and committed value (starting from the first of the committed value, the
 * controlled value and the default), and the history, which records every value the field shows.
 */
function useOwnValues({ value, committedValue, defaultValue }) {
    const [draft, setDraft] = useState(() => firstDefined(committedValue, defaultValue));
    const [committed, setCommitted] = useState(() => firstDefined(committedValue, value, defaultValue));
    const [history, setHistory] = useState(() => createFieldHistory(firstDefined(value, committedValue, defaultValue)));
    return { draft, setDraft, committed, setCommitted, history, setHistory };
}
/** The latest value, committed value, options and lock, so actions in one event see each other. */
function useLatest(snapshot) {
    const latest = useRef(snapshot);
    latest.current = snapshot;
    return latest;
}
/**
 * Commits the value: right away, or, after a controlled value changed in the same event, once the
 * caller's value has rendered (a caller may change what it was given, or ignore it), so the
 * committed value is always one the field shows.
 */
function useCommit(latest, setCommitted) {
    const pending = useRef(false);
    const [, rerender] = useReducer((count) => count + 1, 0);
    const commit = useCallback(() => {
        const current = latest.current;
        if (current.isLocked)
            return;
        if (current.isUnsettled) {
            pending.current = true;
            rerender();
            return;
        }
        if (isFieldValueEqual(current.value, current.committedValue))
            return;
        current.committedValue = current.value;
        if (current.options.committedValue === undefined)
            setCommitted(current.value);
        current.options.onCommit?.(current.value);
    }, [latest, setCommitted]);
    useLayoutEffect(() => {
        if (!pending.current)
            return;
        pending.current = false;
        commit();
    });
    return commit;
}
/**
 * The validation of the value: external errors for the field's name, the required check, `validate`
 * and the debounced `validateAsync`, shown as the validation mode allows.
 */
function useFieldValidation(value, options, scope) {
    const strings = useUiStrings();
    const reveal = useFieldReveal(options.validationMode ?? scope.validationMode ?? 'immediate');
    const external = useExternalIssues(scope.validationErrors, options.name, value);
    const own = [...external, ...checkFieldValue(value, options, strings)];
    const check = useAsyncCheck(value, {
        validateAsync: options.validateAsync,
        debounce: options.validationDebounce ?? 0,
        isSkipped: own.some((issue) => issue.severity === 'error'),
    });
    const isPending = Boolean(options.isPending) || check.isRunning;
    const realtime = resolveFieldValidation([...own, ...check.issues], isPending, strings);
    const shown = selectShownValidation(realtime, { external, isRevealed: reveal.isRevealed }, strings);
    return { reveal, realtime, shown };
}
/**
 * The controller every field is built on: it holds or relays the value, knows the committed value,
 * validates, tracks dirty state and keeps a per-field undo history of every value the field shows.
 * A read-only or disabled field refuses every change.
 */
export function useFieldState(options) {
    const scope = useFieldScope();
    const { draft, setDraft, committed, setCommitted, ...own } = useOwnValues(options);
    const value = options.value !== undefined ? options.value : draft;
    const committedValue = options.committedValue !== undefined ? options.committedValue : committed;
    const isDisabled = Boolean(options.isDisabled || scope.isDisabled);
    const isReadOnly = Boolean(options.isReadOnly || scope.isReadOnly);
    const isLocked = isReadOnly || isDisabled;
    const latest = useLatest({ value, committedValue, options, isLocked });
    const { reveal, realtime, shown } = useFieldValidation(value, options, scope);
    const { markChanged } = reveal;
    let history = own.history;
    if (!isFieldValueEqual(history.entries[history.index], value)) {
        history = recordFieldHistory(history, value);
        own.setHistory(history);
    }
    const setValue = useCallback((next) => {
        const current = latest.current;
        if (current.isLocked)
            return;
        current.value = next;
        current.isUnsettled = current.options.value !== undefined;
        markChanged();
        if (current.options.value === undefined)
            setDraft(next);
        current.options.onChange?.(next);
    }, [latest, setDraft, markChanged]);
    const commit = useCommit(latest, setCommitted);
    const apply = (target) => {
        if (!canApply(latest.current.value, target, isLocked))
            return;
        setValue(target);
        commit();
    };
    // A history entry is a value the field showed, `undefined` included.
    const step = (direction) => {
        if (isLocked || !canStepFieldHistory(history, direction))
            return;
        const next = stepFieldHistory(history, direction);
        own.setHistory(next);
        const target = next.entries[next.index];
        if (isFieldValueEqual(latest.current.value, target))
            return;
        setValue(target);
        commit();
    };
    const canClear = !options.isRequired && canApply(value, options.emptyValue, isLocked);
    return {
        value,
        committedValue,
        validation: shown.validation,
        realtimeValidation: realtime.validation,
        issues: shown.issues,
        isDirty: canApply(value, committedValue, isLocked),
        isTouched: reveal.isTouched,
        isRequired: Boolean(options.isRequired),
        isReadOnly,
        isDisabled,
        validationBehavior: options.validationBehavior ?? scope.validationBehavior ?? 'aria',
        canUndo: !isLocked && canStepFieldHistory(history, -1),
        canRedo: !isLocked && canStepFieldHistory(history, 1),
        canClear,
        canSetDefault: canApply(value, options.defaultValue, isLocked),
        setValue,
        commit,
        restore: () => apply(committedValue),
        clear: () => (canClear ? apply(options.emptyValue) : undefined),
        setToDefault: () => apply(options.defaultValue),
        undo: () => step(-1),
        redo: () => step(1),
        touch: reveal.touch,
        revealValidation: reveal.revealValidation,
    };
}
//# sourceMappingURL=field-state.js.map