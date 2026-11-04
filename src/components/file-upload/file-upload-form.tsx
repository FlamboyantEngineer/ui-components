'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLatest } from '../../utils/use-latest.js';
import { useNativeReset } from '../../utils/use-native-reset.js';
import { InlineError } from '../inline-error/inline-error.js';
import { fileUploadHooks as hooks, type FileUploadItem } from './file-upload-files.js';
import { registerFileInput } from './file-upload-form-data.js';

interface FileFormInputProps {
  /** The form field name the files are submitted under. */
  name: string | undefined;
  /** The upload is required and lists no file, so a form submit is refused. */
  isRequired: boolean;
  /** The upload is disabled: the input is left out of the form's data and its validation. */
  isDisabled: boolean;
  /** The chosen files of the listed items, submitted with the form. */
  files: readonly File[];
  /** A form submit found the upload required and empty. */
  onInvalid: () => void;
}

interface FileFormOptions {
  name?: string | undefined;
  isRequired?: boolean | undefined;
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  errorMessage?: ReactNode;
  files: readonly FileUploadItem[];
  /** The command focused when a form submit finds the upload required and empty. */
  commandRef: RefObject<HTMLButtonElement | null>;
}

/** An upload's part in a form: its hidden input, its error message and whether it is invalid. */
interface FileForm {
  input: ReactNode;
  /** The error message element, if any. */
  message: ReactNode;
  /** Whether there is an error message, which `errorId` names. */
  error: boolean;
  errorId: string;
  isInvalid: boolean;
}

function isSameFiles(held: readonly File[], files: readonly File[]): boolean {
  return held.length === files.length && held.every((file, index) => file === files[index]);
}

/** Puts the files into the input, unless it holds them already; `held` keeps what it was given. */
function fillInput(
  input: HTMLInputElement,
  files: readonly File[],
  held: { current: readonly File[] },
) {
  if (typeof DataTransfer !== 'function') return;
  if (input.files?.length === files.length && isSameFiles(held.current, files)) return;
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  held.current = files;
}

/**
 * Keeps the input in step with the listed files through a native reset of its form, which empties
 * it while the list, which the owner holds, stays. Form data built in between (a submit right after
 * `form.reset()`) carries the listed files rather than the emptied input, and once every listener has
 * seen the reset the input is filled again; a reset a listener cancels changes nothing.
 */
function useResetFiles(
  ref: RefObject<HTMLInputElement | null>,
  {
    files,
    held,
  }: {
    files: readonly File[];
    held: { current: readonly File[] };
  },
) {
  const latest = useLatest(files);
  useNativeReset(ref, () => {
    if (ref.current) fillInput(ref.current, latest.current, held);
  });
  useEffect(() => {
    const input = ref.current;
    if (!input) return undefined;
    return registerFileInput(input, () => latest.current);
  }, [ref, latest]);
}

/**
 * The hidden file input that takes part in a form: it holds the listed files, so a native submit
 * or `FormData` carries them under `name`, and it is required when the upload is. A browser that
 * cannot set an input's files (no `DataTransfer`) still has form data carry them. The files are set
 * again only when they change, or when a form reset emptied the input, not on every render.
 */
function FileFormInput({ name, isRequired, isDisabled, files, onInvalid }: FileFormInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const held = useRef<readonly File[]>([]);
  useLayoutEffect(() => {
    if (ref.current) fillInput(ref.current, files, held);
  }, [files]);
  useResetFiles(ref, { files, held });
  return (
    <input
      ref={ref}
      type="file"
      name={name}
      multiple
      hidden
      disabled={isDisabled}
      required={isRequired}
      tabIndex={-1}
      onInvalid={(event: FormEvent<HTMLInputElement>) => {
        // The upload reports the problem itself and moves focus to its command.
        event.preventDefault();
        onInvalid();
      }}
    />
  );
}

/**
 * Lets an upload take part in a form: a hidden input submits the listed files under `name` and
 * refuses a submit while a required upload lists none, which shows the provider's `valueRequired`
 * message and focuses the command. A disabled upload submits nothing and, like a read-only one,
 * refuses no submit. The caller's `errorMessage` shows while `isInvalid`.
 */
export function useFileForm(options: FileFormOptions): FileForm {
  const { name, isRequired = false, isInvalid = false, errorMessage, files, commandRef } = options;
  const { isDisabled = false, isReadOnly = false } = options;
  const strings = useUiStrings();
  const errorId = useId();
  const [isMissing, setMissing] = useState(false);
  const missing = isMissing && files.length === 0;
  const error = missing ? strings.valueRequired : isInvalid ? errorMessage : null;
  const hasError = !isEmptyNode(error);
  return {
    input:
      name !== undefined || isRequired ? (
        <FileFormInput
          name={name}
          isRequired={isRequired && !isReadOnly && !isDisabled && files.length === 0}
          isDisabled={isDisabled}
          files={files.flatMap(({ file }) => (file ? [file] : []))}
          onInvalid={() => {
            setMissing(true);
            commandRef.current?.focus();
          }}
        />
      ) : null,
    message: hasError ? (
      <InlineError id={errorId} className={hooks.slotClass('error')}>
        {error}
      </InlineError>
    ) : null,
    error: hasError,
    errorId,
    isInvalid: isInvalid || missing,
  };
}
