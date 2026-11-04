'use client';

import {
  useEditorEffect,
  useEditorEventCallback,
  useEditorEventListener,
  useEditorState,
} from '@handlewithcare/react-prosemirror';
import type { Node as DocNode } from 'prosemirror-model';
import { type FocusEvent, useEffect, useState } from 'react';
import { isElement, isHTMLElement, isNode } from '../../utils/is-element.js';
import { findBlockAtY } from './block-at-pointer.js';
import { findTopBlocks } from './block-commands.js';
import { useRichTextEditorContext } from './rich-text-context.js';

/** The block a handle serves and where it sits, with the handle's own focus state. */
interface BlockTarget {
  /** The block's position in the document. */
  pos: number;
  /** The block's top edge in the surface, in pixels. */
  top: number;
  onFocus: () => void;
  onBlur: (event: FocusEvent) => void;
}

interface Hovered {
  pos: number;
  doc: DocNode;
}

/**
 * The block level with the pointer, over its text or in the surface's gutter beside it, or else the block holding the selection while the document or the
 * handle has focus (or `isHeld`, as while the handle's menu is open or its block is dragged),
 * placed against the surface.
 */
export function useBlockTarget(isHeld: boolean): BlockTarget | null {
  const { surfaceRef } = useRichTextEditorContext('BlockHandle');
  const state = useEditorState();
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [hasEditorFocus, setEditorFocus] = useState(false);
  const [hasOwnFocus, setOwnFocus] = useState(false);
  const [top, setTop] = useState<number | null>(null);
  const isFocused = hasEditorFocus || hasOwnFocus || isHeld;
  const hoveredPos = hovered?.doc === state.doc && !isHeld ? hovered.pos : null;
  const pos = hoveredPos ?? (isFocused ? (findTopBlocks(state)?.from ?? null) : null);

  // Over the document or the surface's own gutter the pointer picks a block; over the handle
  // itself, or other chrome, the target stays.
  const hoverAt = useEditorEventCallback((view, y: number, over: EventTarget | null) => {
    const surface = surfaceRef.current;
    if (over !== surface && !(isNode(over) && view.dom.contains(over))) return;
    const block = findBlockAtY(view, y);
    const { doc } = view.state;
    setHovered((current) => {
      if (block === null) return null;
      return current?.pos === block && current.doc === doc ? current : { pos: block, doc };
    });
  });
  useEditorEventListener('focus', () => (setEditorFocus(true), false));
  useEditorEventListener('blur', (_view, event) => {
    const related = event.relatedTarget;
    if (!(isElement(related) && surfaceRef.current?.contains(related))) setEditorFocus(false);
    return false;
  });
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    // The pointer's last place over the surface, to retarget as the surface scrolls under it.
    let last: { y: number; over: EventTarget | null } | null = null;
    const move = (event: PointerEvent) => {
      last = { y: event.clientY, over: event.target };
      if (!isHeld) hoverAt(last.y, last.over);
    };
    const scroll = () => {
      if (last && !isHeld) hoverAt(last.y, last.over);
    };
    const leave = () => ((last = null), setHovered(null));
    surface.addEventListener('pointermove', move);
    surface.addEventListener('scroll', scroll);
    surface.addEventListener('pointerleave', leave);
    return () => {
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('scroll', scroll);
      surface.removeEventListener('pointerleave', leave);
    };
  }, [surfaceRef, isHeld, hoverAt]);
  useEditorEffect(
    (view) => {
      const dom = pos === null ? null : view.nodeDOM(pos);
      const surface = surfaceRef.current;
      if (!isHTMLElement(dom) || !surface) return setTop(null);
      const offset = dom.getBoundingClientRect().top - surface.getBoundingClientRect().top;
      setTop(offset + surface.scrollTop);
    },
    [pos, state],
  );

  if (pos === null || top === null) return null;
  return {
    pos,
    top,
    onFocus: () => setOwnFocus(true),
    onBlur: (event) => {
      const related = event.relatedTarget;
      if (!(isNode(related) && event.currentTarget.contains(related))) setOwnFocus(false);
    },
  };
}
