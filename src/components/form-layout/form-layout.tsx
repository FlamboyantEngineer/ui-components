import { type CSSProperties, type ReactNode, useId } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { formLayoutHooks as hooks } from './form-layout-hooks.js';
import type { FormLayoutNode, FormLayoutValue } from './form-layout-tree.js';
import {
  type FormLayoutMode,
  formLayoutNodeLabel,
  type FormLayoutTypes,
} from './form-layout-types.js';

export interface FormLayoutProps<D = unknown> extends RefProps<HTMLDivElement>, BaseProps {
  /** The layout to draw. */
  layout: FormLayoutValue<D>;
  /** The types every node names, with how each draws. */
  types: FormLayoutTypes<D>;
}

/** A grid container's column count as the measured property the host's grid reads. */
export function formLayoutColumnsStyle<D>(node: FormLayoutNode<D>): CSSProperties | undefined {
  return node.columns === undefined
    ? undefined
    : ({ '--ui-form-layout-columns': String(node.columns) } as CSSProperties);
}

/** A node's own drawing: the type's `render`, or its label (and a container's children). */
export function renderFormLayoutBody<D>(
  node: FormLayoutNode<D>,
  types: FormLayoutTypes<D>,
  context: { mode: FormLayoutMode; children: ReactNode; title: (label: string) => ReactNode },
): ReactNode {
  const render = types[node.type]?.render;
  if (render) return render(node, { mode: context.mode, children: context.children });
  return (
    <>
      {context.title(formLayoutNodeLabel(node, types))}
      {context.children}
    </>
  );
}

function FormLayoutNodeView<D>({
  node,
  types,
}: {
  node: FormLayoutNode<D>;
  types: FormLayoutTypes<D>;
}) {
  const titleId = useId();
  const arrangement = types[node.type]?.arrangement;
  const children = arrangement ? (
    <div {...hooks.slot('children', { arrangement })} style={formLayoutColumnsStyle(node)}>
      {(node.children ?? []).map((child) => (
        <FormLayoutNodeView key={child.id} node={child} types={types} />
      ))}
    </div>
  ) : null;
  const hasTitle = arrangement !== undefined && !types[node.type]?.render;
  return (
    <div
      {...hooks.slot('node', { type: node.type, container: arrangement !== undefined })}
      data-key={node.id}
      role={hasTitle ? 'group' : undefined}
      aria-labelledby={hasTitle ? titleId : undefined}
    >
      {renderFormLayoutBody(node, types, {
        mode: 'render',
        children,
        title: (label) => (
          <div {...hooks.slot('title')} id={titleId}>
            {label}
          </div>
        ),
      })}
    </div>
  );
}

/**
 * Draws a form layout for a reader to fill in: containers lay out their children, and each field
 * draws through its type's `render`, the host's own field component. It adds no field system of its
 * own, so inside a `Form` every field registers, validates and submits as it always does.
 */
export function FormLayout<D = unknown>({
  ref,
  layout,
  types,
  className,
  ...rest
}: FormLayoutProps<D>) {
  return (
    <div ref={ref} {...rest} {...hooks.root({ className, props: rest })}>
      {layout.map((node) => (
        <FormLayoutNodeView key={node.id} node={node} types={types} />
      ))}
    </div>
  );
}
