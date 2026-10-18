// Interaction events and the handler props that carry them (specs/PRIMITIVES.md).

import type { FocusEvent, KeyboardEvent } from 'react';
import type { Key, Selection, SelectionMode } from './props.js';

/** How an interaction was performed. */
export type PointerType = 'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual';

/** A press made with a pointer, a touch, the keyboard or an assistive technology. */
export interface PressEvent {
  type: 'pressstart' | 'pressend' | 'pressup' | 'press';
  pointerType: PointerType;
  /** The element that was pressed. */
  target: Element;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  /** Position relative to the target, in pixels. */
  x: number;
  y: number;
}

/** The pointer entering or leaving an element. */
export interface HoverEvent {
  type: 'hoverstart' | 'hoverend';
  pointerType: 'mouse' | 'pen';
  target: HTMLElement;
}

export interface PressEventProps {
  /** Called when a press is released over the element. */
  onPress?: ((event: PressEvent) => void) | undefined;
  /** Called when a press starts. */
  onPressStart?: ((event: PressEvent) => void) | undefined;
  /** Called when a press ends, over the element or not. */
  onPressEnd?: ((event: PressEvent) => void) | undefined;
  /** Called when the pressed state changes. */
  onPressChange?: ((isPressed: boolean) => void) | undefined;
  /** Called when a press is released over the element, whether or not it started there. */
  onPressUp?: ((event: PressEvent) => void) | undefined;
}

export interface HoverEventProps {
  onHoverStart?: ((event: HoverEvent) => void) | undefined;
  onHoverEnd?: ((event: HoverEvent) => void) | undefined;
  onHoverChange?: ((isHovering: boolean) => void) | undefined;
}

export interface FocusEventProps<E extends Element = Element> {
  onFocus?: ((event: FocusEvent<E>) => void) | undefined;
  onBlur?: ((event: FocusEvent<E>) => void) | undefined;
  /** Called when the element gains or loses focus. */
  onFocusChange?: ((isFocused: boolean) => void) | undefined;
}

export interface KeyboardEventProps {
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  onKeyUp?: ((event: KeyboardEvent) => void) | undefined;
}

/** How assistive technology names and describes an element. */
export interface AriaLabellingProps {
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  'aria-describedby'?: string | undefined;
  'aria-details'?: string | undefined;
}

/** An overlay or disclosure whose open state the caller may control. */
export interface OpenStateProps {
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

/** A collection whose selection the caller may control. */
export interface SelectionProps {
  selectionMode?: SelectionMode | undefined;
  selectedKeys?: Iterable<Key> | 'all' | undefined;
  defaultSelectedKeys?: Iterable<Key> | 'all' | undefined;
  onSelectionChange?: ((keys: Selection) => void) | undefined;
  /** Keys that cannot be selected or focused. */
  disabledKeys?: Iterable<Key> | undefined;
  /** Keeps at least one item selected. */
  disallowEmptySelection?: boolean | undefined;
}

/** `toggle` selects items one at a time, as checkboxes do; `replace` makes a press replace the selection. */
export type SelectionBehavior = 'toggle' | 'replace';

/** A collection whose selection the caller may control, and whether a press toggles or replaces it. */
export interface CollectionSelectionProps extends SelectionProps {
  /** How a press selects. Defaults to `toggle`. */
  selectionBehavior?: SelectionBehavior | undefined;
}

/** A collection or group whose expanded items the caller may control. */
export interface ExpansionProps {
  /** The expanded items, controlled. */
  expandedKeys?: Iterable<Key> | undefined;
  /** The items expanded at first, uncontrolled. */
  defaultExpandedKeys?: Iterable<Key> | undefined;
  /** Called with the expanded items after each change. */
  onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
}
