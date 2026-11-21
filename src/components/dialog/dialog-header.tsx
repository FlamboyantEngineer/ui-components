'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { DialogProps } from './dialog.js';
import { dialogHooks as hooks } from './dialog-hooks.js';
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from './dialog-parts.js';

type BuiltInHeaderProps = Pick<
  DialogProps,
  'title' | 'description' | 'headerActions' | 'showCloseButton'
>;

/** The header row: the title and description, caller content, then an optional close button. */
export function BuiltInHeader({
  title,
  description,
  headerActions,
  showCloseButton,
}: BuiltInHeaderProps) {
  const strings = useUiStrings();
  return (
    <DialogHeader>
      <div {...hooks.slot('heading')}>
        {isEmptyNode(title) ? null : <DialogTitle>{title}</DialogTitle>}
        {isEmptyNode(description) ? null : <DialogDescription>{description}</DialogDescription>}
      </div>
      {isEmptyNode(headerActions) ? null : (
        <div {...hooks.slot('header-actions')}>{headerActions}</div>
      )}
      {showCloseButton ? <DialogClose icon={CloseGlyph} label={strings.close} /> : null}
    </DialogHeader>
  );
}
