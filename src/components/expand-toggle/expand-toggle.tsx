import { useState, type Ref } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { ButtonSize } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

export interface ExpandToggleProps {
  /** Whether the controlled region is expanded (controlled). */
  isExpanded?: boolean | undefined;
  /** Initial expanded state (uncontrolled). */
  defaultExpanded?: boolean | undefined;
  /** Called with the requested expanded state when the toggle is pressed. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /**
   * Whether there is anything to expand. Without it the toggle renders an empty, hidden box of the
   * same size, so labels beside it stay aligned. Defaults to `true`.
   */
  isExpandable?: boolean | undefined;
  /** A constant accessible name. Defaults to the provider's `expand` or `collapse` string, by state. */
  label?: string | undefined;
  /** Box size. Defaults to `sm`. */
  size?: ButtonSize | undefined;
  isDisabled?: boolean | undefined;
  /** Keep the toggle out of the tab order, for rows that hold focus and expand with the arrow keys. */
  excludeFromTabOrder?: boolean | undefined;
  /** The id of the region the toggle shows and hides. */
  'aria-controls'?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('expand-toggle');

/**
 * A chevron button that expands and collapses a row or region. It points to the inline end while
 * collapsed and down while expanded, and its presses never reach the row around it.
 */
export function ExpandToggle({
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isExpandable = true,
  label,
  size = 'sm',
  isDisabled = false,
  excludeFromTabOrder = false,
  'aria-controls': ariaControls,
  className,
  id,
  ref,
  ...rest
}: ExpandToggleProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;

  if (!isExpandable) {
    return (
      <span
        {...hooks.root({ className, props: rest, data: { size, leaf: true } })}
        id={id}
        aria-hidden="true"
      />
    );
  }

  return (
    <IconButton
      {...rest}
      data-expanded={expanded || undefined}
      className={mergeClassNames(hooks.className, className)}
      ref={ref}
      id={id}
      icon={expanded ? 'chevron-down' : direction === 'rtl' ? 'chevron-left' : 'chevron-right'}
      label={label ?? (expanded ? strings.collapse : strings.expand)}
      size={size}
      isDisabled={isDisabled}
      excludeFromTabOrder={excludeFromTabOrder}
      aria-expanded={expanded}
      aria-controls={ariaControls}
      onPress={() => {
        const next = !expanded;
        if (controlledExpanded === undefined) setInternalExpanded(next);
        onExpandedChange?.(next);
      }}
    />
  );
}
