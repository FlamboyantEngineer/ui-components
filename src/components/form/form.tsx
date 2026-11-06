'use client';

import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Form as AriaForm, FormContext } from '../../primitives/index.js';
import { useFormBoundary } from '../../utils/form-boundary.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import {
  type FieldRegistration,
  FieldScopeContext,
  type FieldValidationBehavior,
  type FieldValidationErrors,
  type FieldValidationMode,
  useFieldScope,
} from '../field/field.js';
import {
  createFormProblemStore,
  FormProblemContext,
  type FormProblemStore,
  inDocumentOrder,
} from './form-problems.js';
import {
  createFormValidityStore,
  type FormBlocker,
  FormValidityContext,
  type FormValidityStore,
} from './form-validity.js';

/** The HTTP method a native submit uses. */
export type FormMethod = 'get' | 'post' | 'dialog';

export interface FormProps extends BaseProps, AriaLabellingProps, RefProps<HTMLFormElement> {
  /** When the fields inside show their validation, unless a field sets its own. Defaults to `submit`. */
  validationMode?: FieldValidationMode | undefined;
  /**
   * `native` (the default) lets the browser's constraint validation block a submit through the
   * fields' custom validity; `aria` reports validation through ARIA only. Fields that set none use it.
   */
  validationBehavior?: FieldValidationBehavior | undefined;
  /** Errors from outside the form (a server's answer), by field name. */
  validationErrors?: FieldValidationErrors | undefined;
  /** Where a native submit sends the form's data. */
  action?: string | undefined;
  /** The HTTP method of a native submit. */
  method?: FormMethod | undefined;
  /**
   * Called with the blocking fields whenever the form's verdict on its fields as they stand changes
   * (an empty list once nothing blocks), without revealing their validation. See `useFormValidity`.
   */
  onValidityChange?: ((blockers: readonly FormBlocker[]) => void) | undefined;
  /** Called with the submit event once every field inside passes; prevent its default to stay. */
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  children?: ReactNode;
}

const hooks = createHooks('form');

/** The errors as the building block takes them: each list a copy it may own. */
function toErrorLists(errors: FieldValidationErrors | undefined) {
  if (!errors) return undefined;
  return Object.fromEntries(
    Object.entries(errors).map(([name, error]) => [
      name,
      typeof error === 'string' ? error : [...error],
    ]),
  );
}

/**
 * Notifies the problem store once for all the fields that register or change their issues in one
 * commit (a mount, a submit that reveals every field), rather than once for each field.
 */
function useBatchedNotify(store: Pick<FormProblemStore | FormValidityStore, 'notify'>) {
  const [requests, setRequests] = useState(0);
  useEffect(() => {
    if (requests > 0) store.notify();
  }, [requests, store]);
  return useCallback(() => setRequests((count) => count + 1), []);
}

/** The form's verdict on its fields, told to `onValidityChange` as it changes. */
function useValidity(
  fields: Set<FieldRegistration>,
  onValidityChange: FormProps['onValidityChange'],
) {
  const [validity] = useState(() => createFormValidityStore(fields));
  const latest = useRef(onValidityChange);
  useEffect(() => {
    latest.current = onValidityChange;
  });
  useEffect(() => validity.subscribe(() => latest.current?.(validity.getBlockers())), [validity]);
  return { validity, notifyValidity: useBatchedNotify(validity) };
}

/**
 * The browser fires `invalid` at each invalid control of a native submit it blocked, in document
 * order. Only the first event of that run shows every field's validation, once each, and focuses its
 * control, through its field when it has one, so a collapsed or filtered container opens first.
 */
function useInvalidFocus(fields: Set<FieldRegistration>) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const element = form.current;
    if (!element) return undefined;
    let isFocusing = false;
    const onInvalid = (event: Event) => {
      // One pass of native validation fires an event per invalid control, synchronously: only its
      // first reveals the fields and focuses, so the work stays proportional to the form's size.
      if (isFocusing) return;
      isFocusing = true;
      queueMicrotask(() => (isFocusing = false));
      for (const field of fields) field.revealValidation();
      if (!isHTMLElement(event.target)) return;
      // The field focuses its own control, revealing it first when a container hides it.
      const { target } = event;
      const field = [...fields].find((entry) => entry.getElement()?.contains(target));
      if (field) field.focus();
      else target.focus();
    };
    element.addEventListener('invalid', onInvalid, true);
    return () => element.removeEventListener('invalid', onInvalid, true);
  }, [fields]);
  return form;
}

