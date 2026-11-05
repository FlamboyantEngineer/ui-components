'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { ToolbarRow, ToolbarRowSeparator } from '../layout/layout.js';
import { BlockTypeSelect, FormatButtons, LinkButton } from './format-controls.js';
import { getHistoryItems, getMarkItems, getWrapItems } from './format-items.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';

/** How the block type select draws its options. */
export type BlockTypeLabels = 'plain' | 'preview';

export interface FormatToolbarProps
  extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** Controls after the built-in ones, such as an `InsertMenuButton` or the caller's own. */
  children?: ReactNode;
  /**
   * How the block type select draws its options: `plain`, the default, with a glyph and the name,
   * or `preview`, the name alone in a `block-preview` slot naming the block type, for a host's
   * styles to draw each name the way its block looks.
   */
  blockTypeLabels?: BlockTypeLabels | undefined;
}

const hooks = createHooks('format-toolbar', ['block-type', 'block-preview', 'link-editor']);

/**
 * The formatting toolbar of the enclosing `RichTextEditor`, for its `toolbar` slot: undo and redo,
 * the block type, the marks, the link and the lists and quote, each reflecting the selection.
 * Commands the schema lacks are left out.
 */
export function FormatToolbar({
  ref,
  className,
  children,
  blockTypeLabels = 'plain',
  ...rest
}: FormatToolbarProps) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  const { ref: returnFocusRef, request: returnFocus } = useFocusReturn(controller);
  const rootRefs = useMergedRefs(returnFocusRef, ref);
  const label = rest['aria-labelledby']
    ? undefined
    : (rest['aria-label'] ?? strings.textFormatting);
  return (
    <ToolbarRow
      {...rest}
      aria-label={label}
      className={mergeClassNames(hooks.className, className)}
      justify="start"
      space="xs"
      ref={rootRefs}
    >
      <FormatButtons controller={controller} items={getHistoryItems(strings)} />
      <ToolbarRowSeparator />
      <BlockTypeSelect
        controller={controller}
        className={hooks.slotClass('block-type')}
        onCommand={returnFocus}
        renderPreview={
          blockTypeLabels === 'preview'
            ? ({ id, label }) => (
                <span {...hooks.slot('block-preview', { block: id })}>{label}</span>
              )
            : undefined
        }
      />
      <ToolbarRowSeparator />
      <FormatButtons controller={controller} items={getMarkItems(strings)} />
      {controller.supports({ type: 'set-link', href: null }) ? (
        <LinkButton
          controller={controller}
          className={hooks.slotClass('link-editor')}
          onCommand={returnFocus}
        />
      ) : null}
      <ToolbarRowSeparator />
      <FormatButtons controller={controller} items={getWrapItems(strings)} />
      {children}
    </ToolbarRow>
  );
}
