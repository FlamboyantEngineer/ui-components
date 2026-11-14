'use client';

import { isValidElement, type ReactNode } from 'react';
import type { IconSource } from '../icon/icon.js';
import { Label, type LabelProps } from '../label/label.js';
import { hasContent, MetaLineBase, type MetaLineBaseProps } from './meta-line-base.js';

/** An entry the line draws as a `Label`: text, an icon, or an icon before text. */
export interface MetaLineLabel extends Pick<LabelProps, 'size' | 'truncate'> {
  /** A decorative icon before the text: an imported icon component or rendered element. */
  icon?: IconSource;
  /** The entry's text. Without it, the icon alone, which the caller names around the line. */
  label?: ReactNode;
}

/** A metadata entry: a node, or a label entry the line draws as a `Label`. */
export type MetaLineItem = ReactNode | MetaLineLabel;

export interface MetaLineProps extends Omit<MetaLineBaseProps, 'items'> {
  /** The entries, in order. Empty entries are skipped without leaving a separator. */
  items: readonly MetaLineItem[];
}

function isLabelEntry(item: MetaLineItem): item is MetaLineLabel {
  return (
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item) &&
    !isValidElement(item) &&
    ('label' in item || 'icon' in item)
  );
}

/** A label entry as a `Label`, or nothing when it has neither an icon nor label content. */
function toNode(item: MetaLineItem): ReactNode {
  if (!isLabelEntry(item)) return item;
  return item.icon || hasContent(item.label) ? <Label {...item} /> : null;
}

/** One inline line of metadata entries, nodes or labels, separated by a decorative middot. */
export function MetaLine({ items, ...rest }: MetaLineProps) {
  return <MetaLineBase {...rest} items={items.map(toNode)} />;
}
