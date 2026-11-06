'use client';

import type { ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { FieldIssue } from '../field/field.js';
import { PropertyPanel } from '../property-panel/property-panel.js';
import type { SelectFieldItem } from '../select-field/select-field.js';
import {
  BuiltInConstraintControl,
  type ConstraintControl,
  ConstraintUnsetButton,
} from './constraint-controls.js';
import { constraintEditorHooks as hooks } from './constraint-editor-hooks.js';
import {
  type ConstraintCompare,
  type ConstraintEditorKind,
  type ConstraintIssue,
  type ConstraintName,
  constraintsByKind,
  type ConstraintSet,
  validateConstraints,
} from './constraint-model.js';

export interface ConstraintEditorProps
  extends RefProps<HTMLElement>, BaseProps, AriaLabellingProps {
  /** The kind of field whose constraints are edited, which decides the constraints offered. */
  kind: ConstraintEditorKind;
  /** The constraints, controlled. */
  value?: ConstraintSet | undefined;
  /** The constraints to start with, uncontrolled. Defaults to none set. */
  defaultValue?: ConstraintSet | undefined;
  /** Hears each change with the problems of the new set; the editor repairs nothing. */
  onChange?: ((value: ConstraintSet, issues: readonly ConstraintIssue[]) => void) | undefined;
  /** The constraints the field declares, from those its kind takes. Defaults to all of them. */
  constraints?: readonly ConstraintName[] | undefined;
  /** The choices an options field's default picks from. */
  options?: readonly SelectFieldItem[] | undefined;
  /** Orders bounds and defaults, such as a host's own number type; numbers otherwise compare as decimal text. */
  compare?: ConstraintCompare | undefined;
  /** The host's or server's errors, on the constraint each belongs to. */
  errors?: Partial<Record<ConstraintName, string>> | undefined;
  /** Constraints shown but not editable, such as ones inherited or held by permissions. */
  lockedConstraints?: readonly ConstraintName[] | undefined;
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The controls' height on the shared control scale. Defaults to `md`. */
  size?: ControlSize | undefined;
  /** Draws a constraint's control in place of the library's; return `undefined` to keep it. */
  renderConstraint?: ((control: ConstraintControl) => ReactNode) | undefined;
}

const none: ConstraintSet = {};

const toKebabCase = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The set with one constraint set to `value`, or without it when `value` is `undefined`. */
function withConstraint(
  set: ConstraintSet,
  name: ConstraintName,
  value: ConstraintSet[ConstraintName],
) {
  const { [name]: _dropped, ...rest } = set;
  return value === undefined ? rest : { ...rest, [name]: value };
}

/**
 * A property panel that authors a field's constraints: required, a default, numeric or date
 * bounds, text lengths and pattern, or how many options a list takes, by the field's `kind`. Unset
 * constraints stay apart from `false`, `0` and empty text; bounds are text, so no digit is lost.
 * Problems such as a maximum below the minimum show on the control they belong to, and nothing is
 * repaired or dropped.
 */
export function ConstraintEditor({
  ref,
  kind,
  value,
  defaultValue = none,
  onChange,
  constraints,
  options = [],
  compare,
  errors,
  lockedConstraints = [],
  isReadOnly = false,
  isDisabled,
  size = 'md',
  renderConstraint,
  className,
  ...rest
}: ConstraintEditorProps) {
  const strings = useUiStrings();
  const [set, setSet] = useControllableState(value, defaultValue);
  const issues = validateConstraints(kind, set, compare);
  const offered = constraintsByKind[kind].filter(
    (name) => !constraints || constraints.includes(name),
  );
  const toControl = (name: ConstraintName): ConstraintControl => {
    const hostError = errors?.[name];
    const shown: FieldIssue[] = [
      ...issues
        .filter((issue) => issue.constraint === name)
        .map((issue) => ({
          severity: 'error' as const,
          message: strings.constraintIssue(issue.reason),
        })),
      ...(hostError ? [{ severity: 'error' as const, message: hostError }] : []),
    ];
    return {
      name,
      label: strings.constraintLabel(name),
      value: set[name],
      onChange: (next) => {
        const updated = withConstraint(set, name, next);
        setSet(updated);
        onChange?.(updated, validateConstraints(kind, updated, compare));
      },
      isReadOnly: isReadOnly || lockedConstraints.includes(name),
      issues: shown,
      size,
    };
  };
  return (
    <PropertyPanel
      ref={ref}
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { kind, size, invalid: issues.length > 0 },
      })}
      isDisabled={isDisabled}
    >
      {offered.map((name) => {
        const control = toControl(name);
        return (
          <div
            key={name}
            {...hooks.slot('row', {
              constraint: toKebabCase(name),
              locked: lockedConstraints.includes(name),
            })}
          >
            {renderConstraint?.(control) ?? (
              <BuiltInConstraintControl kind={kind} control={control} options={options} />
            )}
            <ConstraintUnsetButton control={control} />
          </div>
        );
      })}
    </PropertyPanel>
  );
}
