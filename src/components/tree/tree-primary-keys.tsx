'use client';

import {
  type ComponentProps,
  type KeyboardEvent,
  type KeyboardEventHandler,
  useContext,
} from 'react';
import type { BaseProps } from '../../core/props.js';
import { passPrimaryActionKey, PrimaryActionKeysContext } from '../../utils/primary-action-keys.js';

interface KeyHandlers {
  onKeyDownCapture?: KeyboardEventHandler<HTMLDivElement> | undefined;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined;
}

/** A modal keeps modified Enter; owner handlers still get their turn before its shortcut. */
export function keepTreePrimaryKeys<P extends KeyHandlers>(props: P, isBoundary: boolean): P {
  if (!isBoundary) return props;
  return {
    ...props,
    onKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
      if (!passPrimaryActionKey(event)) props.onKeyDownCapture?.(event);
    },
    onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (!passPrimaryActionKey(event)) props.onKeyDown?.(event);
    },
  };
}

function TreePrimaryKeyRow(props: ComponentProps<'div'>) {
  const isBoundary = useContext(PrimaryActionKeysContext);
  return <div {...keepTreePrimaryKeys(props, isBoundary)} />;
}

/** Keeps a row's element stable while the modal context controls its collection keys. */
export function renderTreePrimaryKeyRow(props: ComponentProps<'div'> & BaseProps) {
  return <TreePrimaryKeyRow {...props} />;
}
