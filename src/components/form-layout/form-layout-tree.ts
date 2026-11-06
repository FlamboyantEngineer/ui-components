// The form layout tree: plain nodes the host maps its schema to, the rules that check them, and the
// pure edits the designer makes. Every edit returns a new tree that keeps each node it does not
// change, so ids and the host's `data` survive any number of edits.

/** One node of a form layout: a container of other nodes, or a leaf such as a field. */
export interface FormLayoutNode<D = unknown> {
  /** Unique within the layout; the host's own id, kept through every edit. */
  id: string;
  /** The node's type, a key of the layout's `types`. */
  type: string;
  /** The node's name in the designer and its announcements; the type's label by default. */
  label?: string | undefined;
  /** A container's nodes, in order. Only container types hold children. */
  children?: readonly FormLayoutNode<D>[] | undefined;
  /** A grid container's column count, published as `--ui-form-layout-columns`. */
  columns?: number | undefined;
  /** A locked node is neither moved nor removed by the designer. */
  isLocked?: boolean | undefined;
  /** The host's domain metadata, carried untouched. */
  data?: D | undefined;
}

/** A form layout: its top-level nodes, in order. */
export type FormLayoutValue<D = unknown> = readonly FormLayoutNode<D>[];

/** How a container lays out its children: in a column, in a row, or in a grid of `columns`. */
export type FormLayoutArrangement = 'stack' | 'row' | 'grid';

/** Where a node goes: into a container, or the top level when `parentId` is null, at `index`. */
export interface FormLayoutPlace {
  parentId: string | null;
  index: number;
}

/** Why a layout breaks the rules, for the node `id` names. */
export type FormLayoutIssueReason = 'duplicate-id' | 'unknown-type' | 'not-container' | 'placement';

export interface FormLayoutIssue {
  id: string;
  reason: FormLayoutIssueReason;
}

/** What the rules need to know of a type: whether it holds children, and which. */
export interface FormLayoutRule {
  arrangement?: FormLayoutArrangement | undefined;
  /** Whether a container takes a child of `type`. Every type by default. */
  accepts?: ((type: string) => boolean) | undefined;
}

export interface FormLayoutRules {
  types: Readonly<Record<string, FormLayoutRule>>;
  /** Whether the top level takes a node of `type`. Every type by default. */
  rootAccepts?: ((type: string) => boolean) | undefined;
}

/** Where a node sits: the node, its container's id (null at the top level) and its index there. */
export interface FormLayoutLocation<D = unknown> {
  node: FormLayoutNode<D>;
  parentId: string | null;
  index: number;
}

/** Finds the node `id` names, with its place, or null. */
export function findFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  id: string,
  parentId: string | null = null,
): FormLayoutLocation<D> | null {
  for (const [index, node] of layout.entries()) {
    if (node.id === id) return { node, parentId, index };
    const found = node.children ? findFormLayoutNode(node.children, id, node.id) : null;
    if (found) return found;
  }
  return null;
}

/** Every node of the layout in document order, containers before their children. */
export function flattenFormLayout<D>(layout: FormLayoutValue<D>): FormLayoutNode<D>[] {
  return layout.flatMap((node) => [node, ...flattenFormLayout(node.children ?? [])]);
}

/** Whether `ancestorId` is `id` or holds it, at any depth. */
function isWithin<D>(layout: FormLayoutValue<D>, ancestorId: string, id: string): boolean {
  const ancestor = findFormLayoutNode(layout, ancestorId);
  return ancestor !== null && findFormLayoutNode([ancestor.node], id) !== null;
}

/** Whether the container `parentId` (the top level when null) takes a node of `type`. */
function accepts<D>(
  layout: FormLayoutValue<D>,
  rules: FormLayoutRules,
  { parentId, type }: { parentId: string | null; type: string },
): boolean {
  if (parentId === null) return rules.rootAccepts?.(type) ?? true;
  const parent = findFormLayoutNode(layout, parentId)?.node;
  const rule = parent ? rules.types[parent.type] : undefined;
  if (!rule?.arrangement) return false;
  return rule.accepts?.(type) ?? true;
}

/** Every rule the layout breaks: repeated ids, unknown types, children of leaves, refused places. */
export function validateFormLayout<D>(
  layout: FormLayoutValue<D>,
  rules: FormLayoutRules,
): FormLayoutIssue[] {
  const issues: FormLayoutIssue[] = [];
  const seen = new Set<string>();
  const visit = (nodes: FormLayoutValue<D>, parentId: string | null) => {
    for (const node of nodes) {
      if (seen.has(node.id)) issues.push({ id: node.id, reason: 'duplicate-id' });
      seen.add(node.id);
      const rule = rules.types[node.type];
      if (!rule) issues.push({ id: node.id, reason: 'unknown-type' });
      else if (node.children && !rule.arrangement) {
        issues.push({ id: node.id, reason: 'not-container' });
      }
      if (rule && !accepts(layout, rules, { parentId, type: node.type })) {
        issues.push({ id: node.id, reason: 'placement' });
      }
      if (node.children) visit(node.children, node.id);
    }
  };
  visit(layout, null);
  return issues;
}

