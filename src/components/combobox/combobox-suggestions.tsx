import type { CSSProperties, ReactNode } from 'react';
import {
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  PopoverContext,
  useSlottedContext,
  type Key,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { useLayerZIndex } from '../portal/portal.js';

/** One suggestion. */
export interface ComboboxOption {
  id: Key;
  /** The text shown, matched while typing, and written to the input when chosen. */
  label: string;
  description?: ReactNode;
  icon?: IconSource;
  isDisabled?: boolean | undefined;
}

/** A titled group of suggestions. */
export interface ComboboxSection {
  id: Key;
  title: ReactNode;
  options: readonly ComboboxOption[];
}

export type ComboboxItem = ComboboxOption | ComboboxSection;

const hooks = createHooks('combobox', [
  'popover',
  'listbox',
  'section',
  'section-header',
  'option',
  'option-icon',
  'option-label',
  'option-description',
  'empty',
]);

function isSection(item: ComboboxItem): item is ComboboxSection {
  return 'options' in item;
}

function OptionRow({ option }: { option: ComboboxOption }) {
  return (
    <ListBoxItem
      id={option.id}
      textValue={option.label}
      isDisabled={option.isDisabled}
      className={hooks.slotClass('option')}
    >
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
    </ListBoxItem>
  );
}

function renderItem(item: ComboboxItem) {
  if (!isSection(item)) return <OptionRow option={item} />;
  return (
    <ListBoxSection id={item.id} className={hooks.slotClass('section')}>
      <Header className={hooks.slotClass('section-header')}>{item.title}</Header>
      {item.options.map((option) => (
        <OptionRow key={option.id} option={option} />
      ))}
    </ListBoxSection>
  );
}

/**
 * The suggestion list: a listbox of options and sections, or the provider's `noResults` text, in a
 * popover on the `dropdown` layer that keeps React Aria's measured `--trigger-width`.
 */
export function ComboboxSuggestions() {
  const strings = useUiStrings();
  const zIndex = useLayerZIndex('dropdown');
  const context = useSlottedContext(PopoverContext);
  const contextStyle = typeof context?.style === 'object' ? (context.style as CSSProperties) : {};
  return (
    <Popover
      {...hooks.slot('popover', { layer: 'dropdown' })}
      offset={4}
      containerPadding={8}
      style={{ ...contextStyle, zIndex }}
    >
      <ListBox<ComboboxItem>
        className={hooks.slotClass('listbox')}
        renderEmptyState={() => <span {...hooks.slot('empty')}>{strings.noResults}</span>}
      >
        {renderItem}
      </ListBox>
    </Popover>
  );
}
