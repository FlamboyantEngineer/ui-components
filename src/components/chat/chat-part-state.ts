'use client';

import { createContext, useContext } from 'react';

interface PartStateIdentity {
  domId: string;
  stateKey: string;
}

/** Keeps retained state logical without taking ownership of a custom renderer's nested controls. */
export const PartStateKeyContext = createContext<PartStateIdentity | null>(null);

export function usePartStateKey(domId: string): string {
  const identity = useContext(PartStateKeyContext);
  return identity?.domId === domId ? identity.stateKey : domId;
}
