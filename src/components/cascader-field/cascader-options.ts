// A cascader field's options and the pure helpers on them, which run on the server too.

import type { Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { PickerOption } from '../field/field-picker-items.js';

/**
 * One option of a cascader field: a picker option (`id`, `label`, `description`, `icon`,
 * `isDisabled`) that may hold the options of the next level, given now (`children`) or loaded when
 * the reader opens it (`hasChildren`, with the field's `loadChildren`).
 */
export interface CascaderOption extends PickerOption {
  /** The options under this one, when the host has them. */
  children?: readonly CascaderOption[] | undefined;
  /** The option has children the host loads on demand; without `children` they load on opening. */
  hasChildren?: boolean | undefined;
}

/** The chosen path: the ids from a top-level option down to the chosen leaf, or `null`. */
export type CascaderValue = readonly Key[] | null;

/** Reads an option's children: its own, or those loaded for its path. */
export type CascaderChildren = (
  path: readonly CascaderOption[],
) => readonly CascaderOption[] | undefined;

/** Whether an option opens a next level rather than being chosen. */
export function isCascaderBranch(option: CascaderOption): boolean {
  return (option.children?.length ?? 0) > 0 || option.hasChildren === true;
}

/** A text identity for a path of ids, numeric and text ids kept apart. */
export function toCascaderPathKey(path: readonly Key[]): string {
  return JSON.stringify(path.map(toKeyIdentity));
}

/** Whether two paths name the same ids, in order. */
export function isSameCascaderPath(left: CascaderValue, right: CascaderValue): boolean {
  if (left === null || right === null) return left === right;
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

/**
 * The options a path of ids names, level by level, as far as the known children reach: an id no
 * known option has ends the walk.
 */
export function resolveCascaderPath(
  options: readonly CascaderOption[],
  { path, getChildren }: { path: readonly Key[]; getChildren: CascaderChildren },
): CascaderOption[] {
  const resolved: CascaderOption[] = [];
  let level: readonly CascaderOption[] | undefined = options;
  for (const key of path) {
    const option: CascaderOption | undefined = level?.find((candidate) => candidate.id === key);
    if (!option) break;
    resolved.push(option);
    level = getChildren(resolved);
  }
  return resolved;
}
