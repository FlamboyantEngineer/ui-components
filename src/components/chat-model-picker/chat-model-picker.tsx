'use client';

import { SparklesGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import type { IconSource } from '../icon/icon.js';
import { Menu, MenuItem, MenuPopover, MenuSection, MenuTrigger } from '../menu/menu.js';
import {
  ComposerControlButton,
  useMessageComposerControls,
} from '../message-composer/message-composer.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { useChatModelChoice, type ChatModelChoice } from './use-chat-model-choice.js';

/** A model the reader can send their messages to. */
export interface ChatModelOption {
  /** Identifies the model in `model`, `defaultModel` and `onModelChange`. */
  id: string;
  /** The model's name, on the trigger and in the menu. */
  label: string;
  /** What the model is good at, after its name in the menu. */
  description?: string | undefined;
  /** Drawn before the name on the trigger and in the menu; alone on the trigger while the composer is compact. */
  icon?: IconSource;
  /** A short mark after the name in the menu, such as "New". */
  badge?: string | undefined;
  /** Keeps the model listed but out of reach. */
  isDisabled?: boolean | undefined;
  /** Why a disabled model is unavailable, shown in place of its description. */
  disabledReason?: string | undefined;
  /** The ids of the efforts the model takes. Undefined takes every listed effort; empty takes none. */
  efforts?: readonly string[] | undefined;
  /** The effort a switch to this model moves to when the current one does not apply. Defaults to its first. */
  defaultEffort?: string | undefined;
}

/** A reasoning effort a model may take. */
export interface ChatEffortOption {
  /** Identifies the effort in `efforts`, `effort`, `defaultEffort` and `onEffortChange`. */
  id: string;
  /** The effort's name, on the trigger and in the menu. */
  label: string;
  /** What the effort trades, after its name in the menu. */
  description?: string | undefined;
}

export interface ChatModelPickerProps extends RefProps<HTMLButtonElement>, BaseProps {
  /** The models, in menu order. */
  models: readonly ChatModelOption[];
  /** The reasoning efforts, in menu order. Without them no model takes an effort. */
  efforts?: readonly ChatEffortOption[] | undefined;
  /** The current model's id, controlled. */
  model?: string | undefined;
  /** The model at first, uncontrolled. Defaults to the first available model. */
  defaultModel?: string | undefined;
  /** Called with the id of the model the reader chooses. */
  onModelChange?: ((model: string) => void) | undefined;
  /** The current effort's id, controlled. */
  effort?: string | undefined;
  /** The effort at first, uncontrolled. Defaults to the model's default effort. */
  defaultEffort?: string | undefined;
  /** Called with the id of the effort the reader chooses, or a model switch moves to. */
  onEffortChange?: ((effort: string) => void) | undefined;
  /** Keeps the uncontrolled model and effort in the provider's storage under this key. */
  persistKey?: string | undefined;
  /**
   * Refuses to open the menu and closes an open one; the composer's own disabled state does as
   * well. Enabled again, the picker leaves the menu closed.
   */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('chat-model-picker', ['model', 'effort', 'menu']);

// Menu keys start with their section, so a model and an effort may share an id.
const modelPrefix = 'model:';
const effortPrefix = 'effort:';

/** A model's menu item: its name with its badge, then its description or why it is unavailable. */
function renderModelItem(model: ChatModelOption) {
  return (
    <MenuItem
      key={model.id}
      id={modelPrefix + model.id}
      textValue={model.label}
      icon={model.icon}
      description={
        model.isDisabled ? (model.disabledReason ?? model.description) : model.description
      }
      isDisabled={model.isDisabled}
      // An unavailable model stays reachable by arrow keys, so its reason can be read.
      focusableWhenDisabled
    >
      {model.label}
      {model.badge ? (
        <>
          {' '}
          <Badge size="sm" tone="info">
            {model.badge}
          </Badge>
        </>
      ) : null}
    </MenuItem>
  );
}

function renderEffortItem(effort: ChatEffortOption) {
  return (
    <MenuItem
      key={effort.id}
      id={effortPrefix + effort.id}
      textValue={effort.label}
      description={effort.description}
    >
      {effort.label}
    </MenuItem>
  );
}

/** The menu: the models, then the efforts while the current model takes one, each a single choice. */
function ChatModelMenu({
  models,
  choice,
  isDisabled,
}: {
  models: readonly ChatModelOption[];
  choice: ChatModelChoice;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  const { model, effort } = choice;
  const choose = (key: Key) => {
    // A menu still open as the picker becomes disabled closes; its items choose nothing meanwhile.
    if (isDisabled) return;
    const value = String(key);
    if (value.startsWith(modelPrefix)) choice.chooseModel(value.slice(modelPrefix.length));
    else choice.chooseEffort(value.slice(effortPrefix.length));
  };
  return (
    <Menu className={hooks.slotClass('menu')} onAction={choose} shouldCloseOnSelect>
      <MenuSection
        id="models"
        title={strings.chatModel}
        selectionMode="single"
        selectedKeys={model ? [modelPrefix + model.id] : []}
      >
        {models.map(renderModelItem)}
      </MenuSection>
      {effort ? (
        <MenuSection
          id="efforts"
          title={strings.chatEffort}
          selectionMode="single"
          selectedKeys={[effortPrefix + effort.id]}
        >
          {choice.efforts.map(renderEffortItem)}
        </MenuSection>
      ) : null}
    </Menu>
  );
}

/**
 * A compact composer control that shows the current model, and its effort when the model takes one,
 * or the model's icon alone while the composer is compact, and opens a menu to choose them: the
 * models with their descriptions, badges and unavailable reasons, then the efforts the chosen model
 * takes. Each choice is controlled or held, optionally in the provider's storage.
 */
export function ChatModelPicker(props: ChatModelPickerProps) {
  const { models, className, id, ref } = props;
  const strings = useUiStrings();
  const composer = useMessageComposerControls();
  // Disabled itself or with its composer: the trigger refuses to open and an open menu closes.
  const isDisabled = Boolean(props.isDisabled) || composer.isDisabled;
  const choice = useChatModelChoice(props);
  const { model, effort } = choice;
  if (!model) return null;
  const name = strings.chatModelTrigger(model.label, effort?.label);
  return (
    <MenuTrigger isDisabled={isDisabled}>
      <ComposerControlButton
        {...hooks.root({
          className,
          props,
          data: { hasEffort: effort !== undefined, compact: composer.isCompact },
        })}
        id={id}
        ref={ref}
        icon={model.icon}
        compactIcon={model.icon ?? SparklesGlyph}
        name={name}
        hasMenu
        isDisabled={isDisabled}
        // Disabled on its own, it stays focusable, so focus returns to it as its open menu closes.
        focusableWhenDisabled={!composer.isDisabled}
      >
        <MetaLine
          items={[
            <span key="model" {...hooks.slot('model')}>
              {model.label}
            </span>,
            effort ? (
              <span key="effort" {...hooks.slot('effort')}>
                {effort.label}
              </span>
            ) : null,
          ]}
        />
      </ComposerControlButton>
      <MenuPopover placement="top start">
        <ChatModelMenu models={models} choice={choice} isDisabled={isDisabled} />
      </MenuPopover>
    </MenuTrigger>
  );
}
