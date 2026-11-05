import type { ReactNode } from 'react';
import type { FormLayoutNode, FormLayoutRule } from './form-layout-tree.js';

/** Where a node is drawn: in a form a reader fills in, or in the designer's canvas. */
export type FormLayoutMode = 'render' | 'design';

export interface FormLayoutRenderContext {
  mode: FormLayoutMode;
  /** A container's drawn children, already laid out; null for a leaf. */
  children: ReactNode;
}

/** One type of node: its name, its placement rules and how it draws. */
export interface FormLayoutType<D = unknown> extends FormLayoutRule {
  /** The type's name in the palette, the designer and announcements. */
  label: string;
  /**
   * Draws the node. A field draws the host's own field component, so the form around it registers
   * and validates it as usual; a container places `children` in its frame. Without it, a container
   * draws its label and children and a leaf its label.
   */
  render?: ((node: FormLayoutNode<D>, context: FormLayoutRenderContext) => ReactNode) | undefined;
}

/** The layout's types by key: every node's `type` names one. */
export type FormLayoutTypes<D = unknown> = Readonly<Record<string, FormLayoutType<D>>>;

/** The name a node goes by: its own label, else its type's, else its type key. */
export function formLayoutNodeLabel<D>(node: FormLayoutNode<D>, types: FormLayoutTypes<D>): string {
  return node.label ?? types[node.type]?.label ?? node.type;
}
