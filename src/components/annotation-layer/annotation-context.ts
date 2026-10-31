'use client';

import { createContext, useContext } from 'react';
import type { Key } from '../../core/props.js';
import type { AnchoredAnnotation } from './anchor-geometry.js';

/** What a margin inside a layer reads: the anchors, the active annotation and the layer element. */
interface AnnotationContextValue {
  anchors: readonly AnchoredAnnotation[];
  currentKey: Key | null;
  setCurrentKey: (id: Key | null) => void;
  layer: HTMLElement | null;
}

export const AnnotationContext = createContext<AnnotationContextValue | null>(null);

/** The layer around a margin; a margin outside a layer is a mistake. */
export function useAnnotationContext(): AnnotationContextValue {
  const context = useContext(AnnotationContext);
  if (!context) throw new Error('AnnotationMargin must be inside an AnnotationLayer.');
  return context;
}
