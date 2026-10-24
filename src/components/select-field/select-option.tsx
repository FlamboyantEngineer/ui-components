import type { ReactNode } from 'react';
import { Collection, Header, ListBoxItem, ListBoxSection } from '../../primitives/index.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import {
  isSelectFieldGroup,
  type SelectFieldItem,
  type SelectFieldOption,
} from './select-options.js';

/** The state of an option row that `renderOption` draws for. */
export interface SelectFieldOptionState {
  /** The option is chosen. */
  isSelected: boolean;
  /** The option has focus, from the keyboard or the pointer. */
  isFocused: boolean;
  /** The option has keyboard focus. */
  isFocusVisible: boolean;
  /** The pointer is over the option. */
  isHovered: boolean;
  /** The option is being pressed. */
  isPressed: boolean;
  /** The option cannot be chosen. */
  isDisabled: boolean;
}

/** Draws an option's content in the list instead of its icon, label and description. */
export type SelectFieldOptionRenderer = (
  option: SelectFieldOption,
  state: SelectFieldOptionState,
) => ReactNode;

/** How every option of the list is drawn. */
export interface SelectOptionsDisplay {
  isMultiple: boolean;
  /** Options that cannot be picked now, beside those disabled themselves. */
  blockedKeys: ReadonlySet<Key>;
  renderOption?: SelectFieldOptionRenderer | undefined;
}

const hooks = createHooks('select-field', [
  'section',
  'section-header',
  'option',
  'option-check',
  'option-icon',
  'option-label',
  'option-description',
]);

function OptionContent({ option }: { option: SelectFieldOption }) {
  return (
    <>
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} className={hooks.slotClass('option-icon')} />
      ) : null}
      <span {...hooks.slot('option-label')}>{option.label}</span>
      {option.description ? (
        <>
          {' '}
          <span {...hooks.slot('option-description')}>{option.description}</span>
        </>
      ) : null}
    </>
  );
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
  return (
    <ListBoxItem
      id={id}
      textValue={option.label}
      isDisabled={option.isDisabled || blockedKeys.has(option.id)}
      className={hooks.slotClass('option')}
    >
      {(state) => (
        <>
          {isMultiple ? (
            <span {...hooks.slot('option-check')} aria-hidden="true">
              {state.isSelected ? <Glyph name="check" /> : null}
            </span>
          ) : null}
          {renderOption ? (
            renderOption(option, {
              isSelected: state.isSelected,
              isFocused: state.isFocused,
              isFocusVisible: state.isFocusVisible,
              isHovered: state.isHovered,
              isPressed: state.isPressed,
              isDisabled: state.isDisabled,
            })
          ) : (
            <OptionContent option={option} />
          )}
        </>
      )}
    </ListBoxItem>
  );
}

/** What the rows depend on beyond their own item, so a cached row is drawn again when it changes. */
export function toDisplayDependencies(display: SelectOptionsDisplay): unknown[] {
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
        isSelectFieldGroup(item) ? (
          <ListBoxSection id={toCollectionKey(item.id)} className={hooks.slotClass('section')}>
            {item.label ? (
              <Header className={hooks.slotClass('section-header')}>{item.label}</Header>
            ) : null}
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
