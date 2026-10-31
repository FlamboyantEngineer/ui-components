'use client';

import { ChevronDownGlyph, CloseGlyph } from '../../core/glyphs.js';
import { useId, useMemo, useRef, type ReactNode, type Ref } from 'react';
import { Button as AriaButton, DialogTrigger } from '../../primitives/index.js';
import { Glyph } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import type { FieldControlProps } from '../field/field.js';
import { Button } from '../button/button.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

interface TreeSelectTriggerProps {
  control: FieldControlProps;
  /** The caller's ref to the trigger. */
  triggerRef: Ref<HTMLButtonElement> | undefined;
  /** The chosen value's text, or the placeholder. */
  text: string;
  /** Nothing is chosen: `text` is the placeholder. */
  isPlaceholder: boolean;
  /** The chosen key matches no loaded node. */
  isMissing: boolean;
  /** Names the clear button after the trigger; `null` draws none. */
  clearLabel: string | null;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** The popover the trigger opens. */
  popover: ReactNode;
}

/**
 * The frame of a tree select field: the trigger, named by the field's label and its value, with a
 * chevron, which opens the popover, then the clear button, which returns focus to the trigger. The
 * clear button stays outside the dialog trigger, where every press would open the popover.
 */
export function TreeSelectTrigger({
  control,
  triggerRef: callerRef,
  text,
  isPlaceholder,
  isMissing,
  clearLabel,
  onClear,
  isOpen,
  onOpenChange,
  popover,
}: TreeSelectTriggerProps) {
  const valueId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const ref = useMemo(
    () => mergeRefs(triggerRef, control.ref, callerRef),
    [control.ref, callerRef],
  );
  const name = control['aria-labelledby'] ?? control.id;
  return (
    <div {...hooks.slot('frame')}>
      <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
        <AriaButton
          {...hooks.slot('trigger')}
          ref={ref}
          id={control.id}
          aria-label={control['aria-label']}
          aria-labelledby={`${name} ${valueId}`}
          aria-describedby={control['aria-describedby']}
          isDisabled={control.disabled}
        >
          <span
            {...hooks.slot('value', { placeholder: isPlaceholder, missing: isMissing })}
            id={valueId}
          >
            {text}
          </span>
          <Glyph icon={ChevronDownGlyph} className={hooks.slotClass('chevron')} />
        </AriaButton>
        {popover}
      </DialogTrigger>
      {clearLabel ? (
        <Button
          className={hooks.slotClass('clear')}
          icon={CloseGlyph}
          label={clearLabel}
          variant="bare"
          size="xs"
          onPress={() => {
            onClear();
            triggerRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
