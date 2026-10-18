import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Form as AriaForm } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { mergeRefs } from '../../utils/merge-props.js';
import {
  FieldScopeContext,
  useFieldScope,
  type FieldRegistration,
  type FieldValidationBehavior,
  type FieldValidationErrors,
  type FieldValidationMode,
} from '../field/field.js';
import { FormProblemContext, createFormProblemStore, inDocumentOrder } from './form-problems.js';

/** The HTTP method a native submit uses. */
export type FormMethod = 'get' | 'post' | 'dialog';

export interface FormProps extends BaseProps, AriaLabellingProps {
  /** The `<form>` element, for code that submits it with `requestSubmit()`. */
  ref?: Ref<HTMLFormElement> | undefined;
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
 * The browser fires `invalid` at each invalid control of a native submit it blocked, in document
 * order. The first event of that run shows every field's validation and focuses its control.
 */
function useInvalidFocus(fields: Set<FieldRegistration>) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const element = form.current;
    if (!element) return undefined;
    let isFocusing = false;
    const onInvalid = (event: Event) => {
      for (const field of fields) field.revealValidation();
      if (isFocusing || !(event.target instanceof HTMLElement)) return;
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
export function Form({
  validationMode = 'submit',
  validationBehavior = 'native',
  validationErrors,
  onSubmit,
  className,
  children,
  ref,
  ...rest
}: FormProps) {
  const parent = useFieldScope();
  const [fields] = useState(() => new Set<FieldRegistration>());
  const [problems] = useState(() => createFormProblemStore(fields));
  const register = useCallback(
    (field: FieldRegistration) => {
      fields.add(field);
      problems.notify();
      return () => {
        fields.delete(field);
        problems.notify();
      };
    },
    [fields, problems],
  );
  const scope = useMemo(
    () => ({
      ...parent,
      validationMode,
      validationBehavior,
      validationErrors,
      register,
      onIssuesChange: problems.notify,
    }),
    [parent, validationMode, validationBehavior, validationErrors, register, problems],
  );
  const form = useInvalidFocus(fields);
  const formRef = useMemo(() => mergeRefs(form, ref), [form, ref]);
  const errorLists = useMemo(() => toErrorLists(validationErrors), [validationErrors]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    const ordered = inDocumentOrder(fields);
    for (const field of ordered) field.revealValidation();
    const blocking = ordered.find((field) => field.isBlocking());
    if (!blocking) return onSubmit?.(event);
    event.preventDefault();
    blocking.focus();
  };
  return (
    <AriaForm
      {...rest}
      {...hooks.root({ className, props: rest })}
      ref={formRef}
      validationBehavior={validationBehavior}
      validationErrors={errorLists}
      onSubmit={submit}
    >
      <FieldScopeContext.Provider value={scope}>
        <FormProblemContext.Provider value={problems}>{children}</FormProblemContext.Provider>
      </FieldScopeContext.Provider>
    </AriaForm>
  );
}

export { useFormProblems } from './form-problems.js';
export type { FormProblem, FormProblemSource } from './form-problems.js';
