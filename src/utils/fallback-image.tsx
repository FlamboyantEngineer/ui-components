'use client';

// A decorative image that gives way to a fallback once it fails to load.

import { type ImgHTMLAttributes, type ReactNode, useCallback, useState } from 'react';

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'children'>;

interface FallbackImageProps extends ImageProps {
  src: string;
  /** Drawn instead of the image once `src` has failed. */
  fallback: ReactNode;
}

/**
 * The image element for one src: a new element per src, so a departed request's events never reach
 * it, and an image that failed before its handler was attached (before hydration) is settled as
 * broken.
 */
function SettledImage({
  src,
  onFail,
  ...props
}: ImageProps & { src: string; onFail: (src: string) => void }) {
  const fail = useCallback(() => onFail(src), [onFail, src]);
  const settleEarly = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete || image.naturalWidth > 0) return;
      // An image without intrinsic size, such as some SVG, has no width once loaded either.
      if (typeof image.decode !== 'function') return fail();
      image.decode().catch(() => {
        if (image.isConnected) fail();
      });
    },
    [fail],
  );
  return <img ref={settleEarly} {...props} src={src} onError={fail} />;
}

/**
 * An image that draws `fallback` once its `src` fails to load. Only the src that failed counts as
 * broken: a new src loads again, and a failure reported for a departed src changes nothing.
 */
export function FallbackImage({ src, fallback, ...props }: FallbackImageProps) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  if (src === brokenSrc) return fallback;
  return <SettledImage key={src} {...props} src={src} onFail={setBrokenSrc} />;
}
