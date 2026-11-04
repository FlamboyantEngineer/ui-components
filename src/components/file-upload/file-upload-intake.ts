'use client';

import { type DragEvent, useLayoutEffect, useRef, useState } from 'react';
import { isThenable } from '../../utils/is-thenable.js';
import { useLatest } from '../../utils/use-latest.js';
import {
  canAcceptDrag,
  type FilePartition,
  type FileRejection,
  type FileRules,
  partitionFiles,
} from './file-rules.js';
import type { FileUploadProps } from './file-upload.js';
import { readDraggedItems } from './file-upload-drop.js';
import type { FileUploadItem } from './file-upload-files.js';

type IntakeOffer = { files: readonly File[] } | { error: unknown };

/** Handles a read failure as soon as it occurs, even while the offer waits behind another one. */
function readOffer(offered: readonly File[] | Promise<File[]>): IntakeOffer | Promise<IntakeOffer> {
  return isThenable(offered)
    ? Promise.resolve(offered).then(
        (files) => ({ files }),
        (error: unknown) => ({ error }),
      )
    : { files: offered };
}

/** Owns queued offers and their lifetime, and counts handed-on files until the owner's next list. */
function useIntakeLifetime(listed: readonly FileUploadItem[], isLocked: boolean) {
  const held = listed.length;
  const countRef = useRef({ held, accepted: 0 });
  const queueRef = useRef<Promise<void> | null>(null);
  const lifetimeRef = useRef({});
  useLayoutEffect(() => {
    countRef.current = { held, accepted: 0 };
  }, [listed, held]);
  useLayoutEffect(() => {
    if (!isLocked) return;
    lifetimeRef.current = {};
    queueRef.current = null;
  }, [isLocked]);
  useLayoutEffect(
    () => () => {
      lifetimeRef.current = {};
      queueRef.current = null;
    },
    [],
  );
  return { countRef, queueRef, lifetimeRef };
}

/**
 * Checks offered files, reports the refusals and hands on the accepted ones, and judges a drag
 * before the drop. `listed` are the owner's files. Files handed on stay counted against `maxFiles`
 * until the owner gives a new `files` list, however often the upload renders itself, so offers
 * made before the owner lists them never pass the limit together. An offer made while an earlier
 * one still waits for a file read or `validate` is checked once the earlier one is handed on, and the latest
 * offer's refusals are the ones shown. Offers still waiting when the upload unmounts or becomes
 * disabled or read-only are abandoned: they call nothing and show nothing.
 */
export function useFileIntake(props: FileUploadProps, listed: readonly FileUploadItem[]) {
  const held = listed.length;
  const { allowsMultiple, acceptDirectory, isDisabled, isReadOnly } = props;
  const isLocked = Boolean(isDisabled || isReadOnly);
  const { acceptedFileTypes, maxSize, minSize, maxFiles, validate } = props;
  const rules: FileRules = { acceptedFileTypes, maxSize, minSize, maxFiles, validate };
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [readFailure, setReadFailure] = useState<{ error: unknown } | null>(null);
  const [isDragAcceptable, setDragAcceptable] = useState(true);
  const { countRef, queueRef, lifetimeRef } = useIntakeLifetime(listed, isLocked);
  const callbacks = useLatest(props);
  const isMultiple = Boolean(allowsMultiple || acceptDirectory);
  const rejectsMultiple = !isMultiple && props.multipleFileBehavior === 'reject';
  const report = (result: FilePartition) => {
    setReadFailure(null);
    countRef.current.accepted += result.accepted.length;
    setRejections(result.rejections);
    if (result.rejections.length > 0) callbacks.current.onReject?.(result.rejections);
    if (result.accepted.length > 0) callbacks.current.onSelect(result.accepted);
  };
  const judge = (offered: readonly File[], owner: object): Promise<void> | undefined => {
    if (owner !== lifetimeRef.current) return undefined;
    const files = isMultiple ? offered : offered.slice(0, 1);
    const outcome: FilePartition | Promise<FilePartition> =
      rejectsMultiple && offered.length > 1
        ? { accepted: [], rejections: offered.map((file) => ({ file, reason: 'count' })) }
        : partitionFiles(files, rules, countRef.current.held + countRef.current.accepted);
    if (!isThenable(outcome)) {
      report(outcome);
      return undefined;
    }
    return outcome.then((result) => {
      if (owner === lifetimeRef.current) report(result);
    });
  };
  const receive = (files: readonly File[] | Promise<File[]>) => {
    const offered = readOffer(files);
    if (isLocked) return;
    const owner = lifetimeRef.current;
    const settle = (offer: IntakeOffer) => {
      if (owner !== lifetimeRef.current) return undefined;
      if ('files' in offer) return judge(offer.files, owner);
      setRejections([]);
      setReadFailure({ error: offer.error });
      callbacks.current.onError?.(offer.error);
      return undefined;
    };
    const run = () => (isThenable(offered) ? offered.then(settle) : settle(offered));
    const outcome = queueRef.current ? queueRef.current.then(run, run) : run();
    if (!outcome) return;
    const settled: Promise<void> = outcome.finally(() => {
      if (queueRef.current === settled) queueRef.current = null;
    });
    queueRef.current = settled;
  };
  return {
    rejections,
    readFailure,
    isDragAcceptable,
    receive,
    readDrop: receive,
    onDragEnter(event: DragEvent) {
      const items = readDraggedItems(event);
      const tooMany = rejectsMultiple && items.filter(({ kind }) => kind === 'file').length > 1;
      setDragAcceptable(
        !tooMany && canAcceptDrag(isMultiple ? items : items.slice(0, 1), rules, held),
      );
    },
  };
}
