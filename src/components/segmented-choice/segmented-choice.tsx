import { isValidElement, useState, type ReactNode, type Ref } from 'react';
import { ToggleButton, ToggleButtonGroup, type Selection } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Icon } from '../icon/icon.js';

export type SegmentedChoiceSize = 'sm' | 'md' | 'lg';

/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';

export interface SegmentedChoiceOption {
  value: string;
  /** The segment's text and accessible name. */
  label: string;
  /** A decorative built-in glyph name or icon node before the label. */
  icon?: GlyphName | ReactNode;
  isDisabled?: boolean | undefined;
}

export interface SegmentedChoiceProps {
  options: readonly SegmentedChoiceOption[];
  /** The value in effect (controlled). `null` selects nothing. */
  value?: string | null | undefined;
  /** The initial value when uncontrolled. */
  defaultValue?: string | null | undefined;
  /** Receives the picked value, or `null` when the choice is cleared. */
  onChange?: ((value: string | null) => void) | undefined;
  /**
   * The value in effect comes from elsewhere (a default or a parent) rather than being set here.
   * Picking its segment again commits it as an explicit value.
   */
  isInherited?: boolean | undefined;
  /** Picking the selected segment of an explicit value again clears the choice to `null`. */
  isClearable?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** Segments stay focusable but picking does nothing. */
  isReadOnly?: boolean | undefined;
  isInvalid?: boolean | undefined;
  /** Segment block size. Defaults to `md`. */
  size?: SegmentedChoiceSize | undefined;
  /** How segments share the width. Defaults to `equal`. */
  sizing?: SegmentedChoiceSizing | undefined;
  /** Arrow-key axis and layout direction. Defaults to `horizontal`. */
  orientation?: 'horizontal' | 'vertical' | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  'aria-describedby'?: string | undefined;
  'aria-details'?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('segmented-choice', ['segment', 'icon', 'label']);

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

/** One of a few mutually exclusive values, drawn as a run of segments. */
export function SegmentedChoice({
  options,
  value,
  defaultValue = null,
  onChange,
  isInherited = false,
  isClearable = false,
  isDisabled = false,
  isReadOnly = false,
  isInvalid = false,
  size = 'md',
  sizing = 'equal',
  orientation = 'horizontal',
  className,
  ...rest
}: SegmentedChoiceProps) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internalValue;

  const commit = (next: string | null) => {
    if (!controlled) setInternalValue(next);
    onChange?.(next);
  };

  const handleSelectionChange = (keys: Selection) => {
    if (isReadOnly) return;
    const [picked] = keys === 'all' ? [] : [...keys];
    if (picked !== undefined) {
      commit(String(picked));
      return;
    }
    // The selected segment was picked again.
    if (current === null) return;
    if (isInherited) commit(current);
    else if (isClearable) commit(null);
  };

  const groupState: Record<string, unknown> = {};
  if (isReadOnly) groupState['aria-readonly'] = true;
  if (isInvalid) groupState['aria-invalid'] = true;

  return (
    <ToggleButtonGroup
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: {
          size,
          sizing,
          inherited: isInherited,
          readonly: isReadOnly,
          invalid: isInvalid,
        },
      })}
      selectionMode="single"
      selectedKeys={current === null ? [] : [current]}
      onSelectionChange={handleSelectionChange}
      orientation={orientation}
      isDisabled={isDisabled}
      {...(Object.keys(groupState).length > 0
        ? { render: (props) => <div {...props} {...groupState} /> }
        : {})}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          id={option.value}
          isDisabled={option.isDisabled}
          {...hooks.slot('segment', { value: option.value })}
        >
          {option.icon ? (
            isGlyphName(option.icon) ? (
              <Icon glyph={option.icon} size={size} className={hooks.slotClass('icon')} />
            ) : (
              <Icon size={size} className={hooks.slotClass('icon')}>
                {option.icon}
              </Icon>
            )
          ) : null}
          <span {...hooks.slot('label', { label: option.label })}>{option.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
