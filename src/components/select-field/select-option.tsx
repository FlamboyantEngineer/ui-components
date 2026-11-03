'use client';

import { CheckGlyph, MinusGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import { Collection, Header, ListBoxSection, Text } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import type { Key, SelectableState } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { PickerOptionRow, isPickerSection } from '../field/field.js';
import { type SelectFieldItem, type SelectFieldOption } from './select-options.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';

/** Draws an option's content in the list instead of its icon, label and description. */
export type SelectFieldOptionRenderer = (
  option: SelectFieldOption,
  state: SelectableState,
) => ReactNode;

/** How every option of the list is drawn. */
export interface SelectOptionsDisplay {
  isMultiple: boolean;
  /** Options that cannot be picked now, beside those disabled themselves. */
  blockedKeys: ReadonlySet<Key>;
  renderOption?: SelectFieldOptionRenderer | undefined;
}

function OptionRow({
  id,
  option,
  display,
}: {
  /** The option's collection key. */
  id: string;
  option: SelectFieldOption;
  display: SelectOptionsDisplay;
}) {
  const { isMultiple, blockedKeys, renderOption } = display;
  const strings = useUiStrings();
  return (
    <PickerOptionRow
      id={id}
      option={option}
      hooks={hooks}
      isDisabled={option.isDisabled || blockedKeys.has(option.id)}
      renderLead={
        isMultiple
          ? (state) => (
              <>
                <span
                  {...hooks.slot('option-check', {
                    indeterminate: !state.isSelected && option.isIndeterminate,
                  })}
                  aria-hidden="true"
                >
                  {state.isSelected ? (
                    <Glyph icon={CheckGlyph} />
                  ) : option.isIndeterminate ? (
                    <Glyph icon={MinusGlyph} />
                  ) : null}
                </span>
                {!state.isSelected && option.isIndeterminate ? (
                  <Text slot="description" hidden>
                    {strings.selectOptionIndeterminate}
                  </Text>
                ) : null}
              </>
            )
          : undefined
      }
      renderOption={renderOption ? (state) => renderOption(option, state) : undefined}
    />
  );
}

/** What the rows depend on beyond their own item, so a cached row is drawn again when it changes. */
function toDisplayDependencies(display: SelectOptionsDisplay): unknown[] {
  return [display.isMultiple, display.blockedKeys, display.renderOption];
}

/**
 * Draws the list's items in a React Aria `Collection`, which keeps each item's row while the item
 * and the display stay the same, so filtering a long list does not draw every row again: an option
 * row, or a group as a section (React Aria `ListBoxSection`) led by its heading, when it has one,
 * and holding its options. Rows carry their collection key as `id`, which also keys them.
 */
export function SelectListItems({
  items,
  display,
}: {
  items: readonly SelectFieldItem[];
  display: SelectOptionsDisplay;
}) {
  return (
    <Collection items={items} dependencies={toDisplayDependencies(display)}>
      {(item) =>
        isPickerSection(item) ? (
          <ListBoxSection id={toCollectionKey(item.id)} className={hooks.slotClass('section')}>
            {isEmptyNode(item.label) ? null : (
              <Header className={hooks.slotClass('section-header')}>{item.label}</Header>
            )}
            <Collection items={item.options} dependencies={toDisplayDependencies(display)}>
              {(option) => (
                <OptionRow id={toCollectionKey(option.id)} option={option} display={display} />
              )}
            </Collection>
          </ListBoxSection>
        ) : (
          <OptionRow id={toCollectionKey(item.id)} option={item} display={display} />
        )
      }
    </Collection>
  );
}