/**
 * Tells the stores when fields move in the document without changing their issues (keyed fields
 * reordered), so the problem list and the blockers keep document order. It sorts the fields once per
 * batch of DOM changes inside the form, and only notifies when their order changed.
 */
function useOrderNotify(
  form: RefObject<HTMLFormElement | null>,
  fields: ReadonlySet<FieldRegistration>,
  notify: () => void,
) {
  useEffect(() => {
    const element = form.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return undefined;
    let order = inDocumentOrder(fields);
    const observer = new view.MutationObserver(() => {
      const next = inDocumentOrder(fields);
      if (next.length === order.length && next.every((field, index) => field === order[index])) {
        return;
      }
      order = next;
      notify();
    });
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [form, fields, notify]);
}

/**
 * A form on React Aria's `Form` that validates its fields on submit: it shows every field's
 * validation and, while any field has an error or is still being checked, blocks the submit and
 * focuses the first such field. `validationErrors` (a server's answer) show on the fields they name
 * until their values change. A `ProblemList` inside it lists the problems its fields show.
 */
export function Form({
  validationMode = 'submit',
  validationBehavior = 'native',
  validationErrors,
  onValidityChange,
  onSubmit,
  className,
  children,
  ref,
  ...rest
}: FormProps) {
  const parent = useFieldScope();
  const boundary = useFormBoundary();
  const [fields] = useState(() => new Set<FieldRegistration>());
  const [problems] = useState(() => createFormProblemStore(fields));
  const notify = useBatchedNotify(problems);
  const { validity, notifyValidity } = useValidity(fields, onValidityChange);
  const notifyAll = useCallback(() => {
    notify();
    notifyValidity();
  }, [notify, notifyValidity]);
  const register = useCallback(
    (field: FieldRegistration) => {
      fields.add(field);
      notify();
      notifyValidity();
      return () => {
        fields.delete(field);
        notify();
        notifyValidity();
      };
    },
    [fields, notify, notifyValidity],
  );
  const scope = useShallowStable({
    ...parent,
    validationMode,
    validationBehavior,
    validationErrors,
    register,
    onIssuesChange: notify,
    onValidityChange: notifyValidity,
    boundary,
  });
  const bounded = useMemo(
    () => ({
      problems: { value: problems, boundary },
      validity: { value: validity, boundary },
    }),
    [problems, validity, boundary],
  );
  const form = useInvalidFocus(fields);
  useOrderNotify(form, fields, notifyAll);
  const formRef = useMemo(() => mergeRefs(form, ref), [form, ref]);
  const errorLists = useMemo(() => toErrorLists(validationErrors), [validationErrors]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    // React bubbles the submit of a form in a portal (a dialog's) through this one: it is not ours.
    if (event.target !== event.currentTarget) return undefined;
    if (validity.validate()) return onSubmit?.(event);
    event.preventDefault();
  };
  // React Aria's form hands its props to a form inside it; this form takes none from one around it.
  return (
    <FormContext value={null}>
      <AriaForm
        {...rest}
        {...hooks.root({ className, props: rest })}
        ref={formRef}
        validationBehavior={validationBehavior}
        validationErrors={errorLists}
        onSubmit={submit}
      >
        <FieldScopeContext value={scope}>
          <FormProblemContext value={bounded.problems}>
            <FormValidityContext value={bounded.validity}>{children}</FormValidityContext>
          </FormProblemContext>
        </FieldScopeContext>
      </AriaForm>
    </FormContext>
  );
}

export type { FormProblem, FormProblemSource } from './form-problems.js';
export { useFormProblems } from './form-problems.js';
export type { FormBlocker, FormValidity } from './form-validity.js';
export { useFormValidity } from './form-validity.js';
