// Element swapping for library-owned elements, with React Aria's `render` contract
// (specs/COMPOSITION.md).

import { createElement, type JSX, type ReactElement } from 'react';
import type { DOMRenderFunction } from '../primitives/index.js';

/**
 * Replaces the element a component renders. It receives the element's props (hook classes, data
 * attributes, ARIA attributes, handlers and `ref`) and the component's state, and returns one
 * element of the same type with those props spread on it. Identical to React Aria's `render`.
 */
export type ElementRender<E extends keyof JSX.IntrinsicElements, State> = DOMRenderFunction<
  E,
  State
>;

export interface RenderElementOptions<E extends keyof JSX.IntrinsicElements, State> {
  /** The caller's replacement, if any. */
  render?: ElementRender<E, State> | undefined;
  /** The state passed to `render`. */
  state: State;
}

/** Renders `type` with `props`, or the caller's element from `render` with the same props. */
export function renderElement<E extends keyof JSX.IntrinsicElements, State>(
  type: E,
  props: JSX.IntrinsicElements[E],
  { render, state }: RenderElementOptions<E, State>,
): ReactElement {
  return render ? render(props, state) : createElement(type, props);
}
