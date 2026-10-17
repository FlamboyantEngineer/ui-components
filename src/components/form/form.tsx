import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Form as AriaForm, type FormProps as AriaFormProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import {
  FieldScopeContext,
  useFieldScope,
  type FieldRegistration,
  type FieldValidationMode,
} from '../field/field.js';

export interface FormProps
  extends Omit<AriaFormProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  /** When the fields inside show their validation, unless a field sets its own. Defaults to `submit`. */
  validationMode?: FieldValidationMode | undefined;
  children?: ReactNode;
}

const hooks = createHooks('form');

function inDocumentOrder(fields: Iterable<FieldRegistration>): FieldRegistration[] {
  return [...fields].sort((left, right) => {
    const first = left.getElement();
    const second = right.getElement();
    if (!first || !second) return 0;
    return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
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
 * until their values change.
 */
export function Form({
  validationMode = 'submit',
  validationBehavior = 'native',
  validationErrors,
  onSubmit,
  className,
  children,
  ...rest
}: FormProps) {
  const parent = useFieldScope();
  const [fields] = useState(() => new Set<FieldRegistration>());
  const register = useCallback(
    (field: FieldRegistration) => {
      fields.add(field);
      return () => void fields.delete(field);
    },
    [fields],
  );
  const scope = useMemo(
    () => ({ ...parent, validationMode, validationBehavior, validationErrors, register }),
    [parent, validationMode, validationBehavior, validationErrors, register],
  );
  const form = useInvalidFocus(fields);
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
      ref={form}
      validationBehavior={validationBehavior}
      validationErrors={validationErrors}
      onSubmit={submit}
    >
      <FieldScopeContext.Provider value={scope}>{children}</FieldScopeContext.Provider>
    </AriaForm>
  );
}
