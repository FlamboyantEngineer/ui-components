'use client';

import { type ReactNode, useId } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { usePress } from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { FormLayoutChildren, FormLayoutDesignerContext } from './form-layout-designer-node.js';
import { formLayoutDesignerHooks as hooks } from './form-layout-hooks.js';
import { findFormLayoutNode, type FormLayoutNode } from './form-layout-tree.js';
import {
  type FormLayoutDesignerModel,
  type FormLayoutDesignerState,
  type FormLayoutPaletteEntry,
  useFormLayoutDesigner,
} from './use-form-layout-designer.js';
import { useFormLayoutEntryDrag } from './use-form-layout-drag.js';

export interface FormLayoutDesignerProps<D = unknown>
  extends FormLayoutDesignerState<D>, RefProps<HTMLDivElement>, BaseProps {
  /**
   * Draws the selected node's properties beside the canvas, such as a `PropertyPanel`; `update`
   * replaces the node, which keeps its id.
   */
  renderInspector?:
    ((node: FormLayoutNode<D>, update: (node: FormLayoutNode<D>) => void) => ReactNode) | undefined;
  /** Names the canvas. Defaults to the provider string `formLayoutCanvas`. */
  'aria-label'?: string | undefined;
}

/**
 * A palette entry: a button that adds its node on press and drags it into the canvas. The entry is
 * itself the draggable element, so its press handling leaves the browser's drag alone.
 */
function PaletteEntry({
  entry,
  model,
}: {
  entry: FormLayoutPaletteEntry;
  model: FormLayoutDesignerModel<unknown>;
}) {
  const { dragProps, isDragging } = useFormLayoutEntryDrag({
    entryKey: entry.key,
    label: entry.label,
    drag: model.drag,
  });
  const { pressProps } = usePress({ onPress: () => model.add(entry.key) });
  return (
    <button
      type="button"
      {...mergeProps(dragProps, pressProps)}
      {...hooks.slot('palette-item', { dragging: isDragging })}
      data-key={entry.key}
    >
      {entry.label}
    </button>
  );
}

/**
 * Designs a nested form layout: a palette of nodes to add, a canvas of sections, rows and grids
 * whose nodes are selected, moved by handle or Alt+Arrow keys and removed, and the host's inspector
 * for the selected node. The layout and selection may be controlled; every edit reaches
 * `onChange` with what it did, and persistence, ids and history stay with the host.
 */
export function FormLayoutDesigner<D = unknown>(props: FormLayoutDesignerProps<D>) {
  const { ref, className, id, renderInspector, palette = [], 'aria-label': ariaLabel } = props;
  const strings = useUiStrings();
  const hintId = useId();
  const { model, canvasRef } = useFormLayoutDesigner(props);
  const { layout, selectedId } = model;
  const selected = selectedId === null ? null : findFormLayoutNode(layout, selectedId)?.node;
  const tabStopId = selected?.id ?? layout[0]?.id ?? null;
  const context = {
    model: model as FormLayoutDesignerModel<unknown>,
    types: props.types,
    tabStopId,
    hintId,
  };
  return (
    <FormLayoutDesignerContext value={context as never}>
      <div
        ref={ref}
        id={id}
        {...hooks.root({
          className,
          props,
          data: { readOnly: props.isReadOnly, disabled: props.isDisabled },
        })}
      >
        {palette.length > 0 && model.isEditable ? (
          <div {...hooks.slot('palette')} role="group" aria-label={strings.formLayoutPalette}>
            {palette.map((entry) => (
              <PaletteEntry
                key={entry.key}
                entry={entry as FormLayoutPaletteEntry}
                model={context.model}
              />
            ))}
          </div>
        ) : null}
        <div
          ref={canvasRef}
          {...hooks.slot('canvas', { empty: layout.length === 0 })}
          role="group"
          aria-label={ariaLabel ?? strings.formLayoutCanvas}
          tabIndex={layout.length === 0 ? 0 : -1}
        >
          {layout.length === 0 ? (
            <div {...hooks.slot('empty')}>{strings.formLayoutEmpty}</div>
          ) : null}
          <FormLayoutChildren
            parentId={null}
            nodes={layout as never}
            arrangement="stack"
            name={strings.formLayoutTopLevel}
          />
        </div>
        {selected && renderInspector ? (
          <div {...hooks.slot('inspector')}>
            {renderInspector(selected, (node) => model.update(selected.id, node))}
          </div>
        ) : null}
        <VisuallyHidden id={hintId}>{strings.formLayoutKeys}</VisuallyHidden>
        <VisuallyHidden as="div" className={hooks.slotClass('status')} role="status">
          {model.announcement}
        </VisuallyHidden>
      </div>
    </FormLayoutDesignerContext>
  );
}
