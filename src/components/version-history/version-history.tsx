'use client';

import { useState, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
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
  filterVersions,
  limitSelection,
  listVersionPeople,
  orderForComparison,
  type VersionHistoryFilter,
} from './version-model.js';
import {
  versionHistoryHooks as hooks,
  renderVersionRow,
  type VersionAction,
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
}

export interface VersionHistoryProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<NativeProps<'div'>, 'ref'>,
    Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
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

/** A dialog the history has open, and the version it is for. */
interface OpenDialog {
  action: VersionAction;
  target: VersionDialogTarget;
  isOpen: boolean;
}

const everyVersion: VersionHistoryFilter = { namedOnly: false, person: null };
const noKeys: Iterable<Key> = [];

/** The open dialog: opening one for a version, and closing it while it keeps its version. */
function useVersionDialog() {
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const open = (action: VersionAction, target: VersionDialogTarget) =>
    setDialog({ action, target, isOpen: true });
  const close = () => setDialog((current) => current && { ...current, isOpen: false });
  const propsFor = (action: VersionAction) => ({
    target: dialog?.action === action ? dialog.target : null,
    isOpen: dialog?.action === action && dialog.isOpen,
    onClose: close,
  });
  return { open, propsFor };
}

/** The selection, limited to two versions, and the filter, each controlled or not. */
function useVersionState(props: VersionHistoryProps) {
  const [selected, setSelected] = useControllableState<Set<Key>>(
    props.selectedKeys === undefined ? undefined : new Set(props.selectedKeys),
    new Set(props.defaultSelectedKeys ?? noKeys),
    props.onSelectionChange,
  );
  const [filter, setFilter] = useControllableState(
    props.filter,
    props.defaultFilter ?? everyVersion,
    props.onFilterChange,
  );
  const select = (keys: Selection) => {
    if (keys !== 'all') setSelected(limitSelection(selected, keys));
  };
  return { selected, select, filter, setFilter };
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

/**
 * The saved versions of a document or record, newest first: named and automatic versions with who
 * saved them and when, the current one marked. Select one to view it and two to compare them;
 * restore a version after a confirmation, name or rename it, and filter to named versions or one
 * person's.
 */
export function VersionHistory(props: VersionHistoryProps) {
  const { versions, currentKey = null, showFilters = true, onCompare, onRestore, onRename } = props;
  const { className, isLoading = false, ...rest } = props;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { selected, select, filter, setFilter } = useVersionState(props);
  const dialog = useVersionDialog();
  const comparison = orderForComparison(versions, selected);
  const context = {
    currentKey,
    locale,
    strings,
    canRename: onRename !== undefined,
    canRestore: onRestore !== undefined,
    onAction: dialog.open,
    showAvatar: props.showAvatar,
    fallbackAfterDays: props.fallbackAfterDays,
    getNow: props.getNow,
  };
  const isNamed = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
  return (
    <div
      ref={props.ref}
      id={props.id}
      {...hooks.root({ className, props: rest, data: { loading: isLoading } })}
    >
      {showFilters || onCompare ? (
        <VersionToolbar
          filter={showFilters ? filter : null}
          onFilterChange={setFilter}
          people={listVersionPeople(versions)}
          onCompare={onCompare ? () => comparison && onCompare(comparison) : null}
          canCompare={comparison !== null}
        />
      ) : null}
      {props.error ? (
        <VersionListError error={props.error} onRetry={props.onRetry} />
      ) : (
        <ListView
          className={hooks.slotClass('list')}
          aria-label={isNamed ? props['aria-label'] : strings.versionHistory}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
          aria-details={props['aria-details']}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={select}
          disabledKeys={versions.filter((version) => version.isDisabled).map(({ id }) => id)}
          onLoadMore={props.onLoadMore}
          isLoading={isLoading}
          renderEmptyState={() => (
            <VersionListEmpty
              isLoading={isLoading}
              hasVersions={versions.length > 0}
              renderEmptyState={props.renderEmptyState}
            />
          )}
        >
          {filterVersions(versions, filter).map((version) => renderVersionRow(version, context))}
        </ListView>
      )}
      {onRestore ? (
        <RestoreVersionDialog {...dialog.propsFor('restore')} onAction={onRestore} />
      ) : null}
      {onRename ? <RenameVersionDialog {...dialog.propsFor('rename')} onAction={onRename} /> : null}
    </div>
  );
}
