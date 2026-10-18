import type { ReactNode } from 'react';
import {
  Collection,
  Header,
  ListBoxItem,
  ListBoxSection,
  type Key,
  type ListBoxItemRenderProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import {
  isSelectFieldGroup,
  type SelectFieldItem,
  type SelectFieldOption,
} from './select-options.js';

/** Draws an option's content in the list instead of its icon, label and description. */
export type SelectFieldOptionRenderer = (
  option: SelectFieldOption,
  state: ListBoxItemRenderProps,
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
          {renderOption ? renderOption(option, state) : <OptionContent option={option} />}
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
