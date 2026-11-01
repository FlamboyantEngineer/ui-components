'use client';

import { createContext, type KeyboardEvent } from 'react';

/** A dialog owns modified Enter; its buttons leave that key to its bubbling shortcut. */
export const PrimaryActionKeysContext = createContext(false);

const passedButtonKeys = new WeakSet<Event>();

/** Records a button's modified Enter without consuming it before content handlers can refuse it. */
export function passPrimaryActionKey(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return false;
  passedButtonKeys.add(event.nativeEvent);
  return true;
}

/** Stops native button activation after the dialog and its content have handled the passed key. */
export function preventPrimaryActionButtonDefault(event: KeyboardEvent<HTMLElement>): void {
  if (passedButtonKeys.has(event.nativeEvent)) event.preventDefault();
}
