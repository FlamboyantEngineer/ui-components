'use client';

import type { ReactElement } from 'react';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  Menu,
  type MenuEntry,
  MenuItem,
  MenuPopover,
  type MenuProps,
  MenuSection,
  MenuSeparator,
  SubmenuTrigger,
} from './menu.js';

/** The menu's parts, keyed by their `id`: its `children`, or the parts drawn from its data entries. */
export function renderMenuChildren({
  children,
  items,
  highlightMatches,
}: Pick<MenuProps, 'children' | 'items' | 'highlightMatches'>) {
  return keyCollectionChildren(
    children ?? (items ? renderMenuEntries(items, highlightMatches ?? false) : null),
  );
}

/** Draws the menu's data entries using the same public parts as its JSX children. */
function renderMenuEntries(entries: readonly MenuEntry[], highlight: boolean): ReactElement[] {
  return entries.map((entry) => renderEntry(entry, highlight));
}

function renderEntry(entry: MenuEntry, highlight: boolean): ReactElement {
  if (entry.type === 'separator') return <MenuSeparator key={toKeyIdentity(entry.id)} />;
  if (entry.type === 'section') {
    const { type: _type, items, ...section } = entry;
    return (
      <MenuSection key={toKeyIdentity(entry.id)} {...section}>
        {renderMenuEntries(items, highlight)}
      </MenuSection>
    );
  }
  const { type: _type, label, items, renderContent, ...item } = entry;
  const element = (
    <MenuItem key={toKeyIdentity(entry.id)} textValue={label} {...item}>
      {renderContent ?? (highlight ? <TextMatch>{label}</TextMatch> : label)}
    </MenuItem>
  );
  if (!items?.length) return element;
  return (
    <SubmenuTrigger key={toKeyIdentity(entry.id)}>
      {element}
      <MenuPopover>
        <Menu>{renderMenuEntries(items, highlight)}</Menu>
      </MenuPopover>
    </SubmenuTrigger>
  );
}
