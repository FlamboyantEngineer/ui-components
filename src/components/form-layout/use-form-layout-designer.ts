'use client';

import { type RefObject, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import {
  canPlaceFormLayoutNode,
  findFormLayoutNode,
  flattenFormLayout,
  type FormLayoutNode,
  type FormLayoutPlace,
  type FormLayoutRules,
  type FormLayoutValue,
  insertFormLayoutNode,
  moveFormLayoutNode,
  nextFormLayoutPlace,
  removeFormLayoutNode,
  updateFormLayoutNode,
} from './form-layout-tree.js';
import { formLayoutNodeLabel, type FormLayoutTypes } from './form-layout-types.js';
import { useFormLayoutDrag } from './use-form-layout-drag.js';

/** A palette entry: a kind of node the reader can add, made fresh by the host on each add. */
export interface FormLayoutPaletteEntry<D = unknown> {
  key: string;
  label: string;
  /** The type of the nodes it adds, which decides where they may go. */
  type: string;
  /** Makes the node to add, with an id the host chose and no other node holds. */
  create: () => FormLayoutNode<D>;
}

/** What an edit did, passed with the new layout. */
export type FormLayoutChange =
  | { kind: 'move' | 'insert'; id: string; place: FormLayoutPlace }
  | { kind: 'remove' | 'update'; id: string };

export interface FormLayoutDesignerState<D> {
  value?: FormLayoutValue<D> | undefined;
  defaultValue?: FormLayoutValue<D> | undefined;
  onChange?: ((layout: FormLayoutValue<D>, change: FormLayoutChange) => void) | undefined;
  selectedId?: string | null | undefined;
  defaultSelectedId?: string | null | undefined;
  onSelectionChange?: ((id: string | null) => void) | undefined;
  types: FormLayoutTypes<D>;
  rootAccepts?: ((type: string) => boolean) | undefined;
  palette?: readonly FormLayoutPaletteEntry<D>[] | undefined;
  isReadOnly?: boolean | undefined;
  isDisabled?: boolean | undefined;
}

const noNodes: FormLayoutValue<never> = [];
const nodeSelector = '.ui-form-layout-designer__node';

/** Where a removed node's focus goes: its next sibling, else the one before, else its container. */
function neighbourOf<D>(layout: FormLayoutValue<D>, id: string): string | null {
  const found = findFormLayoutNode(layout, id);
  if (!found) return null;
  const siblings =
    found.parentId === null
      ? layout
      : (findFormLayoutNode(layout, found.parentId)?.node.children ?? []);
  return siblings[found.index + 1]?.id ?? siblings[found.index - 1]?.id ?? found.parentId ?? null;
}

/** Moves focus to the node `id` names, or the canvas for null, once the edit has rendered. */
function useNodeFocus(canvasRef: RefObject<HTMLDivElement | null>) {
  const requestFocus = useFocusRequest();
  return (id: string | null) =>
    requestFocus(() =>
      id === null
        ? canvasRef.current
        : [...(canvasRef.current?.querySelectorAll<HTMLElement>(nodeSelector) ?? [])].find(
            (element) => element.dataset.key === id,
          ),
    );
}

interface EditContext<D> {
  props: FormLayoutDesignerState<D>;
  layout: FormLayoutValue<D>;
  setLayout: (layout: FormLayoutValue<D>) => void;
  rules: FormLayoutRules;
  select: (id: string | null) => void;
  focusNode: (id: string | null) => void;
}

/** The edits: each checks the rules, reports the change, announces it and moves focus after it. */
function useFormLayoutEdits<D>({
  props,
  layout,
  setLayout,
  rules,
  select,
  focusNode,
}: EditContext<D>) {
  const { types, palette = [], onChange } = props;
  const strings = useUiStrings();
  const [announcement, setAnnouncement] = useState('');
  const isEditable = !props.isReadOnly && !props.isDisabled;
  const labelOf = (node: FormLayoutNode<D>) => formLayoutNodeLabel(node, types);
  const containerName = (next: FormLayoutValue<D>, parentId: string | null) => {
    const parent = parentId === null ? null : findFormLayoutNode(next, parentId)?.node;
    return parent ? labelOf(parent) : strings.formLayoutTopLevel;
  };
  const commit = (next: FormLayoutValue<D>, change: FormLayoutChange) => {
    setLayout(next);
    onChange?.(next, change);
  };
  const place = (
    node: FormLayoutNode<D>,
    next: FormLayoutValue<D>,
    { to, kind }: { to: FormLayoutPlace; kind: 'move' | 'insert' },
  ) => {
    commit(next, { kind, id: node.id, place: to });
    const announce = kind === 'move' ? strings.formLayoutMoved : strings.formLayoutAdded;
    setAnnouncement(announce(labelOf(node), containerName(next, to.parentId), to.index + 1));
    select(node.id);
    focusNode(node.id);
  };
  const move = (id: string, to: FormLayoutPlace) => {
    const found = findFormLayoutNode(layout, id);
    if (!isEditable || !found) return;
    if (!canPlaceFormLayoutNode(layout, rules, { type: found.node.type, id, place: to })) return;
    place(found.node, moveFormLayoutNode(layout, id, to), { to, kind: 'move' });
  };
  const insert = (key: string, to: FormLayoutPlace) => {
    const entry = palette.find((candidate) => candidate.key === key);
    if (
      !isEditable ||
      !entry ||
      !canPlaceFormLayoutNode(layout, rules, { type: entry.type, place: to })
    )
      return;
    const node = entry.create();
    if (findFormLayoutNode(layout, node.id)) return;
    place(node, insertFormLayoutNode(layout, node, to), { to, kind: 'insert' });
  };
  const remove = (id: string) => {
    const found = findFormLayoutNode(layout, id);
    if (!isEditable || !found || found.node.isLocked) return;
    const neighbour = neighbourOf(layout, id);
    commit(removeFormLayoutNode(layout, id), { kind: 'remove', id });
    setAnnouncement(strings.formLayoutRemoved(labelOf(found.node)));
    select(neighbour);
    focusNode(neighbour);
  };
  const update = (id: string, node: FormLayoutNode<D>) => {
    if (!isEditable || !findFormLayoutNode(layout, id)) return;
    commit(
      updateFormLayoutNode(layout, id, () => node),
      { kind: 'update', id },
    );
  };
  return { announcement, isEditable, move, insert, remove, update };
}

/** The places a palette entry's node may go, best first: into the selection, after it, at the end. */
function addPlaces<D>(
  layout: FormLayoutValue<D>,
  types: FormLayoutTypes<D>,
  selectedId: string | null,
) {
  const found = selectedId === null ? null : findFormLayoutNode(layout, selectedId);
  const places: FormLayoutPlace[] = [];
  if (found && types[found.node.type]?.arrangement) {
    places.push({ parentId: found.node.id, index: found.node.children?.length ?? 0 });
  }
  if (found) places.push({ parentId: found.parentId, index: found.index + 1 });
  places.push({ parentId: null, index: layout.length });
  return places;
}

/** The designer's layout, selection, edits, announcements and focus, and its canvas's ref. */
export function useFormLayoutDesigner<D>(props: FormLayoutDesignerState<D>) {
  const { types, palette = [] } = props;
  const rules: FormLayoutRules = { types, rootAccepts: props.rootAccepts };
  const [layout, setLayout] = useControllableState(props.value, props.defaultValue ?? noNodes);
  const [selectedId, select] = useControllableState(
    props.selectedId,
    props.defaultSelectedId ?? null,
    props.onSelectionChange,
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const focusNode = useNodeFocus(canvasRef);
  const edits = useFormLayoutEdits({ props, layout, setLayout, rules, select, focusNode });
  const entryOf = (key: string) => palette.find((entry) => entry.key === key);
  const drag = useFormLayoutDrag({
    layout,
    rules,
    entryType: (key) => entryOf(key)?.type,
    onMove: edits.move,
    onInsert: edits.insert,
  });
  const model = {
    layout,
    selectedId,
    select,
    announcement: edits.announcement,
    isEditable: edits.isEditable,
    drag: edits.isEditable ? drag : null,
    remove: edits.remove,
    update: edits.update,
    /** Moves a node to the next place in document order its type may go to. */
    step: (id: string, direction: 'previous' | 'next') => {
      const to = nextFormLayoutPlace(layout, rules, { id, direction });
      if (to) edits.move(id, to);
    },
    /** Adds an entry's node into the selected container, after the selected node, or at the end. */
    add: (key: string) => {
      const entry = entryOf(key);
      const to = addPlaces(layout, types, selectedId).find(
        (candidate) =>
          entry && canPlaceFormLayoutNode(layout, rules, { type: entry.type, place: candidate }),
      );
      if (to) edits.insert(key, to);
    },
    /** Focuses and selects the node before or after `id` in document order, or the first or last. */
    focusAlong: (id: string, to: 'previous' | 'next' | 'first' | 'last') => {
      const ids = flattenFormLayout(layout).map((node) => node.id);
      const at = ids.indexOf(id);
      const target =
        to === 'first' ? ids[0] : to === 'last' ? ids.at(-1) : ids[at + (to === 'next' ? 1 : -1)];
      if (target === undefined) return;
      select(target);
      focusNode(target);
    },
  };
  return { model, canvasRef };
}

export type FormLayoutDesignerModel<D> = ReturnType<typeof useFormLayoutDesigner<D>>['model'];
