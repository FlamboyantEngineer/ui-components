'use client';

// The resizer of a static table's column: the table draws its columns as CSS grid tracks, so a
// resize sets the column's track in pixels, by pointer or by keyboard (specs/TABLE.md, UIC-TABLE-4.2).

import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { TableStateContext, useFocusRing, useHover, useLocale } from '../../primitives/index.js';
import { clamp } from '../../utils/clamp.js';
import { measureScale } from '../../utils/element-scale.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { tableHooks as hooks } from './table-hooks.js';

/** How far one arrow key resizes a column, in pixels, as React Aria's resizer did. */
const keyStep = 10;

/** React Aria's minimum of a column that declares none. */
const defaultMinWidth = 75;

interface DragState {
  x: number;
  /** The width the drag began at, kept when it is cancelled. */
  from: number;
  scale: number;
  last: number | null;
}

interface TableColumnResizerProps {
  /** The resizer's own label, which the column's label follows in its accessible name. */
  label: string;
  columnLabelId: string;
  /** The column's pixel width before a resize: its stored or declared pixels, else as drawn. */
  width: number | null;
  minWidth?: number | undefined;
  maxWidth?: number | undefined;
  /**
   * Who keeps the widths: when it changes, or the resizer goes, a resize under way is cancelled,
   * neither kept nor reported.
   */
  owner: object;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  /** Drops the preview of a cancelled resize. */
  onResizeCancel: () => void;
}

/** The column header the resizer sits in. */
function findHeader(element: Element | null): HTMLElement | null {
  return element?.closest<HTMLElement>('th, [role="columnheader"]') ?? null;
}

/** The resize session of one column: its live width, bounds, and how a resize goes and ends. */
function useResize(props: TableColumnResizerProps, ref: RefObject<HTMLDivElement | null>) {
  const { minWidth = defaultMinWidth, maxWidth = Number.MAX_SAFE_INTEGER } = props;
  const [resized, setResized] = useState<number | null>(null);
  return {
    resized,
    minWidth,
    maxWidth,
    fit: (width: number) => clamp(Math.round(width), minWidth, maxWidth),
    readWidth: () => resized ?? props.width ?? findHeader(ref.current)?.offsetWidth ?? minWidth,
    resize: (width: number) => {
      setResized(width);
      props.onResize(width);
    },
    finish: (width: number) => {
      setResized(null);
      props.onResizeEnd(width);
    },
    cancel: () => {
      setResized(null);
      props.onResizeCancel();
    },
  };
}

type Resize = ReturnType<typeof useResize>;

/**
 * The resizer's keys: Enter starts a keyboard resize, the arrows step the width while it lasts, and
 * Enter, Escape, Space, Tab or leaving the resizer end it. While it lasts, the grid's arrow keys
 * resize instead of moving focus.
 */
function useResizeKeys(resize: Resize, owner: object) {
  const table = useContext(TableStateContext);
  const isRtl = useLocale().direction === 'rtl';
  // The owner a keyboard resize began for, while one lasts.
  const [session, setSession] = useState<object | null>(null);
  // A keyboard resize begun for another owner is over.
  const isResizing = session === owner;
  const setMode = (next: boolean) => {
    setSession(next ? owner : null);
    table?.setKeyboardNavigationDisabled(next);
  };
  const latest = useLatest({
    session,
    table,
    cancel: () => {
      setSession(null);
      resize.cancel();
    },
  });
  // A new owner cancels the resize, and so does the resizer going: removing a focused element
  // need not blur it, so navigation is given back here.
  useLayoutEffect(() => {
    const { session: begun, table: grid, cancel } = latest.current;
    if (begun === null || begun === owner) return;
    grid?.setKeyboardNavigationDisabled(false);
    cancel();
  }, [latest, owner]);
  useEffect(
    () => () => {
      const { session: begun, table: grid, cancel } = latest.current;
      if (begun === null) return;
      grid?.setKeyboardNavigationDisabled(false);
      cancel();
    },
    [latest],
  );
  const end = () => {
    setMode(false);
    resize.finish(resize.readWidth());
  };
  // A key held on the slider changes its value natively; only the key handling below resizes then.
  const isKeyHeld = useRef(false);
  /** Resizes to a value set without keys, as assistive technology does, and ends the resize. */
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isKeyHeld.current) return;
    const width = resize.fit(Number(event.target.value));
    if (isResizing) setMode(false);
    resize.resize(width);
    resize.finish(width);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    isKeyHeld.current = true;
    if (!isResizing) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      resize.resize(resize.readWidth());
      setMode(true);
      return;
    }
    const grow = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const shrink = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const step = { [grow]: 1, ArrowUp: 1, [shrink]: -1, ArrowDown: -1 }[event.key];
    if (step === undefined && !['Enter', 'Escape', ' ', 'Tab'].includes(event.key)) return;
    if (event.key !== 'Tab') event.preventDefault();
    event.stopPropagation();
    if (step === undefined) end();
    else resize.resize(resize.fit(resize.readWidth() + step * keyStep));
  };
  const release = () => {
    isKeyHeld.current = false;
  };
  return {
    isRtl,
    onChange,
    onKeyDown,
    onKeyUp: release,
    onBlur: () => {
      release();
      if (isResizing) end();
    },
  };
}

/**
 * A column resizer: dragging it, or pressing Enter on its slider and then the arrow keys, sets the
 * column's width in pixels within its bounds, live; releasing, Enter, Escape, Space or Tab keeps
 * it and reports it once.
 */
export function TableColumnResizer(props: TableColumnResizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const resize = useResize(props, ref);
  const keys = useResizeKeys(resize, props.owner);
  const { hoverProps, isHovered } = useHover({});
  const { focusProps, isFocusVisible } = useFocusRing();
  const pointer = usePointerDrag<HTMLDivElement, DragState>({
    // A new owner, or the resizer going, cancels a drag: its preview is dropped, nothing kept.
    resetKey: props.owner,
    onCancel: () => resize.cancel(),
    cancelsOnUnmount: true,
    onStart: (press) => ({
      x: press.clientX,
      from: resize.readWidth(),
      scale: measureScale(findHeader(press.currentTarget)).x,
      last: null,
    }),
    onMove: (move, state) => {
      const delta = ((move.clientX - state.x) / state.scale) * (keys.isRtl ? -1 : 1);
      state.last = resize.fit(state.from + delta);
      resize.resize(state.last);
    },
    onEnd: (_release, state, isCancelled) => {
      if (state.last !== null) resize.finish(isCancelled ? state.from : state.last);
    },
  });
  return (
    <div
      ref={ref}
      {...hoverProps}
      {...pointer}
      onPointerDown={(event) => {
        // A press on the resizer neither sorts nor selects the column.
        event.stopPropagation();
        pointer.onPointerDown(event);
      }}
      onClick={(event) => event.stopPropagation()}
      {...hooks.slot('resizer', {
        hovered: isHovered,
        resizing: resize.resized !== null,
        focusVisible: isFocusVisible,
      })}
    >
      <VisuallyHidden>
        <input
          {...focusProps}
          type="range"
          id={id}
          aria-label={props.label}
          aria-labelledby={`${id} ${props.columnLabelId}`}
          aria-orientation="horizontal"
          min={resize.minWidth}
          max={resize.maxWidth}
          value={resize.resized ?? props.width ?? resize.minWidth}
          onChange={keys.onChange}
          onKeyDown={keys.onKeyDown}
          onKeyUp={keys.onKeyUp}
          onBlur={(event) => {
            focusProps.onBlur?.(event);
            keys.onBlur();
          }}
        />
      </VisuallyHidden>
    </div>
  );
}
