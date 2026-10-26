import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  CheckboxGroupStateContext,
  RadioGroup as AriaRadioGroup,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { toAriaControlProps, type FieldControlProps, type FieldState } from '../field/field.js';
import { ChoiceContext, type ChoiceGroupProps } from './choice-group.js';

interface ChoiceBoxProps {
  control: FieldControlProps;
  state: FieldState<string | null | string[]>;
  config: Pick<ChoiceGroupProps, 'name' | 'orientation' | 'selectAllLabel'>;
  children: ReactNode;
}
const hooks = createHooks('choice-group', ['box', 'select-all']);

function useChoiceControl(publish: SlotRef, value: string | null | string[]) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<string[]>([]);
  useLayoutEffect(() => {
    const update = () => {
      const inputs = [
        ...(box.current?.querySelectorAll<HTMLInputElement>(
          'input[type=radio],input[type=checkbox]',
        ) ?? []),
      ].filter((input) => !input.disabled && !input.closest('.ui-choice-group__select-all'));
      publish(
        (Array.isArray(value) ? inputs[0] : inputs.find((input) => input.checked)) ??
          inputs[0] ??
          null,
      );
      const next = inputs.map((input) => input.value);
      setEnabled((previous) =>
        previous.length === next.length && previous.every((key, index) => key === next[index])
          ? previous
          : next,
      );
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
  }, [publish, value]);
  useLayoutEffect(() => {
    if (Array.isArray(value)) return;
    const element = box.current;
    const selected = element?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    const active = element?.ownerDocument.activeElement;
    if (selected && active !== selected && element?.contains(active ?? null)) selected.focus();
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
    <CheckboxGroupStateContext.Provider value={null}>
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
    </CheckboxGroupStateContext.Provider>
  );
}

export function ChoiceBox({ control, state, config, children }: ChoiceBoxProps) {
  const { box, enabled } = useChoiceControl(control.ref, state.value);
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
    </AriaCheckboxGroup>
  );
}
