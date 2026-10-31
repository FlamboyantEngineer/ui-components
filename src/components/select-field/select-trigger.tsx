'use client';

import { ChevronDownGlyph, CloseGlyph } from '../../core/glyphs.js';
import type { KeyboardEvent, Ref } from 'react';
import {
  Button as AriaButton,
  ButtonContext,
  SelectValueContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { Glyph } from '../../core/provider.js';
import { FieldPreviousValue } from '../field/field.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import type { ChosenSelectOption } from './select-options.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

interface SelectTriggerProps {
  ref: Ref<HTMLButtonElement>;
  /** The chosen option of a single select. A multiple select shows its choices as chips. */
  chosen: ChosenSelectOption | null;
  /** A multiple select's count of its choices (`2 selected`), shown in place of the placeholder. */
  summary: string | null;
  /** The committed option a single select's edit replaced, shown before the current one. */
  previous: ChosenSelectOption | null;
  placeholder: string;
  /** Names the clear button after the trigger; `null` draws none. */
  clearLabel: string | null;
  onClear: () => void;
  /** Handles keys before the select does, to open the filter from a printable key. */
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}

function OptionIcon({ option, slot }: { option: ChosenSelectOption; slot: 'value-icon' }) {
  return option.icon ? (
    <Icon {...toIconProps(option.icon)} className={hooks.slotClass(slot)} />
  ) : null;
}

/**
 * The frame of a select field: the previous value while a single select is dirty, then the trigger
 * with the chosen option's icon and label (a multiple select's count, or the placeholder) and a
 * chevron, then the clear button. The value element is
 * the one React Aria names the trigger with, so the trigger reads as its value and the field's
 * label; the previous value stays outside the button, readable on its own.
 */
export function SelectTrigger({
  ref,
  chosen,
  previous,
  placeholder,
  summary,
  clearLabel,
  onClear,
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
          {...hooks.slot('value', {
            placeholder: !chosen && !summary,
            missing: chosen?.isMissing,
          })}
          id={valueProps?.id}
        >
          {chosen ? <OptionIcon option={chosen} slot="value-icon" /> : null}
          <span {...hooks.slot('value-label')}>{chosen?.label ?? summary ?? placeholder}</span>
        </span>
        <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('chevron')} />
      </AriaButton>
      {clearLabel ? (
        // Inside the select every button would otherwise take the trigger's props.
        <ButtonContext value={null}>
          <Button
            className={hooks.slotClass('clear')}
            icon={CloseGlyph}
            label={clearLabel}
            variant="bare"
            size="xs"
            onPress={onClear}
          />
        </ButtonContext>
      ) : null}
    </div>
  );
}
