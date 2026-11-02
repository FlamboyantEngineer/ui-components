'use client';

import { ClipboardGlyph, DeleteGlyph, UploadGlyph } from '../../core/glyphs.js';
import { useEffect, useId, useRef, useState } from 'react';
import { FileTrigger, useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { joinIds } from '../../utils/join-ids.js';
import { Button } from '../button/button.js';
import type { FieldControlProps } from '../field/field.js';
import {
  findImageFile,
  readClipboardImage,
  readSignatureImage,
  signatureImageTypes,
  type SignatureImageProblem,
} from './signature-image-file.js';
import type { ImageSignature } from './signature-path.js';
import { signaturePadHooks as hooks } from './signature-surface.js';

interface ImageIntakeOptions {
  /** The largest image file taken, in bytes. */
  maxSize: number;
  /** Whether the image mode shows; leaving it drops a file still being read and its message. */
  isActive: boolean;
  /** Called with an image read from an upload or a paste, or `null` when it is deleted. */
  onImage: (image: ImageSignature | null) => void;
}

/** The pad's image intake, shared by the image area's buttons and the field menu. */
export interface ImageIntake {
  /** Why the latest file was refused, or `null`. */
  message: string | null;
  /** Mounts the hidden file input the chooser opens from. */
  setChooser: (input: HTMLInputElement | null) => void;
  take: (file: Blob | null) => Promise<void>;
  /** Opens the file chooser. Called from a press or a menu action, so the browser allows it. */
  upload: () => void;
  /** Takes the system clipboard's first image. */
  paste: () => Promise<void>;
  /** Deletes the image, dropping any file still being read. */
  clear: () => void;
}

/**
 * Takes files as the signature image, the latest one winning: a file read after another was
 * chosen, after the image was deleted or after the image mode left is dropped. A refused file
 * leaves the value and shows why.
 */
export function useImageIntake({ maxSize, isActive, onImage }: ImageIntakeOptions): ImageIntake {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const latest = useRef(0);
  const [chooser, setChooser] = useState<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [wasActive, setWasActive] = useState(isActive);
  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (!isActive) setMessage(null);
  }
  useEffect(() => {
    if (!isActive) latest.current += 1;
  }, [isActive]);
  useEffect(
    () => () => {
      latest.current += 1;
    },
    [],
  );
  const problems: Record<SignatureImageProblem, string> = {
    type: strings.signatureImageType,
    size: strings.signatureImageSize(formatBytes(maxSize, locale)),
    unreadable: strings.signatureImageUnreadable,
  };
  const take = async (file: Blob | null) => {
    latest.current += 1;
    const ticket = latest.current;
    if (!file || !chooser) {
      setMessage(strings.signatureImageNoPaste);
      return;
    }
    const result = await readSignatureImage(file, { maxSize, owner: chooser });
    if (ticket !== latest.current) return;
    if ('image' in result) {
      setMessage(null);
      onImage(result.image);
    } else setMessage(problems[result.problem]);
  };
  return {
    message,
    setChooser,
    take,
    upload: () => chooser?.click(),
    paste: async () => take(await readClipboardImage(chooser)),
    clear() {
      latest.current += 1;
      setMessage(null);
      onImage(null);
    },
  };
}

/** The hidden file input of the image intake, mounted in every mode so the menu can open it. */
export function SignatureImageChooser({ intake }: { intake: ImageIntake }) {
  const { setChooser, take } = intake;
  return (
    <FileTrigger
      ref={setChooser}
      acceptedFileTypes={[...signatureImageTypes]}
      onSelect={(files) => {
        const [file] = files ? Array.from(files) : [];
        if (file) void take(file);
      }}
    />
  );
}

interface SignatureImageAreaProps {
  control: FieldControlProps;
  /** The image shown, or `null` for an empty area. */
  image: ImageSignature | null;
  isEditable: boolean;
  intake: ImageIntake;
}

/**
 * The image mode's area: an image named by the field's label that shows the signature image (its
 * aspect ratio and transparency kept by the host stylesheet), or a hint while empty, then Upload
 * image, Paste image and Clear as icon buttons. A paste anywhere in it takes the clipboard's first image.
 */
export function SignatureImageArea(props: SignatureImageAreaProps) {
  const { control, image, isEditable, intake } = props;
  const { ref: controlRef, ...controlProps } = control;
  const strings = useUiStrings();
  const hintId = useId();
  return (
    <div
      {...hooks.slot('image')}
      onPaste={(event) => {
        if (!isEditable) return;
        event.preventDefault();
        void intake.take(findImageFile(event.clipboardData.files));
      }}
    >
      <div
        {...hooks.slot('image-surface', { empty: image === null })}
        ref={controlRef}
        id={controlProps.id}
        role="img"
        tabIndex={-1}
        aria-label={controlProps['aria-label']}
        aria-labelledby={controlProps['aria-labelledby']}
        aria-describedby={joinIds(image ? undefined : hintId, controlProps['aria-describedby'])}
        aria-invalid={controlProps['aria-invalid']}
      >
        {image ? (
          <img {...hooks.slot('image-preview')} src={image.src} alt="" draggable={false} />
        ) : (
          <span {...hooks.slot('image-hint')} id={hintId}>
            {strings.signatureImageEmpty}
          </span>
        )}
      </div>
      <div {...hooks.slot('actions')}>
        <Button
          size="sm"
          icon={UploadGlyph}
          label={strings.uploadSignatureImage}
          tooltip={strings.uploadSignatureImage}
          isDisabled={!isEditable}
          onPress={intake.upload}
        />
        <Button
          size="sm"
          icon={ClipboardGlyph}
          label={strings.pasteSignatureImage}
          tooltip={strings.pasteSignatureImage}
          isDisabled={!isEditable}
          onPress={intake.paste}
        />
        <Button
          size="sm"
          icon={DeleteGlyph}
          label={strings.clear}
          tooltip={strings.clear}
          isDisabled={!isEditable || image === null}
          onPress={intake.clear}
        />
      </div>
      <p {...hooks.slot('image-message')} role="status">
        {intake.message}
      </p>
    </div>
  );
}
