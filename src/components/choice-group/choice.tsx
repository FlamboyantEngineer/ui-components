'use client';

import { useContext, useId, type ReactNode, type Ref } from 'react';
import {
  CheckboxGroupStateContext,
  RadioButton,
  RadioField,
  Text,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { renderElement, type ElementRender } from '../../utils/render-element.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { ChoiceContext } from './choice-group.js';

export interface ChoiceRenderState {
  isSelected: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}
export interface ChoiceProps extends BaseProps, AriaLabellingProps {
  /** Value chosen by this item, submitted under the group's name. */
  value: string;
  isDisabled?: boolean | undefined;
  /** Receives the native input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Plain or rich visible label. */
  children?: ReactNode;
  /** Description below the label. */
  description?: ReactNode;
  /** Replaces the root div while preserving behavior and hooks. */
  render?: ElementRender<'div', ChoiceRenderState> | undefined;
}
const hooks = createHooks('choice', ['button', 'indicator', 'label', 'description']);

/** One radio or checkbox according to its ChoiceGroup's selection mode. */
export function Choice({ children, description, className, ...rest }: ChoiceProps) {
  const settings = useContext(ChoiceContext);
  const group = useContext(CheckboxGroupStateContext);
  const descriptionId = useId();
  if (settings.selectionMode === 'single')
    return (
      <RadioField {...rest} {...hooks.root({ className, props: rest })}>
        <RadioButton {...hooks.slot('button')}>
          <span {...hooks.slot('indicator')} aria-hidden="true" />
          {isEmptyNode(children) ? null : <span {...hooks.slot('label')}>{children}</span>}
        </RadioButton>
        {isEmptyNode(description) ? null : (
          <Text slot="description" {...hooks.slot('description')}>
            {description}
          </Text>
        )}
      </RadioField>
    );
  const { render, ...props } = rest;
  const state: ChoiceRenderState = {
    ...settings,
    isSelected: group?.value.includes(rest.value) ?? false,
    isDisabled: settings.isDisabled || Boolean(rest.isDisabled),
  };
  const describedBy =
    [rest['aria-describedby'], isEmptyNode(description) ? undefined : descriptionId]
      .filter(Boolean)
      .join(' ') || undefined;
  return renderElement(
    'div',
    {
      ...hooks.root({
        className,
        data: {
          selected: state.isSelected,
          disabled: state.isDisabled,
          readonly: state.isReadOnly,
          invalid: state.isInvalid,
          required: state.isRequired,
        },
      }),
      children: (
        <>
          <Checkbox
            {...props}
            {...hooks.slot('button')}
            size={settings.size}
            aria-describedby={describedBy}
          >
            {isEmptyNode(children) ? null : <span {...hooks.slot('label')}>{children}</span>}
          </Checkbox>
          {isEmptyNode(description) ? null : (
            <span id={descriptionId} {...hooks.slot('description')}>
              {description}
            </span>
          )}
        </>
      ),
    },
    { render, state },
  );
}
