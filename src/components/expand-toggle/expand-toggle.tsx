import { useState } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton, type IconButtonProps } from '../icon-button/icon-button.js';

export interface ExpandToggleProps
  extends
    Pick<IconButtonProps, 'isDisabled' | 'excludeFromTabOrder' | 'aria-controls' | 'ref'>,
    BaseProps {
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
  size?: IconButtonProps['size'];
}

const hooks = createHooks('expand-toggle');

/**
 * A chevron button that expands and collapses a row or region. It points to the inline end while
 * collapsed and down while expanded, and its presses never reach the row around it.
 */
export function ExpandToggle({
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isExpandable = true,
  label,
  size = 'sm',
  className,
  ...rest
}: ExpandToggleProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = isExpanded ?? internalExpanded;

  if (!isExpandable) {
    return (
      <span
        {...hooks.root({ className, props: rest, data: { size, leaf: true } })}
        id={rest.id}
        aria-hidden="true"
      />
    );
  }

  const collapsedGlyph = direction === 'rtl' ? 'chevron-left' : 'chevron-right';
  return (
    <IconButton
      {...rest}
      data-expanded={expanded || undefined}
      className={mergeClassNames(hooks.className, className)}
      icon={expanded ? 'chevron-down' : collapsedGlyph}
      label={label ?? (expanded ? strings.collapse : strings.expand)}
      size={size}
      aria-expanded={expanded}
      onPress={() => {
        if (isExpanded === undefined) setInternalExpanded(!expanded);
        onExpandedChange?.(!expanded);
      }}
    />
  );
}
