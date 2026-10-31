'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ListBoxItem, PopoverContext, useSlottedContext } from '../../primitives/index.js';
import type { ComponentHooks } from '../../core/hooks.js';
import type { Key, SelectableState } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { RemoteSearch } from '../../utils/use-remote-search.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import { TextMatch } from '../text-match/text-match.js';

/** One option of a picker: `Combobox`, `SelectField` and the pickers built on them. */
export interface PickerOption {
  /** The stored value. */
  id: Key;
  /** The visible text, matched while typing or filtering, and announced. */
  label: string;
  /** Secondary text on the option's row; plain text is also matched by a select field's filter. */
  description?: ReactNode;
  /** An imported icon component or rendered element, shown on the row (and the chip). */
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

/** A section of a picker's options, led by its `label` when it has one. */
export interface PickerSection {
  id: Key;
  /** The section's heading, which names its options' group. */
  label?: ReactNode;
  options: readonly PickerOption[];
}

/** An entry of a picker's options: one option or a section of them. */
export type PickerItem = PickerOption | PickerSection;

/** The search state a picker's empty list reports. */
type PickerSearchStatus = Pick<
  RemoteSearch<unknown>,
  'isLoading' | 'hasFailed' | 'isTooShort' | 'minSearchLength'
>;

/** The slots of a picker's option rows. */
type PickerOptionSlot = 'option' | 'option-icon' | 'option-label' | 'option-description';

interface PickerOptionRowProps {
  /** The row's collection key. */
  id: Key;
  option: PickerOption;
  /** The owning picker's hooks, which name the row's slots. */
  hooks: ComponentHooks<PickerOptionSlot>;
  /** Overrides the option's own disabled state, such as for an option that cannot be picked now. */
  isDisabled?: boolean | undefined;
  /** Marks the filter text in the label (inside a `TextMatchProvider`). */
  highlightMatches?: boolean | undefined;
  /** Draws content before the option's, such as a check mark. */
  renderLead?: ((state: SelectableState) => ReactNode) | undefined;
  /** Draws the option's content instead of its icon, label and description. */
  renderOption?: ((state: SelectableState) => ReactNode) | undefined;
}

/** Estimates a virtualized picker list starts from; it measures each row as it renders. */
export const pickerListLayout = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };

export function isPickerSection(item: PickerItem): item is PickerSection {
  return 'options' in item && Array.isArray(item.options);
}

/** Every option, in display order, sections opened. */
export function flattenPickerItems(items: Iterable<PickerItem> | undefined): PickerOption[] {
  return [...(items ?? [])].flatMap((item) => (isPickerSection(item) ? [...item.options] : [item]));
}

/**
 * The content of a picker's empty list: the search status while searching, after a failure or
 * while the text is too short, else the caller's empty state or the provider's `noResults`.
 */
export function usePickerEmptyContent(
  search: PickerSearchStatus | null,
  renderEmptyState?: (() => ReactNode) | undefined,
): () => ReactNode {
  const strings = useUiStrings();
  return () => {
    if (search?.isLoading) return strings.loading;
    if (search?.hasFailed) return strings.searchFailed;
    if (search?.isTooShort) return strings.typeToSearch(search.minSearchLength);
    return renderEmptyState ? renderEmptyState() : strings.noResults;
  };
}

/**
 * A picker list popover's style: the building block's own (its placement), the field's width as
 * `--ui-trigger-width` and the `dropdown` layer's z-index.
 */
export function usePickerPopoverStyle(): CSSProperties {
  const zIndex = useLayerZIndex('dropdown');
  const context = useSlottedContext(PopoverContext);
  const contextStyle = typeof context?.style === 'object' ? (context.style as CSSProperties) : {};
  return { ...contextStyle, ...triggerWidthProperty, zIndex };
}

function PickerOptionContent({
  option,
  hooks,
  highlightMatches,
}: Pick<PickerOptionRowProps, 'option' | 'hooks' | 'highlightMatches'>) {
  return (
    <>
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} className={hooks.slotClass('option-icon')} />
      ) : null}
      <span {...hooks.slot('option-label')}>
        {highlightMatches ? <TextMatch>{option.label}</TextMatch> : option.label}
      </span>
      {isEmptyNode(option.description) ? null : (
        <>
          {/* The space keeps the label and the description apart in the option's name. */}{' '}
          <span {...hooks.slot('option-description')}>{option.description}</span>
        </>
      )}
    </>
  );
}

/** A picker option's row in a React Aria listbox: its icon, label and description, or the caller's. */
export function PickerOptionRow({
  id,
  option,
  hooks,
  isDisabled,
  highlightMatches,
  renderLead,
  renderOption,
}: PickerOptionRowProps) {
  return (
    <ListBoxItem
      id={id}
      textValue={option.label}
      isDisabled={isDisabled ?? option.isDisabled}
      className={hooks.slotClass('option')}
    >
      {(row) => {
        const state: SelectableState = {
          isSelected: row.isSelected,
          isFocused: row.isFocused,
          isFocusVisible: row.isFocusVisible,
          isHovered: row.isHovered,
          isPressed: row.isPressed,
          isDisabled: row.isDisabled,
        };
        return (
          <>
            {renderLead?.(state)}
            {renderOption ? (
              renderOption(state)
            ) : (
              <PickerOptionContent
                option={option}
                hooks={hooks}
                highlightMatches={highlightMatches}
              />
            )}
          </>
        );
      }}
    </ListBoxItem>
  );
}
