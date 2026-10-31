// Which offered files a file upload accepts: by type, size, count and the caller's own check.

import { isThenable } from '../../utils/is-thenable.js';

/** Why an offered file was refused; `unchecked` when `validate` failed (it threw or its promise rejected). */
export type FileRejectionReason = 'type' | 'size' | 'min-size' | 'count' | 'invalid' | 'unchecked';

/** An offered file the upload refused, and why. */
export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
  /** The caller's message, for a file its `validate` refused. */
  message?: string | undefined;
}

/**
 * The caller's check of one offered file, given the files of the same offer accepted before it:
 * a message refuses the file. It may answer later, as a promise.
 */
export type FileValidator = (
  file: File,
  accepted: readonly File[],
) => string | null | undefined | Promise<string | null | undefined>;

export interface FileRules {
  /** Extensions (`.pdf`), MIME types (`image/png`) or MIME families (`image/*`). Any type without. */
  acceptedFileTypes?: readonly string[] | undefined;
  /** The largest accepted file, in bytes. No limit without. */
  maxSize?: number | undefined;
  /** The smallest accepted file, in bytes. No limit without. */
  minSize?: number | undefined;
  /** The most files the upload holds, counting the listed ones. No limit without. */
  maxFiles?: number | undefined;
  /** The caller's check of each file that passes the other rules. */
  validate?: FileValidator | undefined;
}

/** The accepted files of an offer and the refusals, in the order they were offered. */
export interface FilePartition {
  accepted: File[];
  rejections: FileRejection[];
}

/** A dragged item as the browser reports it before the drop: its kind and MIME type only. */
export interface DraggedItem {
  kind: string;
  type: string;
}

function matchesType(file: { name?: string; type: string }, entry: string): boolean {
  const type = entry.trim().toLowerCase();
  if (!type) return false;
  if (type.startsWith('.')) return file.name?.toLowerCase().endsWith(type) ?? false;
  if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1));
  return file.type.toLowerCase() === type;
}

/** Whether a file's extension or MIME type is among the accepted types; any type without a list. */
function isFileTypeAccepted(file: File, acceptedFileTypes?: readonly string[]): boolean {
  if (!acceptedFileTypes || acceptedFileTypes.length === 0) return true;
  return acceptedFileTypes.some((entry) => matchesType(file, entry));
}

function checkFileRules(file: File, rules: FileRules): FileRejectionReason | null {
  const { acceptedFileTypes, maxSize, minSize } = rules;
  if (!isFileTypeAccepted(file, acceptedFileTypes)) return 'type';
  if (maxSize !== undefined && maxSize > 0 && file.size > maxSize) return 'size';
  if (minSize !== undefined && file.size < minSize) return 'min-size';
  return null;
}

/** A verdict `validate` could not give: it threw. */
const unchecked = Symbol('unchecked');

/** Runs `validate` on one file, turning a throw into `unchecked` as a rejected promise is. */
function checkValidator(
  validate: FileValidator | undefined,
  file: File,
  accepted: readonly File[],
): ReturnType<FileValidator> | undefined | typeof unchecked {
  try {
    return validate?.(file, [...accepted]);
  } catch {
    return unchecked;
  }
}

/**
 * Sorts offered files into the accepted ones and the refusals, keeping their order: a file must
 * match the types, fit the size limits, pass `validate` and fit within `maxFiles`, where `held`
 * files are already listed. The result is immediate unless `validate` answers with a promise; a
 * `validate` that throws, or answers with a promise that rejects, refuses its file as `unchecked`
 * and the other files are still sorted, so the result never throws or rejects.
 */
export function partitionFiles(
  files: readonly File[],
  rules: FileRules,
  held = 0,
): FilePartition | Promise<FilePartition> {
  const partition: FilePartition = { accepted: [], rejections: [] };
  const admit = (file: File, message: string | null | undefined) => {
    const isFull =
      rules.maxFiles !== undefined && held + partition.accepted.length >= rules.maxFiles;
    if (message) partition.rejections.push({ file, reason: 'invalid', message });
    else if (isFull) partition.rejections.push({ file, reason: 'count' });
    else partition.accepted.push(file);
  };
  const sortFrom = (index: number): FilePartition | Promise<FilePartition> => {
    for (let at = index; at < files.length; at += 1) {
      const file = files[at] as File;
      const reason = checkFileRules(file, rules);
      if (reason) partition.rejections.push({ file, reason });
      const verdict = reason ? null : checkValidator(rules.validate, file, partition.accepted);
      if (verdict === unchecked) partition.rejections.push({ file, reason: 'unchecked' });
      else if (isThenable(verdict)) {
        return verdict.then(
          (message) => {
            admit(file, message);
            return sortFrom(at + 1);
          },
          () => {
            partition.rejections.push({ file, reason: 'unchecked' });
            return sortFrom(at + 1);
          },
        );
      } else if (!reason) admit(file, verdict);
    }
    return partition;
  };
  return sortFrom(0);
}

/**
 * Whether dragged items would pass the rules a drag can check: the count against `maxFiles`, and
 * each MIME type against the MIME rules. Extensions, sizes and `validate` wait for the drop, so a
 * file they could refuse counts as passing.
 */
export function canAcceptDrag(items: readonly DraggedItem[], rules: FileRules, held = 0): boolean {
  const files = items.filter(({ kind }) => kind === 'file');
  if (rules.maxFiles !== undefined && held + files.length > rules.maxFiles) return false;
  const types = rules.acceptedFileTypes ?? [];
  if (types.length === 0 || types.some((entry) => entry.trim().startsWith('.'))) return true;
  return files.every(({ type }) => !type || types.some((entry) => matchesType({ type }, entry)));
}
