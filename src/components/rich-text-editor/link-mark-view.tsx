'use client';

import type { MarkViewComponentProps } from '@handlewithcare/react-prosemirror';
import { type ReactNode, useContext } from 'react';
import { toLinkAttributes } from './default-schema.js';
import { RichTextEditorContext } from './rich-text-context.js';

type LinkMarkViewProps = MarkViewComponentProps & { children?: ReactNode };

/**
 * A default link drawn by the editor: the anchor its mark spec writes, out of the tab sequence
 * while the editor is disabled. A read-only editor's links stay focusable and followable.
 */
export function LinkMarkView({ markProps, children, ref, ...props }: LinkMarkViewProps) {
  const editor = useContext(RichTextEditorContext);
  return (
    <a
      {...props}
      {...toLinkAttributes(markProps.mark.attrs)}
      tabIndex={editor?.isDisabled ? -1 : undefined}
      ref={ref}
    >
      {children}
    </a>
  );
}
