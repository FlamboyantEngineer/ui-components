'use client';

import { createContext, type KeyboardEvent, type MouseEvent, use, useRef } from 'react';
import { CloseGlyph, DragHandleGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isMoveChord } from '../../utils/use-reorder-drag-and-drop.js';
import { Button, type ButtonProps } from '../button/button.js';
import { formLayoutColumnsStyle, renderFormLayoutBody } from './form-layout.js';
import { formLayoutDesignerHooks as hooks } from './form-layout-hooks.js';
import type { FormLayoutArrangement, FormLayoutNode, FormLayoutValue } from './form-layout-tree.js';
import { formLayoutNodeLabel, type FormLayoutTypes } from './form-layout-types.js';
import type { FormLayoutDesignerModel } from './use-form-layout-designer.js';
import { useFormLayoutNodeDrag, useFormLayoutSlotDrop } from './use-form-layout-drag.js';

interface DesignerContextValue {
  model: FormLayoutDesignerModel<unknown>;
  types: FormLayoutTypes<unknown>;
  /** The node that takes Tab: the selected one, else the first. */
  tabStopId: string | null;
  /** The id of the keyboard hint every node is described by. */
  hintId: string;
}

export const FormLayoutDesignerContext = createContext<DesignerContextValue | null>(null);

function useDesigner(): DesignerContextValue {
  const context = use(FormLayoutDesignerContext);
  if (!context) throw new Error('A form layout node renders inside FormLayoutDesigner.');
  return context;
}

/** The drop target at the end of a container, or of the top level when `parentId` is null. */
export function FormLayoutSlot({
  parentId,
  index,
  name,
}: {
  parentId: string | null;
  index: number;
  name: string;
}) {
  const { model } = useDesigner();
  const strings = useUiStrings();
  const ref = useRef<HTMLDivElement>(null);
  const { dropProps, isDropTarget } = useFormLayoutSlotDrop({
    ref,
    parentId,
    index,
    drag: model.drag,
  });
  return (
    <div
      ref={ref}
      {...dropProps}
      {...hooks.slot('slot', { dropTarget: isDropTarget })}
      role="group"
      aria-label={strings.formLayoutDropAtEnd(name)}
    />
  );
}

/** A container's children, laid out by its arrangement, with the drop target at their end. */
export function FormLayoutChildren({
  parentId,
  nodes,
  arrangement,
  columns,
  name,
}: {
  parentId: string | null;
  nodes: FormLayoutValue<unknown>;
  arrangement: FormLayoutArrangement;
  columns?: number | undefined;
  name: string;
}) {
  const { model } = useDesigner();
  return (
    <div
      {...hooks.slot('children', { arrangement })}
      style={formLayoutColumnsStyle({ id: '', type: '', columns })}
    >
      {nodes.map((child, index) => (
        <FormLayoutDesignerNode
          key={child.id}
          node={child}
          parentId={parentId}
          index={index}
          arrangement={arrangement}
        />
      ))}
      {model.drag ? <FormLayoutSlot parentId={parentId} index={nodes.length} name={name} /> : null}
    </div>
  );
}

const focusKeys: Readonly<Record<string, 'previous' | 'next' | 'first' | 'last'>> = {
  ArrowUp: 'previous',
  ArrowDown: 'next',
  Home: 'first',
  End: 'last',
};

/** The node's own keys, never those of a field in its preview or of an input method. */
function createNodeKeyHandler(
  model: FormLayoutDesignerModel<unknown>,
  node: FormLayoutNode<unknown>,
) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || isComposingKey(event.nativeEvent)) return;
    const along = focusKeys[event.key];
    if (along && isMoveChord(event) && (along === 'previous' || along === 'next')) {
      event.preventDefault();
      model.step(node.id, along);
    } else if (along && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      model.focusAlong(node.id, along);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      model.remove(node.id);
    }
  };
}

/** Selects the node a click lands in, not a container around it. */
function selectOwnClick(event: MouseEvent<HTMLDivElement>, select: () => void) {
  if ((event.target as Element).closest(`.${hooks.slotClass('node')}`) === event.currentTarget) {
    select();
  }
}

/** A node's header: its drag handle, its name and its Remove button, the buttons while editable. */
function NodeHeader({
  label,
  canEdit,
  handleProps,
  onRemove,
}: {
  label: string;
  canEdit: boolean;
  handleProps: Pick<ButtonProps, 'onPress' | 'onPressStart'>;
  onRemove: () => void;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      {canEdit ? (
        <Button
          icon={DragHandleGlyph}
          size="sm"
          label={strings.formLayoutMove(label)}
          className={hooks.slotClass('handle')}
          {...handleProps}
        />
      ) : null}
      <span {...hooks.slot('title')}>{label}</span>
      {canEdit ? (
        <Button
          icon={CloseGlyph}
          size="sm"
          label={strings.formLayoutRemove(label)}
          className={hooks.slotClass('remove')}
          onPress={onRemove}
        />
      ) : null}
    </div>
  );
}

/** One node in the canvas: its header with handle, name and Remove, then its preview. */
export function FormLayoutDesignerNode({
  node,
  parentId,
  index,
  arrangement,
}: {
  node: FormLayoutNode<unknown>;
  parentId: string | null;
  index: number;
  arrangement: FormLayoutArrangement;
}) {
  const { model, types, tabStopId, hintId } = useDesigner();
  const ref = useRef<HTMLDivElement>(null);
  const label = formLayoutNodeLabel(node, types);
  const isLocked = node.isLocked === true;
  const drag = useFormLayoutNodeDrag({
    ref,
    id: node.id,
    label,
    parentId,
    index,
    arrangement,
    drag: model.drag,
    isLocked,
  });
  const own = types[node.type]?.arrangement;
  const isSelected = model.selectedId === node.id;
  const canEdit = model.isEditable && !isLocked;
  return (
    <div
      ref={ref}
      {...drag.props}
      {...hooks.slot('node', {
        type: node.type,
        container: own !== undefined,
        selected: isSelected,
        locked: isLocked,
        dragging: drag.isDragging,
        position: drag.dropPosition,
      })}
      data-key={node.id}
      role="group"
      aria-label={label}
      aria-current={isSelected ? 'true' : undefined}
      aria-describedby={model.isEditable ? hintId : undefined}
      tabIndex={tabStopId === node.id ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) model.select(node.id);
      }}
      onClick={(event) => selectOwnClick(event, () => model.select(node.id))}
      onKeyDown={createNodeKeyHandler(model, node)}
    >
      <NodeHeader
        label={label}
        canEdit={canEdit}
        handleProps={drag.handleProps}
        onRemove={() => model.remove(node.id)}
      />
      <div {...hooks.slot('body')}>
        {renderFormLayoutBody(node, types, {
          mode: 'design',
          title: () => null,
          children: own ? (
            <FormLayoutChildren
              parentId={node.id}
              nodes={node.children ?? []}
              arrangement={own}
              columns={node.columns}
              name={label}
            />
          ) : null,
        })}
      </div>
    </div>
  );
}
