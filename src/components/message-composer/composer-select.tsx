'use client';

// A compact choice among the composer's controls, such as how the reader's requests are approved
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-7).

import { useControllableState } from '../../core/controllable-state.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { IconSource } from '../icon/icon.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { ComposerControlButton } from './composer-control-button.js';
import { useMessageComposerControls } from './composer-controls.js';
import { composerHooks as hooks } from './composer-hooks.js';

/** An option of a composer select. */
export interface MessageComposerSelectOption {
  /** Identifies the option in `value`, `defaultValue` and `onChange`. */
  id: string;
  /** The option's name, on the trigger and in the menu. */
  label: string;
  /** Drawn before the label, and alone on the trigger while the composer is compact. */
  icon: IconSource;
  /** What the option does, after its name in the menu. */
  description?: string | undefined;
  /** Keeps the option listed but out of reach. */
  isDisabled?: boolean | undefined;
  /** Why a disabled option is unavailable, shown in place of its description. */
  disabledReason?: string | undefined;
}

export interface MessageComposerSelectProps extends RefProps<HTMLButtonElement>, BaseProps {
  /** What the select chooses, such as "Approval": it names the trigger with the current option. */
  label: string;
  /** The options, in menu order. */
  options: readonly MessageComposerSelectOption[];
  /** The current option's id, controlled. */
  value?: string | undefined;
  /** The option at first, uncontrolled. Defaults to the first available option. */
  defaultValue?: string | undefined;
  /** Called with the id of the option the reader chooses. */
  onChange?: ((value: string) => void) | undefined;
  /** Refuses to open the menu; the composer's own disabled state does as well. */
  isDisabled?: boolean | undefined;
}

/** The option `value` names, else the first available option, else the first. */
function findCurrent(options: readonly MessageComposerSelectOption[], value: string | undefined) {
  return (
    options.find((option) => option.id === value) ??
    options.find((option) => !option.isDisabled) ??
    options[0]
  );
}

function renderOption(option: MessageComposerSelectOption) {
  return (
    <MenuItem
      key={option.id}
      id={option.id}
      textValue={option.label}
      icon={option.icon}
      description={
        option.isDisabled ? (option.disabledReason ?? option.description) : option.description
      }
      isDisabled={option.isDisabled}
      // An unavailable option stays reachable by arrow keys, so its reason can be read.
      focusableWhenDisabled
    >
      {option.label}
    </MenuItem>
  );
}

/**
 * A composer control that shows the current option's icon and label, or its icon alone while the
 * composer is compact, and opens a menu of the options, each with its icon and description.
 */
export function MessageComposerSelect({
  label,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  isDisabled = false,
  ...props
}: MessageComposerSelectProps) {
  const strings = useUiStrings();
  // Disabled itself or with its composer: the trigger refuses to open and an open menu closes.
  const composer = useMessageComposerControls();
  const isOff = isDisabled || composer.isDisabled;
  // An id no option has falls back to the first available option.
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? '', onChange);
  const current = findCurrent(options, value);
  if (!current) return null;
  const name = strings.composerSelectTrigger(label, current.label);
  const choose = (key: Key) => {
    if (isOff) return;
    const id = String(key);
    if (id !== current.id) setValue(id);
  };
  return (
    <MenuTrigger isDisabled={isOff}>
      <ComposerControlButton
        {...props}
        className={mergeClassNames(hooks.slotClass('select'), props.className)}
        icon={current.icon}
        name={name}
        hasMenu
        isDisabled={isDisabled}
      >
        {current.label}
      </ComposerControlButton>
      <MenuPopover placement="top start">
        <Menu
          className={hooks.slotClass('select-menu')}
          selectionMode="single"
          selectedKeys={[current.id]}
          onAction={choose}
          shouldCloseOnSelect
        >
          {options.map(renderOption)}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}
