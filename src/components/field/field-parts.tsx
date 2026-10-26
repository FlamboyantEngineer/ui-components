import { useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { ControlSize } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import { Button } from '../button/button.js';
import { TextMatch } from '../text-match/text-match.js';
import type { FieldSeverity, FieldState, FieldValidation } from './field-state.js';

export type FieldLabelLayout =
  | 'control-label'
  | 'label-control'
  | 'label-colon-control'
  | 'control-only';

/** The id, name, description and state attributes a field gives its control. */
export interface FieldControlProps {
  id: string;
  /** Publishes the control element to the field, which focuses it after a restore. */
  ref: SlotRef;
  /** The label text, in the `control-only` layout, which draws no label element. */
  'aria-label': string | undefined;
  'aria-labelledby': string | undefined;
  'aria-describedby': string | undefined;
  'aria-errormessage': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
  readOnly: boolean;
  disabled: boolean;
}

export const fieldHooks = createHooks('field', [
  'label',
  'required',
  'colon',
  'control',
  'help',
  'menu',
  'decoration',
  'description',
  'message',
]);

const controlSizes: readonly ControlSize[] = ['xs', 'sm', 'md', 'lg'];

/** The size of a button inside or beside a control of `size`: one step smaller, never below `xs`. */
export function toInnerControlSize(size: ControlSize): ControlSize {
  return controlSizes[Math.max(0, controlSizes.indexOf(size) - 1)] ?? 'xs';
}

export interface FieldIds {
  control: string;
  label: string;
  description: string;
  decoration: string;
  message: string;
  help: string;
}

/** Ids for the field's parts, derived from the caller's `id` or a generated one. */
export function useFieldIds(id: string | undefined): FieldIds {
  const generated = useId();
  const base = id ?? generated;
  return {
    control: `${base}-control`,
    label: `${base}-label`,
    description: `${base}-description`,
    decoration: `${base}-decoration`,
    message: `${base}-message`,
    help: `${base}-help`,
  };
}

function joinIds(...ids: Array<string | false>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

/**
 * The control's props: it is named by the label element, or by `label` when the layout draws none,
 * and described by the parts the field renders.
 */
export function toFieldControlProps(
  state: FieldState<unknown>,
  ids: FieldIds,
  parts: {
    ref: SlotRef;
    label: string | undefined;
    hasDescription: boolean;
    hasDecoration: boolean;
  },
): FieldControlProps {
  const { status, message } = state.validation;
  const isInvalid = status === 'invalid';
  return {
    id: ids.control,
    ref: parts.ref,
    'aria-label': parts.label,
    'aria-labelledby': parts.label === undefined ? ids.label : undefined,
    'aria-describedby': joinIds(
      parts.hasDescription && ids.description,
      parts.hasDecoration && ids.decoration,
      Boolean(message) && ids.message,
    ),
    'aria-errormessage': isInvalid ? ids.message : undefined,
    'aria-invalid': isInvalid || undefined,
    'aria-required': state.isRequired || undefined,
    readOnly: state.isReadOnly,
    disabled: state.isDisabled,
  };
}

export function FieldLabel({
  ids,
  label,
  layout,
  isRequired,
}: {
  ids: FieldIds;
  label: string;
  layout: FieldLabelLayout;
  isRequired: boolean;
}) {
  return (
    <label {...fieldHooks.slot('label')} id={ids.label} htmlFor={ids.control}>
      <TextMatch>{label}</TextMatch>
      {isRequired ? (
        <span {...fieldHooks.slot('required')} aria-hidden="true">
          *
        </span>
      ) : null}
      {layout === 'label-colon-control' ? (
        <span {...fieldHooks.slot('colon')} aria-hidden="true">
          :
        </span>
      ) : null}
    </label>
  );
}

function severityOf({ status }: FieldValidation): FieldSeverity | null {
  if (status === 'invalid') return 'error';
  return status === 'warning' ? 'warning' : null;
}

/** The message region. It stays in the document so assistive technology announces new messages. */
export function FieldMessage({
  id,
  validation,
  children,
}: {
  id: string;
  validation: FieldValidation;
  children: ReactNode;
}) {
  return (
    <div
      {...fieldHooks.slot('message', { severity: severityOf(validation) })}
      id={id}
      aria-live="polite"
      aria-atomic="true"
    >
      {validation.message ? children : null}
    </div>
  );
}

/** The help button: its tooltip shows the help, which also describes the button while closed. */
export function FieldHelp({
  id,
  label,
  size,
  children,
}: {
  id: string;
  label: string;
  size: ControlSize;
  children: ReactNode;
}) {
  const strings = useUiStrings();
  return (
    <>
      <Button
        icon="help"
        size={size}
        label={strings.fieldHelp(label)}
        tooltip={children}
        className={fieldHooks.slotClass('help')}
        aria-describedby={id}
      />
      <span id={id} hidden>
        {children}
      </span>
    </>
  );
}
