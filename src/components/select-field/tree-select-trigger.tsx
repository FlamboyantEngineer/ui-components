'use client';

import { type ReactNode, type Ref, useId, useMemo, useRef } from 'react';
import { ChevronDownGlyph, CloseGlyph } from '../../core/glyphs.js';
import { Glyph } from '../../core/provider.js';
import { Button as AriaButton, DialogTrigger } from '../../primitives/index.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { Button } from '../button/button.js';
import { type FieldControlProps, toAriaControlProps } from '../field/field.js';
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
  const aria = toAriaControlProps(control);
  return (
    <div {...hooks.slot('frame')}>
      <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
        <AriaButton
          {...hooks.slot('trigger')}
          ref={ref}
          id={aria.id}
          aria-label={aria['aria-label']}
          // A button takes no state props but the disabled one; it is named by the label, then its text.
          aria-labelledby={`${aria['aria-labelledby'] ?? aria.id} ${valueId}`}
          aria-describedby={aria['aria-describedby']}
          isDisabled={aria.isDisabled}
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
