// Shared identity options for the person labs: what the avatar of a User Identity or a User Card
// can be told beyond the name, and its corner badges.

import type { AvatarImageProps } from '../../src/components/avatar/avatar.js';
import { otherPicture, samplePicture } from './people-samples.js';

export const identityShapes = ['circle', 'rounded', 'square'] as const;
export const identityOptions = ['initials', 'color key', 'color slot', 'image props'] as const;
export const badgePlacements = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

/** A picture with a sharper candidate for dense screens, loaded only near the viewport. */
export const responsiveImage: AvatarImageProps = {
  srcSet: `${samplePicture} 1x, ${otherPicture} 2x`,
  sizes: '32px',
  loading: 'lazy',
};

/**
 * The props for one identity option: initials given by the caller, a stable colour key, an
 * explicit colour slot in a six-colour palette, or a picture with responsive candidates.
 */
export function identityOptionProps(option: (typeof identityOptions)[number]) {
  if (option === 'initials') return { initials: 'MF' };
  if (option === 'color key') return { colorKey: 'person-42' };
  if (option === 'color slot') return { colorIndex: 4, colorCount: 6 };
  return { src: samplePicture, imageProps: responsiveImage };
}
