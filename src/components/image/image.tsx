'use client';

import { type CSSProperties, type ReactNode, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useImageLoading } from '../../utils/use-image-loading.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { Button } from '../button/button.js';

/** The image is loading, has loaded, or failed with every source it was given. */
export type ImageLoadingStatus = 'loading' | 'loaded' | 'error';

/** The native attributes that choose a candidate, fetch it and decode it, passed to the `<img>`. */
export type ImageSourceProps = Pick<
  NativeProps<'img'>,
  'srcSet' | 'sizes' | 'loading' | 'decoding' | 'crossOrigin' | 'referrerPolicy'
>;

export interface ImageProps extends BaseProps, RefProps<HTMLSpanElement>, ImageSourceProps {
  /** The image's address. A blank one fails at once. */
  src: string;
  /**
   * What the image shows, in words. An empty string marks it decorative: hidden from assistive
   * technology, its fallback included.
   */
  alt: string;
  /** Intrinsic width in pixels, so the page reserves the image's box before it loads. */
  width?: number | undefined;
  /** Intrinsic height in pixels, so the page reserves the image's box before it loads. */
  height?: number | undefined;
  /** A second address tried once when `src` fails, without `srcSet` or `sizes`. */
  fallbackSrc?: string | undefined;
  /** Decorative content drawn over the image while it loads, such as a skeleton. */
  placeholder?: ReactNode;
  /** Decorative content drawn in place of the image once every source failed. */
  fallback?: ReactNode;
  /** Offers a button that requests the image again once it failed. */
  showRetry?: boolean | undefined;
  /** Called with the loading status, first on mount and then whenever it changes. */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

const hooks = createHooks('image', ['img', 'placeholder', 'fallback', 'retry']);

/** The reserved box as measured properties the stylesheet can size a placeholder or fallback by. */
function toDimensions(width: number | undefined, height: number | undefined) {
  const box: Record<string, string> = {};
  if (width !== undefined && Number.isFinite(width)) box['--ui-image-width'] = `${width}px`;
  if (height !== undefined && Number.isFinite(height)) box['--ui-image-height'] = `${height}px`;
  return Object.keys(box).length > 0 ? (box as CSSProperties) : undefined;
}

/**
 * Which address to request: `src` until it fails, then `fallbackSrc` once. A new `src` or a new
 * candidate set starts at `src` again, so an old failure never carries over to it.
 */
function useImageSource(props: Pick<ImageProps, 'src' | 'fallbackSrc' | keyof ImageSourceProps>) {
  const { srcSet, sizes, crossOrigin, referrerPolicy } = props;
  const src = props.src.trim();
  const backup = props.fallbackSrc?.trim() ?? '';
  const primary = useStableArray([src, srcSet, sizes, crossOrigin, referrerPolicy]);
  const [failed, setFailed] = useState<readonly unknown[] | null>(null);
  const isBackup = backup !== '' && (src === '' || failed === primary);
  return {
    isBackup,
    address: isBackup ? backup : src,
    request: isBackup ? [backup, crossOrigin, referrerPolicy] : src === '' ? [] : primary,
    /** Moves to the backup address after `src` failed; `undefined` once there is none left to try. */
    fail: isBackup || backup === '' ? undefined : () => setFailed(primary),
    /** Starts again at `src`. */
    reset: () => setFailed(null),
  };
}

/**
 * An image that owns its request: it shows a placeholder while it loads, tries `fallbackSrc` once
 * when `src` fails, and then draws `fallback` in its place, named by `alt`, with an optional retry.
 * The native responsive, lazy-loading and decoding attributes go to the `<img>` unchanged.
 */
export function Image({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  placeholder,
  fallback,
  showRetry = false,
  onLoadingStatusChange,
  srcSet,
  sizes,
  loading,
  decoding,
  crossOrigin,
  referrerPolicy,
  className,
  ...rest
}: ImageProps) {
  const strings = useUiStrings();
  const source = useImageSource({ src, fallbackSrc, srcSet, sizes, crossOrigin, referrerPolicy });
  const { imageRef, generation, settle, ...picture } = useImageLoading(source.request, (next) =>
    onLoadingStatusChange?.(next === 'idle' ? 'error' : next),
  );
  const status: ImageLoadingStatus = picture.status === 'idle' ? 'error' : picture.status;
  // The first source failed: request the backup in this same render, so `error` never shows.
  if (status === 'error' && source.fail) source.fail();
  const retry = () => {
    source.reset();
    picture.retry();
  };
  const named = alt.trim() !== '';
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { status } })}
      style={toDimensions(width, height)}
    >
      {status === 'error' ? null : (
        <img
          // A new element per request, so events of a departed request never reach the handlers.
          key={generation}
          {...hooks.slot('img')}
          ref={imageRef}
          src={source.address}
          srcSet={source.isBackup ? undefined : srcSet}
          sizes={source.isBackup ? undefined : sizes}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          onLoad={() => settle('loaded')}
          onError={() => settle('error')}
        />
      )}
      {status === 'loading' && !isEmptyNode(placeholder) ? (
        <span {...hooks.slot('placeholder')} aria-hidden="true">
          {placeholder}
        </span>
      ) : null}
      {status === 'error' ? (
        <span
          {...hooks.slot('fallback')}
          {...(named ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
        >
          {fallback}
        </span>
      ) : null}
      {status === 'error' && showRetry ? (
        <Button {...hooks.slot('retry')} size="sm" onPress={retry}>
          {strings.imageRetry}
        </Button>
      ) : null}
    </span>
  );
}
