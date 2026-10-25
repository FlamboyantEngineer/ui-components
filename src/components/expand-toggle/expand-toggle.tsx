import { useContext } from 'react';
import { DisclosureStateContext, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { GlyphName } from '../../core/glyphs.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button, type ButtonProps } from '../button/button.js';

export interface ExpandToggleProps
  extends
    Pick<
      ButtonProps,
      'isDisabled' | 'isPending' | 'pendingLabel' | 'excludeFromTabOrder' | 'aria-controls' | 'ref'
    >,
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
  size?: ButtonProps['size'];
}

const hooks = createHooks('expand-toggle');

/** The chevron of a disclosure: down while expanded, else pointing to the inline end. */
export function useExpandGlyph(isExpanded: boolean): GlyphName {
  const { direction } = useLocale();
  if (isExpanded) return 'chevron-down';
  return direction === 'rtl' ? 'chevron-left' : 'chevron-right';
}

/**
 * A chevron button that expands and collapses a row or region. It points to the inline end while
 * collapsed and down while expanded, and its presses never reach the row around it. Inside a React
 * Aria `Disclosure` it is the disclosure's trigger, wired to its panel.
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
  // A disclosure owns the state, the panel's id and the press that toggles it.
  const disclosure = useContext(DisclosureStateContext);
  const [own, setOwn] = useControllableState(isExpanded, defaultExpanded, onExpandedChange);
  const expanded = disclosure ? disclosure.isExpanded : own;
  const glyph = useExpandGlyph(expanded);
  const toggleProps = disclosure
    ? { slot: 'trigger', onPress: () => onExpandedChange?.(!expanded) }
    : { 'aria-expanded': expanded, onPress: () => setOwn(!own) };

  if (!isExpandable) {
    return (
      <span
        {...hooks.root({ className, props: rest, data: { size, leaf: true } })}
        id={rest.id}
        aria-hidden="true"
      />
    );
  }

  return (
    <Button
      {...rest}
      data-expanded={expanded || undefined}
      className={mergeClassNames(hooks.className, className)}
      icon={glyph}
      label={label ?? (expanded ? strings.collapse : strings.expand)}
      size={size}
      {...toggleProps}
    />
  );
}
