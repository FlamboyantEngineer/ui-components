'use client';

import { ChevronDownGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  Select as AriaSelect,
  SelectValueContext,
  useSlottedContext,
  Popover,
} from '../../primitives/index.js';
import { PopoverPresence } from '../popover/popover.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { toAriaControlProps, type FieldControlProps, type FieldState } from '../field/field.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import type { RelativeDateText } from './relative-date.js';
import { DEFAULT_DROPDOWN_OFFSET } from '../../utils/overlay-defaults.js';

/** One preset of the list, with whether the field's bounds refuse it. */
interface RelativePresetItem {
  id: string;
  label: string;
  isDisabled: boolean;
}

interface PresetSelectProps {
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
      <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('chevron')} />
    </AriaButton>
  );
}

/**
 * The preset list: a select that never holds a choice, so picking the same preset again commits.
 * Only the open list picks; a locked field neither opens it nor reports opening. Its popover can
 * hold more beside the list, such as a calendar.
 */
export function PresetSelect({
  control,
  state,
  items,
  text,
  placeholder,
  onPick,
  aside,
  isOpen,
  defaultOpen,
  onOpenChange,
}: PresetSelectProps) {
  const zIndex = useLayerZIndex('dropdown');
  const [open, setOpen] = useControllableState(isOpen, Boolean(defaultOpen), onOpenChange);
  const isLocked = state.isReadOnly || state.isDisabled;
  const isListOpen = open && !isLocked;
  return (
    <AriaSelect
      className={hooks.slotClass('select')}
      {...toAriaControlProps(control)}
      value={null}
      onChange={(key) => {
        // The closed trigger's Arrow Left, Arrow Right and typing pick the first match when the
        // select holds no choice, which would commit a preset the reader never saw.
        if (key !== null && isListOpen) onPick(String(key));
      }}
      isOpen={isListOpen}
      onOpenChange={(next) => {
        if (!isLocked) setOpen(next);
      }}
    >
      <RelativeTrigger control={control} text={text} placeholder={placeholder} />
      <PopoverPresence />
      <Popover
        {...hooks.slot('popover', { layer: 'dropdown' })}
        offset={DEFAULT_DROPDOWN_OFFSET}
        style={{ ...triggerWidthProperty, zIndex }}
      >
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
