'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChevronRightGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { ListBox, ListBoxItem, useLocale } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { cascaderFieldHooks as hooks } from './cascader-field-hooks.js';
import { type CascaderOption, isCascaderBranch } from './cascader-options.js';

/** One level of the open cascader: the options under the active option of the level before. */
export interface CascaderPanelModel {
  /** 0 for the top-level options. */
  level: number;
  /** Names the panel's listbox: the field's label at the top, else the parent option's label. */
  label: string;
  /** The level's options; empty while they load or after they failed. */
  options: readonly CascaderOption[];
  status: 'ready' | 'loading' | 'failed';
  /** The option of this level on the active path. */
  activeKey: Key | null;
}

/** The option to focus once it is drawn: a level's given option, or its first enabled one. */
export interface CascaderFocusRequest {
  level: number;
  key: Key | null;
}

interface CascaderPanelsProps {
  panels: readonly CascaderPanelModel[];
  /** Opens a branch or chooses a leaf. */
  onActivate: (level: number, option: CascaderOption) => void;
  /** Goes back from a level to the option that opened it. */
  onBack: (level: number) => void;
  onRetry: (level: number) => void;
  focus: CascaderFocusRequest | null;
  /** Called once the requested option has focus. */
  onFocused: () => void;
}

function CascaderOptionRow({ id, option }: { id: string; option: CascaderOption }) {
  const isBranch = isCascaderBranch(option);
  return (
    <ListBoxItem
      id={id}
      textValue={option.label}
      isDisabled={option.isDisabled}
      {...hooks.slot('option', { branch: isBranch })}
    >
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} className={hooks.slotClass('option-icon')} />
      ) : null}
      <span {...hooks.slot('option-label')}>{option.label}</span>
      {isEmptyNode(option.description) ? null : (
        <>
          {/* The space keeps the label and the description apart in the option's name. */}{' '}
          <span {...hooks.slot('option-description')}>{option.description}</span>
        </>
      )}
      {isBranch ? (
        <Glyph icon={ChevronRightGlyph} className={hooks.slotClass('branch-icon')} />
      ) : null}
    </ListBoxItem>
  );
}

/** A level's listbox. Drawn while its focus is requested, it focuses its active or first option. */
function CascaderListBox({
  panel,
  isFocusRequested,
  onActivate,
}: {
  panel: CascaderPanelModel;
  isFocusRequested: boolean;
  onActivate: (level: number, option: CascaderOption) => void;
}) {
  const strings = useUiStrings();
  // React Aria reads autoFocus again until the items arrive, so it keeps its value from mounting.
  const [autoFocus] = useState<'first' | undefined>(isFocusRequested ? 'first' : undefined);
  return (
    <ListBox
      {...hooks.slot('listbox')}
      aria-label={panel.label}
      autoFocus={autoFocus}
      // Escape closes the panels instead of clearing a level's active option.
      escapeKeyBehavior="none"
      renderEmptyState={() => <span {...hooks.slot('status')}>{strings.noResults}</span>}
      items={panel.options.map((option) => ({ id: toCollectionKey(option.id), option }))}
      selectionMode="single"
      selectedKeys={panel.activeKey === null ? [] : [toCollectionKey(panel.activeKey)]}
      disabledKeys={panel.options
        .filter((option) => option.isDisabled)
        .map((option) => toCollectionKey(option.id))}
      // Pressing the active option again empties the selection: it activates that option.
      onSelectionChange={(keys) => {
        const picked = keys === 'all' ? undefined : [...keys][0];
        const key = picked === undefined ? panel.activeKey : fromCollectionKey(picked);
        const option = panel.options.find((candidate) => candidate.id === key);
        if (option) onActivate(panel.level, option);
      }}
    >
      {(item) => <CascaderOptionRow id={item.id} option={item.option} />}
    </ListBox>
  );
}

/** The loading or failure status of a level whose options are not there yet. */
function CascaderStatus({ panel, onRetry }: { panel: CascaderPanelModel; onRetry: () => void }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('status', { status: panel.status })} role="status">
      {panel.status === 'loading' ? strings.loading : strings.cascaderLoadFailed}
      {panel.status === 'failed' ? (
        <Button size="sm" className={hooks.slotClass('retry')} onPress={onRetry}>
          {strings.retry}
        </Button>
      ) : null}
    </div>
  );
}

/** The option a key event came from, and the level it is on. */
function readTarget(event: KeyboardEvent, panels: readonly CascaderPanelModel[]) {
  const element = (event.target as Element).closest('[role="option"][data-key]');
  const level = Number(element?.closest('[data-level]')?.getAttribute('data-level'));
  const key = element ? fromCollectionKey(element.getAttribute('data-key') ?? '') : null;
  const option = panels[level]?.options.find((candidate) => candidate.id === key);
  return option ? { level, option } : null;
}

/**
 * Moves focus to the requested option of a level already drawn. A level drawn afresh, as it opens
 * or its options load, focuses its active or first enabled option itself when it mounts.
 */
function useRequestedFocus(focus: CascaderFocusRequest | null, onFocused: () => void) {
  const panelsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    const panel = panelsRef.current?.querySelector(`[data-level="${String(focus.level)}"]`);
    const options = [...(panel?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const wanted = focus.key === null ? null : toCollectionKey(focus.key);
    const target =
      options.find((option) => option.dataset.key === wanted) ??
      options.find((option) => option.getAttribute('aria-disabled') !== 'true');
    if (!target) return;
    target.focus();
    onFocused();
  });
  return panelsRef;
}

/**
 * The open cascader's panels side by side, one listbox per level. Up and Down, Home, End and
 * typeahead move within a level; the logical forward arrow (Right, Left right to left) opens a
 * branch and moves into its level, the backward arrow returns to the option that opened the level,
 * and Enter, Space or a press opens a branch or chooses a leaf.
 */
export function CascaderPanels(props: CascaderPanelsProps) {
  const { panels, onActivate, onBack, onRetry } = props;
  const { direction } = useLocale();
  const panelsRef = useRequestedFocus(props.focus, props.onFocused);
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== forward && event.key !== backward) return;
    const target = readTarget(event, panels);
    if (!target) return;
    event.preventDefault();
    if (event.key === backward) onBack(target.level);
    else if (isCascaderBranch(target.option) && !target.option.isDisabled) {
      onActivate(target.level, target.option);
    }
  };
  return (
    <div
      ref={panelsRef}
      {...hooks.slot('panels')}
      onKeyDown={onKeyDown}
      // An option taking focus settles the request, so a later render never pulls focus back. A
      // listbox focuses itself first while it mounts empty, and keeps its request until its items.
      onFocus={(event) => {
        if (props.focus && (event.target as Element).getAttribute('role') === 'option') {
          props.onFocused();
        }
      }}
    >
      {panels.map((panel) => (
        <div
          key={panel.level}
          {...hooks.slot('panel', { level: panel.level, status: panel.status })}
        >
          {panel.status === 'ready' ? (
            <CascaderListBox
              panel={panel}
              isFocusRequested={props.focus?.level === panel.level}
              onActivate={onActivate}
            />
          ) : (
            <CascaderStatus panel={panel} onRetry={() => onRetry(panel.level)} />
          )}
        </div>
      ))}
    </div>
  );
}
