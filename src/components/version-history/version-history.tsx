'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useTimeZone } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import type { AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ListView } from '../list-row/list-row.js';
import {
  RenameVersionDialog,
  RestoreVersionDialog,
  type VersionDialogTarget,
} from './version-dialogs.js';
import {
  flattenVersions,
  keepSelectableKeys,
  limitSelection,
  listVersionPeople,
  listVersionRows,
  orderForComparison,
  type VersionHistoryFilter,
} from './version-model.js';
import {
  renderVersionRow,
  type VersionAction,
  versionHistoryHooks as hooks,
} from './version-row.js';
import { VersionToolbar } from './version-toolbar.js';

export type { VersionHistoryFilter } from './version-model.js';

/** One saved version: named, or automatic and titled by its time. */
export interface VersionHistoryVersion {
  /** Identifies the version. */
  id: Key;
  /** The version's name. A version without one is an automatic version, titled by its time. */
  label?: string | undefined;
  /** When the version was saved: an ISO 8601 date or date and time. */
  time: string;
  /** Who saved it. */
  person?: AvatarIdentity | undefined;
  /** What changed in it, in a line. */
  summary?: ReactNode;
  /** The version cannot be selected and has no actions. */
  isDisabled?: boolean | undefined;
  /**
   * Older versions folded under this one, newest first, such as the automatic versions saved
   * before a named one: a toggle on its row shows and hides them. One level deep.
   */
  children?: readonly VersionHistoryVersion[] | undefined;
}

