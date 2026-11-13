'use client';

import { Fragment, useEffect, useId, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, Dialog, DialogTrigger } from '../../primitives/index.js';
import { DEFAULT_DROPDOWN_OFFSET } from '../../utils/overlay-defaults.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { useLatest } from '../../utils/use-latest.js';
import {
  Field,
  type FieldControlProps,
  FieldFormValue,
  type FieldInputProps,
  type FieldState,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { PopoverPanel } from '../popover/popover.js';
import { cascaderFieldHooks as hooks } from './cascader-field-hooks.js';
import {
  type CascaderChildren,
  type CascaderOption,
  type CascaderValue,
  isCascaderBranch,
  isSameCascaderPath,
  resolveCascaderPath,
  toCascaderPathKey,
} from './cascader-options.js';
import {
  type CascaderFocusRequest,
  type CascaderPanelModel,
  CascaderPanels,
} from './cascader-panels.js';
import { type CascaderLoader, useCascaderLoads } from './use-cascader-loads.js';

export interface CascaderFieldProps extends FieldInputProps<CascaderValue> {
  /** The top-level options, each holding its children or loading them through `loadChildren`. */
  options: readonly CascaderOption[];
  /** Loads the children of an option with `hasChildren` and no `children` when it is opened. */
  loadChildren?: CascaderLoader | undefined;
  /** Shown while nothing is chosen. Defaults to the provider's `selectPlaceholder`. */
  placeholder?: string | undefined;
  /** Whether the panels are open, for an owner that controls it. */
  isOpen?: boolean | undefined;
  /** Whether the panels start open, when the field owns its open state. */
  defaultOpen?: boolean | undefined;
  /** Called when the panels open or close. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

/** The panels of the active path: the top level, then the children of each active branch. */
function buildPanels({
  label,
  options,
  active,
  getChildren,
  loads,
}: {
  label: string;
  options: readonly CascaderOption[];
  active: readonly Key[];
  getChildren: CascaderChildren;
  loads: ReturnType<typeof useCascaderLoads>;
}): CascaderPanelModel[] {
  const panels: CascaderPanelModel[] = [
    { level: 0, label, options, status: 'ready', activeKey: active[0] ?? null },
  ];
  const trail = resolveCascaderPath(options, { path: active, getChildren });
  trail.forEach((option, index) => {
    if (!isCascaderBranch(option) || panels.length !== index + 1) return;
    const path = trail.slice(0, index + 1);
    const children = getChildren(path);
    const load = loads.read(path);
    const status =
      children || !loads.hasLoader ? 'ready' : load?.status === 'failed' ? 'failed' : 'loading';
    panels.push({
      level: index + 1,
      label: option.label,
      options: children ?? [],
      status,
      activeKey: active[index + 1] ?? null,
    });
  });
  return panels;
}

/**
 * The open state and the active path while the panels are open: opening starts the path at the
 * chosen value and asks to focus its deepest option; it opens only while the field is editable.
 */
function useCascaderNavigation(
  state: FieldState<CascaderValue>,
  props: Pick<CascaderFieldProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>,
) {
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const [isOpen, setOpen] = useControllableState(
    props.isOpen,
    Boolean(props.defaultOpen),
    props.onOpenChange,
  );
  const [active, setActive] = useState<readonly Key[]>([]);
  const [focus, setFocus] = useState<CascaderFocusRequest | null>(null);
  // Each opening, by a press or by an owner of the open state, starts again at the chosen value.
  const isShown = isOpen && isEditable;
  const [wasShown, setWasShown] = useState(false);
  if (isShown !== wasShown) {
    setWasShown(isShown);
    if (isShown) {
      const path = state.value ?? [];
      setActive(path);
      setFocus(focusOnPath(path));
    }
  }
  useCloseWhenLocked(isOpen, !isEditable, () => setOpen(false));
  return {
    isOpen: isShown,
    active,
    focus,
    setActive,
    setFocus,
    changeOpen: (next: boolean) => {
      if (!next || isEditable) setOpen(next);
    },
  };
}

/** Focus on a path's deepest option, or on the first top-level option of an empty path. */
function focusOnPath(path: readonly Key[]): CascaderFocusRequest {
  return { level: Math.max(0, path.length - 1), key: path.at(-1) ?? null };
}

/**
 * The deepest option of the active path when it is a branch whose children are neither given nor
 * loading, loaded or failed: a path opened from the saved value loads it as a press would.
 */
function findUnloadedBranch(
  trail: readonly CascaderOption[],
  options: { getChildren: CascaderChildren; loads: ReturnType<typeof useCascaderLoads> },
): readonly CascaderOption[] | null {
  const branch = trail.at(-1);
  if (!branch || !isCascaderBranch(branch) || !options.loads.hasLoader) return null;
  if (options.getChildren(trail) || options.loads.read(trail)) return null;
  return trail;
}

/** Loads the unloaded branch at the end of the active path while the panels are open. */
function useLoadOnOpen(
  trail: readonly CascaderOption[] | null,
  loads: ReturnType<typeof useCascaderLoads>,
) {
  const key = trail ? toCascaderPathKey(trail.map((option) => option.id)) : null;
  const load = useLatest(() => {
    if (trail) loads.load(trail);
  });
  useEffect(() => {
    if (key !== null) load.current();
  }, [key, load]);
}

/** Everything the field draws: its state, the loaded children, the panels and their actions. */
function useCascaderField(props: CascaderFieldProps) {
  const { state, field, rest } = useFieldControl<CascaderValue, CascaderFieldProps>(props, {
    initialValue: null,
    emptyValue: null,
    isEmpty: (value) => value === null || value.length === 0,
    isEqual: isSameCascaderPath,
  });
  const loads = useCascaderLoads(rest.loadChildren);
  const navigation = useCascaderNavigation(state, rest);
  const getChildren: CascaderChildren = (path) => {
    const branch = path.at(-1);
    if (branch?.children) return branch.children;
    const load = loads.read(path);
    return load?.status === 'ready' ? load.options : undefined;
  };
  const { active, setActive, setFocus } = navigation;
  const trailOf = (path: readonly Key[]) =>
    resolveCascaderPath(rest.options, { path, getChildren });
  useLoadOnOpen(
    navigation.isOpen ? findUnloadedBranch(trailOf(active), { getChildren, loads }) : null,
    loads,
  );
  return {
    state,
    field,
    rest,
    navigation,
    chosen: trailOf(state.value ?? []),
    panels: buildPanels({ label: field.label, options: rest.options, active, getChildren, loads }),
    activate: (level: number, option: CascaderOption) => {
      const path = [...active.slice(0, level), option.id];
      setActive(path);
      if (!isCascaderBranch(option)) {
        state.setValue(path);
        state.commit();
        navigation.changeOpen(false);
        return;
      }
      const trail = trailOf(path);
      if (!getChildren(trail)) loads.load(trail);
      setFocus({ level: level + 1, key: null });
    },
    back: (level: number) => {
      if (level === 0) return;
      setActive(active.slice(0, level));
      setFocus({ level: level - 1, key: active[level - 1] ?? null });
    },
    retry: (level: number) => loads.retry(trailOf(active.slice(0, level))),
  };
}

/**
 * The trigger: named by the field label and the chosen path, and focusable while read-only.
 * Backspace or Delete clears an optional value; every other key goes on to the field.
 */
function CascaderTrigger({
  control,
  state,
  chosen,
  placeholder,
}: {
  control: FieldControlProps;
  state: FieldState<CascaderValue>;
  /** The chosen path's options as far as they are known. */
  chosen: readonly CascaderOption[];
  placeholder: string;
}) {
  const strings = useUiStrings();
  const valueId = useId();
  const { ref, ...rest } = control;
  const aria = toAriaControlProps(rest);
  const path = state.value ?? [];
  // An id whose option is not loaded shows itself, so a restored path still reads in full.
  const labels = path.map((key, index) => chosen[index]?.label ?? String(key));
  return (
    <AriaButton
      {...hooks.slot('trigger')}
      id={aria.id}
      ref={ref}
      aria-label={aria['aria-label']}
      aria-labelledby={`${aria['aria-labelledby'] ?? aria.id} ${valueId}`}
      aria-describedby={aria['aria-describedby']}
      isDisabled={aria.isDisabled}
      onKeyDown={(event) => {
        if ((event.key === 'Backspace' || event.key === 'Delete') && state.canClear) state.clear();
        else event.continuePropagation();
      }}
    >
      <span {...hooks.slot('value', { placeholder: labels.length === 0 })} id={valueId}>
        {labels.length === 0
          ? placeholder
          : labels.map((text, index) => (
              <Fragment key={index}>
                {/* The spaces keep the segments apart in the trigger's name. */}
                {index > 0 ? (
                  <>
                    {' '}
                    <span {...hooks.slot('separator')}>{strings.cascaderPathSeparator}</span>{' '}
                  </>
                ) : null}
                <span {...hooks.slot('segment')}>{text}</span>
              </Fragment>
            ))}
      </span>
    </AriaButton>
  );
}

/**
 * A field for choosing one leaf of a hierarchy through adjacent panels: each option that holds
 * children opens the next level beside it, given now or loaded by the host on first opening, and
 * choosing a leaf stores the path of ids down to it. With `name`, a hidden input submits the leaf's id.
 */
export function CascaderField(props: CascaderFieldProps) {
  const strings = useUiStrings();
  const model = useCascaderField(props);
  const { state, field, navigation } = model;
  const leaf = state.value?.at(-1);
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => (
        <>
          <DialogTrigger isOpen={navigation.isOpen} onOpenChange={navigation.changeOpen}>
            <CascaderTrigger
              control={control}
              state={state}
              chosen={model.chosen}
              placeholder={model.rest.placeholder ?? strings.selectPlaceholder}
            />
            <PopoverPanel
              {...hooks.slot('popover', { layer: 'dropdown' })}
              placement="bottom start"
              offset={DEFAULT_DROPDOWN_OFFSET}
            >
              <Dialog {...hooks.slot('dialog')} aria-label={field.label}>
                <CascaderPanels
                  panels={model.panels}
                  onActivate={model.activate}
                  onBack={model.back}
                  onRetry={model.retry}
                  focus={navigation.focus}
                  onFocused={() => navigation.setFocus(null)}
                />
              </Dialog>
            </PopoverPanel>
          </DialogTrigger>
          <FieldFormValue
            name={props.name}
            value={leaf === undefined ? null : String(leaf)}
            isDisabled={state.isDisabled}
          />
        </>
      )}
    </Field>
  );
}

export type { CascaderOption, CascaderValue } from './cascader-options.js';
export type { CascaderLoader } from './use-cascader-loads.js';
