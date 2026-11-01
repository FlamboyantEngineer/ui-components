'use client';

import { containsFocus, isFocused } from '../../utils/focus-target.js';
import {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  CheckboxGroupStateContext,
  RadioGroup as AriaRadioGroup,
} from '../../primitives/index.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import { Checkbox } from '../checkbox/checkbox.js';
import {
  FieldFormValue,
  toAriaControlProps,
  type FieldControlProps,
  type FieldState,
} from '../field/field.js';
import { ChoiceContext, type ChoiceGroupProps } from './choice-group.js';
import { choiceGroupHooks as hooks } from './choice-group-hooks.js';

interface ChoiceBoxProps {
  control: FieldControlProps;
  state: FieldState<string | null | string[]>;
  config: Pick<ChoiceGroupProps, 'name' | 'orientation' | 'selectAllLabel'>;
  /** The values of the choices on screen, enabled or not; `null` until they are read. */
  listed: readonly string[] | null;
  onListedChange: Dispatch<SetStateAction<readonly string[] | null>>;
  children: ReactNode;
}

function keepEqualList(next: string[]) {
  return <L extends readonly string[] | null>(previous: L): L | string[] =>
    previous?.length === next.length && previous.every((key, index) => key === next[index])
      ? previous
      : next;
}

function useChoiceControl(
  publish: SlotRef,
  value: string | null | string[],
  onListedChange: ChoiceBoxProps['onListedChange'],
) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<readonly string[]>([]);
  useLayoutEffect(() => {
    const update = () => {
      const listed = [
        ...(box.current?.querySelectorAll<HTMLInputElement>(
          'input[type=radio],input[type=checkbox]',
        ) ?? []),
      ].filter((input) => !input.closest(`.${hooks.slotClass('select-all')}`));
      const inputs = listed.filter((input) => !input.disabled);
      publish(
        (Array.isArray(value) ? inputs[0] : inputs.find((input) => input.checked)) ??
          inputs[0] ??
          null,
      );
      setEnabled(keepEqualList(inputs.map((input) => input.value)));
      onListedChange(keepEqualList(listed.map((input) => input.value)));
    };
    update();
    const observer = new MutationObserver(update);
    if (box.current)
      observer.observe(box.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'value'],
      });
    return () => observer.disconnect();
  }, [publish, value, onListedChange]);
  useLayoutEffect(() => {
    if (Array.isArray(value)) return;
    const element = box.current;
    const selected = element?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    if (selected && !isFocused(selected) && containsFocus(element)) selected.focus();
  }, [value]);
  return { box, enabled };
}

function SelectAll({
  label,
  enabled,
  state,
}: {
  label: string;
  enabled: readonly string[];
  state: FieldState<string | null | string[]>;
}) {
  const settings = useContext(ChoiceContext);
  const value = Array.isArray(state.value) ? state.value : [];
  const selected = new Set(value);
  const count = enabled.filter((key) => selected.has(key)).length;
  const all = enabled.length > 0 && count === enabled.length;
  const pick = () => {
    const next = all
      ? value.filter((key) => !enabled.includes(key))
      : [...value, ...enabled.filter((key) => !selected.has(key))];
    state.setValue(next);
    state.commit();
  };
  return (
    <CheckboxGroupStateContext value={null}>
      <Checkbox
        {...hooks.slot('select-all')}
        size={settings.size}
        isSelected={all}
        isIndeterminate={count > 0 && !all}
        isDisabled={state.isDisabled || enabled.length === 0}
        isReadOnly={state.isReadOnly}
        onChange={pick}
      >
        {label}
      </Checkbox>
    </CheckboxGroupStateContext>
  );
}

/**
 * A disabled choice's input is left out of its form, so a selected one is submitted through a hidden
 * input instead, as its selection still counts.
 */
function HeldChoices({
  name,
  enabled,
  listed,
  state,
}: {
  name: string | undefined;
  enabled: readonly string[];
  listed: readonly string[] | null;
  state: FieldState<string | null | string[]>;
}) {
  const value = state.value;
  const keys = value === null ? [] : Array.isArray(value) ? value : [value];
  const held = keys.filter((key) => listed?.includes(key) && !enabled.includes(key));
  return <FieldFormValue name={name} value={held} isDisabled={state.isDisabled} />;
}

export function ChoiceBox({
  control,
  state,
  config,
  listed,
  onListedChange,
  children,
}: ChoiceBoxProps) {
  const { box, enabled } = useChoiceControl(control.ref, state.value, onListedChange);
  const held = <HeldChoices name={config.name} enabled={enabled} listed={listed} state={state} />;
  const { selectionMode } = useContext(ChoiceContext);
  const { selectAllLabel, orientation = 'vertical', ...rest } = config;
  const aria = toAriaControlProps(control);
  const pick = (value: string | string[]) => {
    state.setValue(value);
    state.commit();
  };
  if (selectionMode === 'single')
    return (
      <AriaRadioGroup
        {...rest}
        {...aria}
        {...hooks.slot('box')}
        orientation={orientation}
        ref={box}
        value={typeof state.value === 'string' ? state.value : null}
        onChange={pick}
      >
        {children}
        {held}
      </AriaRadioGroup>
    );
  const { 'aria-errormessage': _message, ...groupAria } = aria;
  return (
    <AriaCheckboxGroup
      {...rest}
      {...groupAria}
      {...hooks.slot('box', { orientation })}
      ref={box}
      value={Array.isArray(state.value) ? state.value : []}
      onChange={pick}
    >
      {selectAllLabel ? <SelectAll label={selectAllLabel} enabled={enabled} state={state} /> : null}
      {children}
      {held}
    </AriaCheckboxGroup>
  );
}