export interface VersionHistoryProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow' | 'timeZone'>,
    RefProps<HTMLDivElement> {
  /** The versions, newest first. */
  versions: readonly VersionHistoryVersion[];
  /** The version that is the current content: it is marked and cannot be restored. */
  currentKey?: Key | null | undefined;
  /** The selected versions, at most two: one to view, two to compare. Controlled. */
  selectedKeys?: Iterable<Key> | undefined;
  /** The versions selected at first, uncontrolled. */
  defaultSelectedKeys?: Iterable<Key> | undefined;
  /** Called with the selected versions after each change. */
  onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
  /** Shows a compare action, enabled while two versions are selected; called older first. */
  onCompare?: ((keys: [older: Key, newer: Key]) => void) | undefined;
  /** Offers to restore each version but the current one, after a confirmation. */
  onRestore?: ((key: Key) => void | Promise<unknown>) | undefined;
  /** Offers to name or rename each version; an empty name removes it. */
  onRename?: ((key: Key, label: string) => void | Promise<unknown>) | undefined;
  /** Which versions are shown. Controlled. */
  filter?: VersionHistoryFilter | undefined;
  /** Which versions are shown at first, uncontrolled. Defaults to every version. */
  defaultFilter?: VersionHistoryFilter | undefined;
  /** Called with the filter after each change. */
  onFilterChange?: ((filter: VersionHistoryFilter) => void) | undefined;
  /** The versions whose folded versions are shown. Controlled. */
  expandedKeys?: Iterable<Key> | undefined;
  /** The versions whose folded versions are shown at first, uncontrolled. Defaults to none. */
  defaultExpandedKeys?: Iterable<Key> | undefined;
  /** Called with the expanded versions after a toggle. */
  onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
  /** Shows the filters above the list. Defaults to true. */
  showFilters?: boolean | undefined;
  /** Asks for older versions when the end of the list scrolls into view. */
  onLoadMore?: (() => void) | undefined;
  /** Versions are loading. */
  isLoading?: boolean | undefined;
  /** Why the versions could not be loaded; shown instead of the list. */
  error?: ReactNode;
  /** Shows a retry action with `error`. */
  onRetry?: (() => void) | undefined;
  /** Draws the list while there are no versions at all. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

/** A dialog the history has open, the version it is for, and whether its action runs. */
interface OpenDialog {
  action: VersionAction;
  target: VersionDialogTarget;
  isOpen: boolean;
  isPending: boolean;
}

const everyVersion: VersionHistoryFilter = { namedOnly: false, person: null };
const noKeys: Iterable<Key> = [];

/** Whether `action` can run on the version `key` now: listed, enabled, and offered. */
function isActionAvailable(props: VersionHistoryProps, action: VersionAction, key: Key): boolean {
  const version = flattenVersions(props.versions).find((entry) => entry.id === key);
  if (!version || version.isDisabled) return false;
  if (action === 'rename') return props.onRename !== undefined;
  return props.onRestore !== undefined && key !== (props.currentKey ?? null);
}

/**
 * The open dialog: opening one for a version, and closing it while it keeps its version. A dialog
 * whose action is no longer available for its version (the version left or was disabled, became
 * the current one for a restore, or the callback went away) closes unless its action runs, and
 * stays closed when the action comes back. The action is checked again when it is confirmed.
 */
function useVersionDialog(props: VersionHistoryProps) {
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  if (
    dialog?.isOpen &&
    !dialog.isPending &&
    !isActionAvailable(props, dialog.action, dialog.target.key)
  ) {
    setDialog({ ...dialog, isOpen: false });
  }
  const open = (action: VersionAction, target: VersionDialogTarget) =>
    setDialog({ action, target, isOpen: true, isPending: false });
  const close = () => setDialog((current) => current && { ...current, isOpen: false });
  const setPending = (target: VersionDialogTarget, isPending: boolean) =>
    setDialog((current) => (current?.target === target ? { ...current, isPending } : current));
  /** Runs `action` for `target` if it is still available, marking the dialog pending meanwhile. */
  const submit = async (
    action: VersionAction,
    target: VersionDialogTarget,
    run: () => void | Promise<unknown>,
  ) => {
    if (!isActionAvailable(props, action, target.key)) return;
    setPending(target, true);
    try {
      await run();
    } finally {
      setPending(target, false);
    }
  };
  const propsFor = (action: VersionAction) => ({
    target: dialog?.action === action ? dialog.target : null,
    isOpen: dialog?.action === action && dialog.isOpen,
    onClose: close,
  });
  return { open, submit, propsFor };
}

/**
 * The selection, limited to two versions, and the filter, each controlled or not. Only listed,
 * enabled versions count as selected; an uncontrolled selection drops the others and reports it.
 */
function useVersionState(props: VersionHistoryProps) {
  const [stored, setSelected] = useControllableState<Set<Key>>(
    props.selectedKeys === undefined ? undefined : new Set(props.selectedKeys),
    new Set(props.defaultSelectedKeys ?? noKeys),
    props.onSelectionChange,
  );
  const selected = keepSelectableKeys(flattenVersions(props.versions), stored);
  const isStale = selected.size !== stored.size;
  const isControlled = props.selectedKeys !== undefined;
  useEffect(() => {
    if (isStale && !isControlled) setSelected(selected);
  });
  const [filter, setFilter] = useControllableState(
    props.filter,
    props.defaultFilter ?? everyVersion,
    props.onFilterChange,
  );
  const select = (keys: Selection) => {
    if (keys !== 'all') setSelected(limitSelection(selected, keys));
  };
  const [expanded, setExpanded] = useControllableState<Set<Key>>(
    props.expandedKeys === undefined ? undefined : new Set(props.expandedKeys),
    new Set(props.defaultExpandedKeys ?? noKeys),
    props.onExpandedChange,
  );
  const toggle = (key: Key, isExpanded: boolean) => {
    const next = new Set(expanded);
    if (isExpanded) next.add(key);
    else next.delete(key);
    setExpanded(next);
  };
  return { selected, select, filter, setFilter, expanded, toggle };
}

/** What the list shows without rows: loading, no match for the filters, or no versions at all. */
function VersionListEmpty({
  isLoading,
  hasVersions,
  renderEmptyState,
}: {
  isLoading: boolean;
  hasVersions: boolean;
  renderEmptyState: VersionHistoryProps['renderEmptyState'];
}) {
  const strings = useUiStrings();
  if (isLoading) return <EmptyState variant="loading" size="sm" description={strings.loading} />;
  if (hasVersions) return <EmptyState size="sm" description={strings.noMatchingVersions} />;
  return renderEmptyState?.() ?? <EmptyState size="sm" description={strings.noVersions} />;
}

/** Why the versions could not be loaded, with a retry action. */
function VersionListError({ error, onRetry }: Pick<VersionHistoryProps, 'error' | 'onRetry'>) {
  const strings = useUiStrings();
  return (
    <EmptyState
      variant="error"
      size="sm"
      description={error}
      className={hooks.slotClass('error')}
      actions={
        onRetry ? (
          <Button size="sm" onPress={onRetry}>
            {strings.retry}
          </Button>
        ) : null
      }
    />
  );
}

/** The restore and rename dialogs the history offers, each running its action through `dialog`. */
function VersionDialogs({
  dialog,
  onRestore,
  onRename,
}: Pick<VersionHistoryProps, 'onRestore' | 'onRename'> & {
  dialog: ReturnType<typeof useVersionDialog>;
}) {
  return (
    <>
      {onRestore ? (
        <RestoreVersionDialog
          {...dialog.propsFor('restore')}
          onAction={(target) => dialog.submit('restore', target, () => onRestore(target.key))}
        />
      ) : null}
      {onRename ? (
        <RenameVersionDialog
          {...dialog.propsFor('rename')}
          onAction={(target, label) =>
            dialog.submit('rename', target, () => onRename(target.key, label))
          }
        />
      ) : null}
    </>
  );
}

/**
 * The saved versions of a document or record, newest first: named and automatic versions with who
 * saved them and when, the current one marked. Select one to view it and two to compare them;
 * restore a version after a confirmation, name or rename it, and filter to named versions or one
 * person's.
 */
export function VersionHistory(props: VersionHistoryProps) {
  const { versions, currentKey = null, showFilters = true, onCompare, onRestore, onRename } = props;
  const { className, isLoading = false, ...rest } = props;
  const { ref, id, error, onRetry, onLoadMore, renderEmptyState, showAvatar } = props;
  const { fallbackAfterDays, getNow, timeZone } = props;
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-details': ariaDetails,
  } = props;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const zone = useTimeZone(timeZone);
  const { selected, select, filter, setFilter, expanded, toggle } = useVersionState(props);
  const dialog = useVersionDialog(props);
  const everyVersionListed = flattenVersions(versions);
  const comparison = orderForComparison(everyVersionListed, selected);
  const context = {
    currentKey,
    locale,
    timeZone: zone,
    strings,
    canRename: onRename !== undefined,
    canRestore: onRestore !== undefined,
    onAction: dialog.open,
    onExpandedChange: toggle,
    showAvatar,
    fallbackAfterDays,
    getNow,
  };
  const isNamed = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  return (
    <div
      ref={ref}
      id={id}
      {...hooks.root({ className, props: rest, data: { loading: isLoading } })}
    >
      {showFilters || onCompare ? (
        <VersionToolbar
          filter={showFilters ? filter : null}
          onFilterChange={setFilter}
          people={listVersionPeople(everyVersionListed)}
          onCompare={onCompare ? () => comparison && onCompare(comparison) : null}
          canCompare={comparison !== null}
        />
      ) : null}
      {error ? (
        <VersionListError error={error} onRetry={onRetry} />
      ) : (
        <ListView
          className={hooks.slotClass('list')}
          aria-label={isNamed ? ariaLabel : strings.versionHistory}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-details={ariaDetails}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={select}
          disabledKeys={everyVersionListed.filter((entry) => entry.isDisabled).map(({ id }) => id)}
          onLoadMore={onLoadMore}
          isLoading={isLoading}
          renderEmptyState={() => (
            <VersionListEmpty
              isLoading={isLoading}
              hasVersions={versions.length > 0}
              renderEmptyState={renderEmptyState}
            />
          )}
        >
          {listVersionRows(versions, { filter, expandedKeys: expanded }).map((row) =>
            renderVersionRow({ ...row, isExpanded: expanded.has(row.version.id) }, context),
          )}
        </ListView>
      )}
      <VersionDialogs dialog={dialog} onRestore={onRestore} onRename={onRename} />
    </div>
  );
}
