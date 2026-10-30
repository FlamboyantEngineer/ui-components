'use client';

import type { ReactNode } from 'react';
import { Button as AriaButton, Focusable } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { toImageProps } from '../icon/icon.js';
import { UserCardTrigger } from '../user-card/user-card.js';
import type { AvatarProps } from './avatar.js';

interface AvatarRootProps extends BaseProps, Pick<AvatarProps, 'onPress' | 'card' | 'cardTrigger'> {
  imageLabel: string | undefined;
  isFocusable: boolean;
  'aria-describedby'?: string | undefined;
  children: ReactNode;
}

/** Interactive avatars use their root as the trigger, leaving the status dot outside the picture. */
export function AvatarRoot({
  onPress,
  card,
  cardTrigger,
  imageLabel,
  isFocusable,
  children,
  ...rest
}: AvatarRootProps) {
  if (card)
    return (
      <UserCardTrigger {...rest} card={card} trigger={cardTrigger} onPress={onPress}>
        {children}
      </UserCardTrigger>
    );
  if (onPress)
    return (
      <AriaButton {...rest} onPress={onPress}>
        {children}
      </AriaButton>
    );
  const image = (
    <span {...rest} {...toImageProps(imageLabel)}>
      {children}
    </span>
  );
  return isFocusable ? <Focusable>{image}</Focusable> : image;
}
