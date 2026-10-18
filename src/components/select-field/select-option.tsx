import type { ReactNode } from 'react';
import { Collection, Header, ListBoxItem, ListBoxSection } from '../../primitives/index.js';
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
  option,
  display,
}: {
  option: SelectFieldOption;
  display: SelectOptionsDisplay;
}) {
  const { isMultiple, blockedKeys, renderOption } = display;
  return (
    <ListBoxItem
      id={option.id}
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

/**
 * One entry of the list: an option row, or a group as a section (React Aria `ListBoxSection`) led
 * by its heading, when it has one, and holding its options.
 */
export function SelectListItem({
  item,
  display,
}: {
  item: SelectFieldItem;
  display: SelectOptionsDisplay;
}) {
  if (!isSelectFieldGroup(item)) return <OptionRow option={item} display={display} />;
  return (
    <ListBoxSection id={item.id} className={hooks.slotClass('section')}>
      {item.label ? (
        <Header className={hooks.slotClass('section-header')}>{item.label}</Header>
      ) : null}
      <Collection items={item.options}>
        {(option) => <OptionRow option={option} display={display} />}
      </Collection>
    </ListBoxSection>
  );
}
