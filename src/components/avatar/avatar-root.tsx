'use client';

import type { ReactNode, Ref } from 'react';
import { Focusable } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { toImageProps } from '../icon/icon.js';
import { UserCardTrigger } from '../user-card-trigger/user-card-trigger.js';
import type { AvatarProps } from './avatar.js';

interface AvatarRootProps
  extends BaseProps, Pick<AvatarProps, 'ref' | 'onPress' | 'card' | 'cardTrigger'> {
  imageLabel: string | undefined;
  isFocusable: boolean;
  'aria-describedby'?: string | undefined;
  children: ReactNode;
}

/**
 * Interactive avatars use their root as the trigger, leaving the status dot outside the picture.
 * A pressable avatar is always a card trigger, with or without a card, so a card that arrives or
 * leaves keeps the same button and its focus.
 */
export function AvatarRoot({
  ref,
  onPress,
  card,
  cardTrigger,
  imageLabel,
  isFocusable,
  children,
  ...rest
}: AvatarRootProps) {
  if (card || onPress)
    return (
      <UserCardTrigger
        {...rest}
        // The root is this button or the span below, so each takes the ref as its own element's.
        ref={ref as Ref<HTMLButtonElement> | undefined}
        card={card}
        trigger={cardTrigger}
        onPress={onPress}
      >
        {children}
      </UserCardTrigger>
    );
  const image = (
    <span {...rest} ref={ref as Ref<HTMLSpanElement> | undefined} {...toImageProps(imageLabel)}>
      {children}
    </span>
  );
  return isFocusable ? <Focusable>{image}</Focusable> : image;
}
