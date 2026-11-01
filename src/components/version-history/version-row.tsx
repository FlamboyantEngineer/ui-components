'use client';

// One version's row in a version history: its name or time, the current mark, who made it and
// when, its summary, and its menu of actions.

import type { ReactElement } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { capitalizeText } from '../../utils/relative-time.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution, type AttributionProps } from '../attribution/attribution.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { ListViewItem } from '../list-row/list-row.js';
import type { VersionDialogTarget } from './version-dialogs.js';
import type { VersionHistoryVersion } from './version-history.js';
import { formatVersionTime, isNamedVersion } from './version-model.js';

/** A version menu's actions. */
export type VersionAction = 'rename' | 'restore';

interface VersionRowContext extends Pick<
  AttributionProps,
  'showAvatar' | 'fallbackAfterDays' | 'getNow' | 'timeZone'
> {
  currentKey: Key | null;
  locale: string;
  /** The zone version times read in: `timeZone`, else the provider's (`useTimeZone`). */
  timeZone: string;
  strings: UiStrings;
  /** Whether versions can be named and renamed. */
  canRename: boolean;
  /** Whether versions other than the current one can be restored. */
  canRestore: boolean;
  onAction: (action: VersionAction, target: VersionDialogTarget) => void;
}

export const versionHistoryHooks = createHooks('version-history', [
  'toolbar',
  'named-only',
  'person',
  'compare',
  'list',
  'version',
  'label',
  'current',
  'attribution',
  'summary',
  'actions',
  'error',
]);

const hooks = versionHistoryHooks;

/** The version as a dialog target: its key, its title and its own name. */
function toVersionTarget(
  version: VersionHistoryVersion,
  context: Pick<VersionRowContext, 'locale' | 'timeZone' | 'strings'>,
): VersionDialogTarget {
  const label = version.label?.trim() ?? '';
  const title =
    label ||
    formatVersionTime(version.time, context.locale, context.timeZone) ||
    capitalizeText(context.strings.unknownTime, context.locale);
  return { key: version.id, title, label };
}

/** The actions a version's menu offers. */
function listActions(version: VersionHistoryVersion, context: VersionRowContext) {
  const { strings } = context;
  const actions: { id: VersionAction; label: string }[] = [];
  if (context.canRename) {
    const label = isNamedVersion(version) ? strings.renameVersion : strings.nameVersion;
    actions.push({ id: 'rename', label });
  }
  if (context.canRestore && version.id !== context.currentKey) {
    actions.push({ id: 'restore', label: strings.restoreVersion });
  }
  return actions;
}

/** One version as a row of the history's list view. */
export function renderVersionRow(
  version: VersionHistoryVersion,
  context: VersionRowContext,
): ReactElement {
  const { strings } = context;
  const target = toVersionTarget(version, context);
  const isCurrent = version.id === context.currentKey;
  const actions = version.isDisabled ? [] : listActions(version, context);
  return (
    <ListViewItem
      key={toKeyIdentity(version.id)}
      id={version.id}
      textValue={target.title}
      className={hooks.slotClass('version')}
      data-named={isNamedVersion(version) || undefined}
      data-current={isCurrent || undefined}
      title={
        <>
          <span {...hooks.slot('label')}>{target.title}</span>
          {isCurrent ? <span {...hooks.slot('current')}>{strings.currentVersion}</span> : null}
        </>
      }
      meta={
        <>
          <Attribution
            time={version.time}
            person={version.person}
            showAvatar={context.showAvatar}
            fallbackAfterDays={context.fallbackAfterDays}
            getNow={context.getNow}
            timeZone={context.timeZone}
            className={hooks.slotClass('attribution')}
          />
          {isEmptyNode(version.summary) ? null : (
            <span {...hooks.slot('summary')}>{version.summary}</span>
          )}
        </>
      }
      trailing={
        actions.length > 0 ? (
          <DropdownMenu
            iconOnly
            label={strings.versionActions(target.title)}
            variant="ghost"
            size="sm"
            className={hooks.slotClass('actions')}
            items={actions}
            onAction={(key) => context.onAction(key as VersionAction, target)}
          />
        ) : null
      }
    />
  );
}
