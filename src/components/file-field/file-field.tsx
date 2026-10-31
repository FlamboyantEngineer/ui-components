'use client';

import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, FieldFormValue, useFieldControl, type FieldInputProps } from '../field/field.js';
import {
  FileUpload,
  type FileUploadItem,
  type FileUploadVariant,
} from '../file-upload/file-upload.js';
import { compareFileItems, restoreFileItem, type FileFieldItem } from './file-field-changes.js';
import {
  RemovedFiles,
  fileFieldHooks as hooks,
  renderFileFieldActions,
} from './file-field-parts.js';

export type { FileFieldItem } from './file-field-changes.js';

export interface FileFieldProps extends FieldInputProps<FileFieldItem[]> {
  /** Receives the accepted files; the owner uploads them and adds the stored files to the value. */
  onSelect: (files: File[]) => void;
  /** The owner's uploads in flight or failed, listed after the value. */
  uploads?: readonly FileUploadItem[] | undefined;
  /** Removes an upload row: cancels the upload or dismisses its error. */
  onUploadRemove?: ((id: Key) => void) | undefined;
  /** Takes several files; without it the field holds one. */
  allowsMultiple?: boolean | undefined;
  /** Defaults to `button`. */
  variant?: FileUploadVariant | undefined;
  /** Extensions (`.pdf`), MIME types (`image/png`) or MIME families (`image/*`). Any type without. */
  acceptedFileTypes?: readonly string[] | undefined;
  /** The largest accepted file, in bytes. */
  maxSize?: number | undefined;
  /** The most files the field holds, counting the value and the uploads. Defaults to 1 without `allowsMultiple`. */
  maxFiles?: number | undefined;
  /** Trailing actions of a held file, such as an open link, after its download link. */
  renderFileActions?: ((file: FileFieldItem) => ReactNode) | undefined;
  /** Replaces the thumbnail of a held file, such as with an audio or video player. */
  renderFilePreview?: ((file: FileFieldItem) => ReactNode) | undefined;
}

/** Whether an upload is still running, so the field waits for it. */
function isUploading({ progress, error }: FileUploadItem): boolean {
  return !error && progress !== undefined && progress < 100;
}

/** A held file as the upload lists it, marked when an edit added it. */
function toUploadItem(item: FileFieldItem, added: ReadonlySet<Key>): FileUploadItem {
  const { id, name, size, type, previewUrl } = item;
  return { id, name, size, type, previewUrl, change: added.has(id) ? 'added' : undefined };
}

/**
 * A field whose value is a list of stored files: the library's `FileUpload` chooses and checks new
 * files and hands them to the owner, who uploads them, reports the uploads in progress and adds the
 * stored files to the value. Each held file shows its preview or type glyph, its size, a download
 * link and a remove button; while the field is dirty, added files are marked and removed ones can
 * be put back. Running uploads make the field pending. It has the field base's label, validation,
 * dirty state, restore, undo and menu.
 */
export function FileField({
  onSelect,
  uploads = [],
  onUploadRemove,
  allowsMultiple = false,
  variant,
  acceptedFileTypes,
  maxSize,
  maxFiles = allowsMultiple ? undefined : 1,
  renderFileActions,
  renderFilePreview,
  ...props
}: FileFieldProps) {
  const strings = useUiStrings();
  const { state, field, rest } = useFieldControl(
    { ...props, isPending: Boolean(props.isPending) || uploads.some(isUploading) },
    { initialValue: [], emptyValue: [] },
  );
  const { value, committedValue } = state;
  const changes = state.isDirty ? compareFileItems(value, committedValue) : null;
  const held = new Map(value.map((item) => [item.id, item]));
  const isFull = maxFiles !== undefined && value.length + uploads.length >= maxFiles;
  const apply = (next: FileFieldItem[]) => {
    state.setValue(next);
    state.commit();
  };
  const remove = (id: Key) =>
    held.has(id) ? apply(value.filter((item) => item.id !== id)) : onUploadRemove?.(id);
  const withHeld = (render: (item: FileFieldItem) => ReactNode) => (file: FileUploadItem) => {
    const item = held.get(file.id);
    return item ? render(item) : null;
  };
  return (
    <Field {...field} {...hooks.root({ className: field.className })} state={state}>
      {(control) => (
        <>
          <FileUpload
            className={hooks.slotClass('upload')}
            label={allowsMultiple ? strings.addFiles : strings.addFile}
            variant={variant}
            allowsMultiple={allowsMultiple}
            acceptedFileTypes={acceptedFileTypes}
            maxSize={maxSize}
            maxFiles={maxFiles}
            files={[
              ...value.map((item) => toUploadItem(item, changes?.added ?? new Set())),
              ...uploads,
            ]}
            onSelect={onSelect}
            onRemove={remove}
            isDisabled={control.disabled}
            isReadOnly={control.readOnly}
            isInvalid={control['aria-invalid']}
            aria-label={control['aria-label']}
            aria-labelledby={control['aria-labelledby']}
            aria-describedby={control['aria-describedby']}
            commandRef={control.ref}
            renderFileActions={withHeld((item) => renderFileFieldActions(item, renderFileActions))}
            renderFilePreview={withHeld((item) => renderFilePreview?.(item))}
          />
          <RemovedFiles
            removed={changes?.removed ?? []}
            isDisabled={isFull || control.disabled || control.readOnly}
            onRestore={(item) => apply(restoreFileItem(value, committedValue, item))}
          />
          {rest.name ? (
            <FieldFormValue
              name={rest.name}
              value={value.map((item) => String(item.id))}
              isDisabled={control.disabled}
            />
          ) : null}
        </>
      )}
    </Field>
  );
}
