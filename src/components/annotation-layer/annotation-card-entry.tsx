'use client';

// The cards presentation of an annotation margin: one card per annotation, which takes focus
// (specs/ANNOTATION-LAYER.md, UIC-ANNOTATION-LAYER-2.1).

import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode, Ref } from 'react';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';
import type { AnnotationCardState } from './annotation-margin.js';
import { isActivatingFocus } from './margin-focus.js';

/** One annotation's card in the cards presentation, itself the list item that takes focus. */
export function AnnotationCardEntry({
  cardRef,
  isTabStop,
  state,
  style,
  onFocus,
  onKeyDown,
  children,
}: {
  cardRef: Ref<HTMLDivElement>;
  isTabStop: boolean;
  state: AnnotationCardState;
  style: CSSProperties;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={cardRef}
      role="listitem"
      tabIndex={isTabStop ? 0 : -1}
      {...hooks.slot('card', { active: state.isActive, orphaned: state.isOrphaned })}
      style={style}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        if (isActivatingFocus(event)) onFocus();
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
