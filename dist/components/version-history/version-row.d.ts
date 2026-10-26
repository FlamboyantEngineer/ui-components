import type { ReactElement } from 'react';
import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import { type AttributionProps } from '../attribution/attribution.js';
import type { VersionDialogTarget } from './version-dialogs.js';
import type { VersionHistoryVersion } from './version-history.js';
/** A version menu's actions. */
export type VersionAction = 'rename' | 'restore';
export interface VersionRowContext extends Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
    currentKey: Key | null;
    locale: string;
    strings: UiStrings;
    /** Whether versions can be named and renamed. */
    canRename: boolean;
    /** Whether versions other than the current one can be restored. */
    canRestore: boolean;
    onAction: (action: VersionAction, target: VersionDialogTarget) => void;
}
export declare const versionHistoryHooks: import("../../core/hooks.js").ComponentHooks<"label" | "summary" | "version" | "error" | "actions" | "attribution" | "list" | "toolbar" | "current" | "person" | "named-only" | "compare">;
/** The version as a dialog target: its key, its title and its own name. */
export declare function toVersionTarget(version: VersionHistoryVersion, context: Pick<VersionRowContext, 'locale' | 'strings'>): VersionDialogTarget;
/** One version as a row of the history's list view. */
export declare function renderVersionRow(version: VersionHistoryVersion, context: VersionRowContext): ReactElement;
//# sourceMappingURL=version-row.d.ts.map