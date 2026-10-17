import type { KeyboardEvent, Ref } from 'react';
import { Button as AriaButton, SelectValueContext, useSlottedContext } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Icon, toIconProps } from '../icon/icon.js';
import type { ChosenSelectOption } from './select-options.js';

export interface SelectTriggerProps {
  ref: Ref<HTMLButtonElement>;
  /** The chosen option of a single select. A multiple select shows its choices as chips. */
  chosen: ChosenSelectOption | null;
  /** The committed option a single select's edit replaced, shown before the current one. */
  previous: ChosenSelectOption | null;
  placeholder: string;
  /** Handles keys before the select does, to open the filter from a printable key. */
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}

const hooks = createHooks('select-field', [
  'frame',
  'trigger',
  'previous',
  'value',
  'value-icon',
  'value-label',
  'chevron',
]);

function OptionIcon({ option, slot }: { option: ChosenSelectOption; slot: 'value-icon' }) {
  return option.icon ? (
    <Icon {...toIconProps(option.icon)} className={hooks.slotClass(slot)} />
  ) : null;
}

/**
 * The frame of a select field: the previous value while a single select is dirty, then the trigger
 * with the chosen option's icon and label (or the placeholder) and a chevron. The value element is
 * the one React Aria names the trigger with, so the trigger reads as its value and the field's
 * label; the previous value stays outside the button, readable on its own.
 */
export function SelectTrigger({
  ref,
  chosen,
  previous,
  placeholder,
  onKeyDownCapture,
}: SelectTriggerProps) {
  const valueProps = useSlottedContext(SelectValueContext);
  return (
    <div {...hooks.slot('frame')} onKeyDownCapture={onKeyDownCapture}>
      {previous ? (
        <FieldPreviousValue className={hooks.slotClass('previous')}>
          <OptionIcon option={previous} slot="value-icon" />
          {previous.label}
        </FieldPreviousValue>
      ) : null}
      <AriaButton ref={ref} className={hooks.slotClass('trigger')}>
        <span
          {...hooks.slot('value', { placeholder: !chosen, missing: chosen?.isMissing })}
          id={valueProps?.id}
        >
          {chosen ? <OptionIcon option={chosen} slot="value-icon" /> : null}
          <span {...hooks.slot('value-label')}>{chosen ? chosen.label : placeholder}</span>
        </span>
        <Glyph name="chevron-down" className={hooks.slotClass('chevron')} />
      </AriaButton>
    </div>
  );
}
