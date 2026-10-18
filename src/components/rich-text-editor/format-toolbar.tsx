import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ToolbarRow, ToolbarRowSeparator } from '../layout/layout.js';
import { BlockTypeSelect, FormatButtons, LinkButton } from './format-controls.js';
import { getHistoryItems, getMarkItems, getWrapItems } from './format-items.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';

export interface FormatToolbarProps extends BaseProps, AriaLabellingProps {
  /** Controls after the built-in ones, such as an `InsertMenuButton` or the caller's own. */
  children?: ReactNode;
}

const hooks = createHooks('format-toolbar', ['block-type', 'link-editor']);

/**
 * The formatting toolbar of the enclosing `RichTextEditor`, for its `toolbar` slot: undo and redo,
 * the block type, the marks, the link and the lists and quote, each reflecting the selection.
 * Commands the schema lacks are left out.
 */
export function FormatToolbar({ className, children, ...rest }: FormatToolbarProps) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  const focusReturn = useFocusReturn(controller);
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
      ref={focusReturn.ref}
    >
      <FormatButtons controller={controller} items={getHistoryItems(strings)} />
      <ToolbarRowSeparator />
      <BlockTypeSelect
        controller={controller}
        className={hooks.slotClass('block-type')}
        onCommand={focusReturn.request}
      />
      <ToolbarRowSeparator />
      <FormatButtons controller={controller} items={getMarkItems(strings)} />
      {controller.supports({ type: 'set-link', href: null }) ? (
        <LinkButton
          controller={controller}
          className={hooks.slotClass('link-editor')}
          onCommand={focusReturn.request}
        />
      ) : null}
      <ToolbarRowSeparator />
      <FormatButtons controller={controller} items={getWrapItems(strings)} />
      {children}
    </ToolbarRow>
  );
}
