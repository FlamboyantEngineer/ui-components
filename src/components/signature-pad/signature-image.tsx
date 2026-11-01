'use client';

import { ClipboardGlyph, DeleteGlyph, UploadGlyph } from '../../core/glyphs.js';
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { FileTrigger, useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { joinIds } from '../../utils/join-ids.js';
import { mergeRefs } from '../../utils/merge-props.js';
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

interface SignatureImageAreaProps {
  control: FieldControlProps;
  /** The image shown, or `null` for an empty area. */
  image: ImageSignature | null;
  isEditable: boolean;
  /** The largest image file taken, in bytes. */
  maxSize: number;
  /** Called with an image read from an upload or a paste, or `null` when it is cleared. */
  onImage: (image: ImageSignature | null) => void;
}

/**
 * Takes files as the signature image, the latest one winning: a file read after another was
 * chosen, or after the area left, is dropped. A refused file leaves the value and shows why.
 */
function useImageIntake(
  owner: RefObject<HTMLElement | null>,
  { maxSize, onImage }: Pick<SignatureImageAreaProps, 'maxSize' | 'onImage'>,
) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const latest = useRef(0);
  const [message, setMessage] = useState<string | null>(null);
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
    const node = owner.current;
    if (!file || !node) {
      setMessage(strings.signatureImageNoPaste);
      return;
    }
    const result = await readSignatureImage(file, { maxSize, owner: node });
    if (ticket !== latest.current) return;
    if ('image' in result) {
      setMessage(null);
      onImage(result.image);
    } else setMessage(problems[result.problem]);
  };
  const clear = () => {
    latest.current += 1;
    setMessage(null);
    onImage(null);
  };
  return { message, take, clear };
}

/**
 * The image mode's area: an image named by the field's label that shows the signature image (its
 * aspect ratio and transparency kept by the host stylesheet), or a hint while empty, then Upload
 * image, Paste image and Clear as icon buttons. A paste anywhere in it takes the clipboard's first image.
 */
export function SignatureImageArea(props: SignatureImageAreaProps) {
  const { control, image, isEditable } = props;
  const strings = useUiStrings();
  const hintId = useId();
  const surface = useRef<HTMLDivElement>(null);
  const surfaceRef = useMemo(() => mergeRefs<HTMLDivElement>(control.ref, surface), [control.ref]);
  const { message, take, clear } = useImageIntake(surface, props);
  return (
    <div
      {...hooks.slot('image')}
      onPaste={(event) => {
        if (!isEditable) return;
        event.preventDefault();
        void take(findImageFile(event.clipboardData.files));
      }}
    >
      <div
        {...hooks.slot('image-surface', { empty: image === null })}
        ref={surfaceRef}
        id={control.id}
        role="img"
        tabIndex={-1}
        aria-label={control['aria-label']}
        aria-labelledby={control['aria-labelledby']}
        aria-describedby={joinIds(image ? undefined : hintId, control['aria-describedby'])}
        aria-invalid={control['aria-invalid']}
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
        <FileTrigger
          acceptedFileTypes={[...signatureImageTypes]}
          onSelect={(files) => {
            const [file] = files ? Array.from(files) : [];
            if (file) void take(file);
          }}
        >
          <Button
            size="sm"
            icon={UploadGlyph}
            label={strings.uploadSignatureImage}
            tooltip={strings.uploadSignatureImage}
            isDisabled={!isEditable}
          />
        </FileTrigger>
        <Button
          size="sm"
          icon={ClipboardGlyph}
          label={strings.pasteSignatureImage}
          tooltip={strings.pasteSignatureImage}
          isDisabled={!isEditable}
          onPress={async () => take(await readClipboardImage(surface.current))}
        />
        <Button
          size="sm"
          icon={DeleteGlyph}
          label={strings.clear}
          tooltip={strings.clear}
          isDisabled={!isEditable || image === null}
          onPress={clear}
        />
      </div>
      <p {...hooks.slot('image-message')} role="status">
        {message}
      </p>
    </div>
  );
}
