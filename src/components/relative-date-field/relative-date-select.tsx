import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValueContext,
  useSlottedContext,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { useLayerZIndex } from '../portal/portal.js';
import type { RelativeDateText } from './relative-date.js';

/** One preset of the list, with whether the field's bounds refuse it. */
export interface RelativePresetItem {
  id: string;
  label: string;
  isDisabled: boolean;
}

export interface PresetSelectProps {
  control: FieldControlProps;
  state: FieldState<unknown>;
  items: readonly RelativePresetItem[];
  text: RelativeDateText | null;
  placeholder: string;
  onPick: (id: string) => void;
  /** Drawn beside the presets in the popover, such as a calendar. */
  aside?: ReactNode;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

const hooks = createHooks('relative-date-field', [
  'select',
  'trigger',
  'value',
  'chevron',
  'popover',
  'listbox',
  'option',
]);

function RelativeTrigger({
  control,
  text,
  placeholder,
}: Pick<PresetSelectProps, 'control' | 'text' | 'placeholder'>) {
  const valueProps = useSlottedContext(SelectValueContext);
  return (
    <AriaButton ref={control.ref} className={hooks.slotClass('trigger')}>
      <span {...hooks.slot('value', { placeholder: !text })} id={valueProps?.id}>
        {text ? text.relative : placeholder}
      </span>
      <Glyph name="chevron-down" className={hooks.slotClass('chevron')} />
    </AriaButton>
  );
}

/**
 * The preset list: a select that never holds a choice, so picking the same preset again commits.
 * Its popover can hold more beside the list, such as a calendar.
 */
export function PresetSelect({
  control,
  state,
  items,
  text,
  placeholder,
  onPick,
  aside,
  ...open
}: PresetSelectProps) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <AriaSelect
      {...open}
      className={hooks.slotClass('select')}
      id={control.id}
      aria-label={control['aria-label']}
      aria-labelledby={control['aria-labelledby']}
      aria-describedby={control['aria-describedby']}
      value={null}
      onChange={(key) => {
        if (key !== null) onPick(String(key));
      }}
      isOpen={state.isReadOnly ? false : open.isOpen}
      isDisabled={state.isDisabled}
      isRequired={state.isRequired}
      isInvalid={state.validation.status === 'invalid'}
      validationBehavior="aria"
    >
      <RelativeTrigger control={control} text={text} placeholder={placeholder} />
      <Popover {...hooks.slot('popover', { layer: 'dropdown' })} offset={4} style={{ zIndex }}>
        <ListBox className={hooks.slotClass('listbox')} items={items}>
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.label}
              isDisabled={item.isDisabled}
              className={hooks.slotClass('option')}
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
        {aside}
      </Popover>
    </AriaSelect>
  );
}
