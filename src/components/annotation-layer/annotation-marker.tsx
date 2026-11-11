'use client';

// The icons presentation of an annotation margin: a marker per annotation, which opens its card
// below it (specs/ANNOTATION-LAYER.md, UIC-ANNOTATION-LAYER-2.5).

import { type KeyboardEvent, type ReactNode, type Ref, useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { Annotation } from './anchor-geometry.js';
import { annotationLayerHooks as hooks } from './annotation-hooks.js';

/** What a marker shows about its annotation. */
export interface AnnotationMarkerState {
  /** The annotation is the active one. */
  isActive: boolean;
  /** Its anchor is gone (UIC-ANNOTATION-LAYER-1.5). */
  isOrphaned: boolean;
  /** Its card is open below the marker. */
  isOpen: boolean;
}

/** Where an entry goes in its margin: its top, and its inline-start edge when the caller sets one. */
export interface EntryPlace {
  position: 'absolute';
  top: number;
  insetInlineStart?: number;
}

/** One annotation in the icons presentation: where it goes, and what it shows. */
export interface AnnotationMarkerEntryProps {
  annotation: Annotation;
  state: AnnotationMarkerState;
  /** Its place among the margin's annotations, from 0, and their count. */
  index: number;
  total: number;
  style: EntryPlace;
  isTabStop: boolean;
  entryRef: Ref<HTMLDivElement>;
  markerRef: Ref<HTMLButtonElement>;
  renderMarker: ((annotation: Annotation, state: AnnotationMarkerState) => ReactNode) | undefined;
  renderCard: (annotation: Annotation, state: AnnotationMarkerState) => ReactNode;
  onToggle: () => void;
  onClose: () => void;
  onFocus: () => void;
  onMarkerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * A marker button that names its annotation and toggles its card, then the card while it is open.
 * Escape inside an open card, unless its content handled it, closes it.
 */
export function AnnotationMarkerEntry({
  annotation,
  state,
  index,
  total,
  style,
  isTabStop,
  entryRef,
  markerRef,
  renderMarker,
  renderCard,
  onToggle,
  onClose,
  onFocus,
  onMarkerKeyDown,
}: AnnotationMarkerEntryProps) {
  const strings = useUiStrings();
  const cardId = useId();
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented || !state.isOpen) return;
    event.preventDefault();
    onClose();
  };
  return (
    <div
      ref={entryRef}
      role="listitem"
      {...hooks.slot('entry', {
        active: state.isActive,
        orphaned: state.isOrphaned,
        open: state.isOpen,
      })}
      style={style}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <button
        ref={markerRef}
        type="button"
        aria-label={strings.annotationMarker(index + 1, total)}
        aria-expanded={state.isOpen}
        aria-controls={state.isOpen ? cardId : undefined}
        tabIndex={isTabStop ? 0 : -1}
        {...hooks.slot('marker', { active: state.isActive })}
        onClick={onToggle}
        onKeyDown={onMarkerKeyDown}
      >
        <span aria-hidden="true">{renderMarker?.(annotation, state) ?? index + 1}</span>
      </button>
      {state.isOpen ? (
        <div id={cardId} {...hooks.slot('card', { active: state.isActive })}>
          {renderCard(annotation, state)}
        </div>
      ) : null}
    </div>
  );
}