/** The layout with `edit` applied to the children of `parentId` (the top level when null). */
function editChildren<D>(
  layout: FormLayoutValue<D>,
  parentId: string | null,
  edit: (children: readonly FormLayoutNode<D>[]) => readonly FormLayoutNode<D>[],
): FormLayoutValue<D> {
  if (parentId === null) return edit(layout);
  return layout.map((node) => {
    if (node.id === parentId) return { ...node, children: edit(node.children ?? []) };
    if (!node.children || !findFormLayoutNode(node.children, parentId)) return node;
    return { ...node, children: editChildren(node.children, parentId, edit) };
  });
}

/** The layout without the node `id` names, and without its children. */
export function removeFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  id: string,
): FormLayoutValue<D> {
  const found = findFormLayoutNode(layout, id);
  if (!found) return layout;
  return editChildren(layout, found.parentId, (children) =>
    children.filter((child) => child.id !== id),
  );
}

/** The layout with `node` inserted at `place`, its index clamped to the container's children. */
export function insertFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  node: FormLayoutNode<D>,
  place: FormLayoutPlace,
): FormLayoutValue<D> {
  return editChildren(layout, place.parentId, (children) => {
    const index = Math.max(0, Math.min(place.index, children.length));
    return [...children.slice(0, index), node, ...children.slice(index)];
  });
}

/** The layout with the node `id` names replaced by `update` of it. */
export function updateFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  id: string,
  update: (node: FormLayoutNode<D>) => FormLayoutNode<D>,
): FormLayoutValue<D> {
  const found = findFormLayoutNode(layout, id);
  if (!found) return layout;
  return editChildren(layout, found.parentId, (children) =>
    children.map((child) => (child.id === id ? update(child) : child)),
  );
}

/**
 * The layout with the node `id` names moved to `place`, whose index counts the container's
 * children without the moved node.
 */
export function moveFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  id: string,
  place: FormLayoutPlace,
): FormLayoutValue<D> {
  const found = findFormLayoutNode(layout, id);
  if (!found) return layout;
  return insertFormLayoutNode(removeFormLayoutNode(layout, id), found.node, place);
}

/**
 * Whether a node of `type` may go to `place`: the container exists and takes the type, and a moved
 * node (`id`) is unlocked and not moved into itself.
 */
export function canPlaceFormLayoutNode<D>(
  layout: FormLayoutValue<D>,
  rules: FormLayoutRules,
  { type, id, place }: { type: string; id?: string | undefined; place: FormLayoutPlace },
): boolean {
  if (id !== undefined) {
    const moved = findFormLayoutNode(layout, id);
    if (!moved || moved.node.isLocked) return false;
    if (place.parentId !== null && isWithin(layout, id, place.parentId)) return false;
  }
  return accepts(layout, rules, { parentId: place.parentId, type });
}

/** Every place in document order: each container's slots before, between and after its children. */
export function listFormLayoutPlaces<D>(
  layout: FormLayoutValue<D>,
  rules: FormLayoutRules,
  parentId: string | null = null,
): FormLayoutPlace[] {
  return [
    ...layout.flatMap((node, index) => [
      { parentId, index },
      ...(rules.types[node.type]?.arrangement
        ? listFormLayoutPlaces(node.children ?? [], rules, node.id)
        : []),
    ]),
    { parentId, index: layout.length },
  ];
}

/**
 * The next place for the node `id` names in `direction`, in document order, that its type may go
 * to, or null at either end: the keyboard's way to move a node into and out of containers.
 */
export function nextFormLayoutPlace<D>(
  layout: FormLayoutValue<D>,
  rules: FormLayoutRules,
  { id, direction }: { id: string; direction: 'previous' | 'next' },
): FormLayoutPlace | null {
  const found = findFormLayoutNode(layout, id);
  if (!found || found.node.isLocked) return null;
  const rest = removeFormLayoutNode(layout, id);
  const places = listFormLayoutPlaces(rest, rules);
  const at = places.findIndex(
    (place) => place.parentId === found.parentId && place.index === found.index,
  );
  const step = direction === 'next' ? 1 : -1;
  for (let index = at + step; index >= 0 && index < places.length; index += step) {
    const place = places[index];
    if (place && accepts(rest, rules, { parentId: place.parentId, type: found.node.type })) {
      return place;
    }
  }
  return null;
}
