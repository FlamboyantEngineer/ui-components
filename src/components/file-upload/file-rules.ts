// Which chosen files a file upload accepts: by type and by size.

/** Why a chosen file was refused. */
export type FileRejectionReason = 'type' | 'size';

/** A chosen file the upload refused, and why. */
export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileRules {
  /** Extensions (`.pdf`), MIME types (`image/png`) or MIME families (`image/*`). Any type without. */
  acceptedFileTypes?: readonly string[] | undefined;
  /** The largest accepted file, in bytes. No limit without. */
  maxSize?: number | undefined;
}

function matchesType(file: File, entry: string): boolean {
  const type = entry.trim().toLowerCase();
  if (!type) return false;
  if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type);
  if (type.endsWith('/*')) return file.type.toLowerCase().startsWith(type.slice(0, -1));
  return file.type.toLowerCase() === type;
}

/** Whether a file's extension or MIME type is among the accepted types; any type without a list. */
function isFileTypeAccepted(file: File, acceptedFileTypes?: readonly string[]): boolean {
  if (!acceptedFileTypes || acceptedFileTypes.length === 0) return true;
  return acceptedFileTypes.some((entry) => matchesType(file, entry));
}

/** Splits chosen files into the accepted ones and the refusals, keeping their order. */
export function partitionFiles(
  files: readonly File[],
  { acceptedFileTypes, maxSize }: FileRules,
): { accepted: File[]; rejections: FileRejection[] } {
  const accepted: File[] = [];
  const rejections: FileRejection[] = [];
  for (const file of files) {
    if (!isFileTypeAccepted(file, acceptedFileTypes)) rejections.push({ file, reason: 'type' });
    else if (maxSize !== undefined && maxSize > 0 && file.size > maxSize) {
      rejections.push({ file, reason: 'size' });
    } else accepted.push(file);
  }
  return { accepted, rejections };
}
