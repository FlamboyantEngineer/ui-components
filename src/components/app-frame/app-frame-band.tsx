import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { ToolbarRow } from '../layout/layout.js';
import { ProjectionContent, useProjectedContent } from '../projection/projection.js';
import { toAppFrameSlot, useIsInsideAppFrame, type AppFrameBandSlot } from './app-frame.js';

export interface AppFrameBandProps extends BaseProps, AriaLabellingProps {
  /** The leading part: a title, a breadcrumb or fields. */
  leading?: ReactNode;
  /** A transient status after the leading part, such as a `SaveStatus`. */
  status?: ReactNode;
  /** The tools: `ToolbarRowGroup`s in one toolbar that scrolls when the band is narrow. */
  children?: ReactNode;
  /** Names the tools toolbar. Defaults to the provider's `tools` string. */
  toolsLabel?: string | undefined;
  /** The trailing actions. */
  actions?: ReactNode;
  /** Names the actions group. Defaults to the provider's `actions` string. */
  actionsLabel?: string | undefined;
}

export interface AppFrameBandContentProps {
  /** The part of the nearest frame's band to fill. */
  slot: AppFrameBandSlot;
  /** The content, which replaces the band's own for that part while mounted. */
  children?: ReactNode;
}

const hooks = createHooks('app-frame-band', ['leading', 'status', 'tools', 'actions']);

/** Each part's content: what a descendant projects into it, else the band's own prop. */
function useBandContents(own: Record<AppFrameBandSlot, ReactNode>) {
  return {
    leading: useProjectedContent(toAppFrameSlot('leading')) ?? own.leading,
    status: useProjectedContent(toAppFrameSlot('status')) ?? own.status,
    tools: useProjectedContent(toAppFrameSlot('tools')) ?? own.tools,
    actions: useProjectedContent(toAppFrameSlot('actions')) ?? own.actions,
  };
}

/**
 * The command band of an application frame, a named group: a leading title or breadcrumb, a
 * transient status, the tools in a toolbar that scrolls instead of wrapping, and trailing actions.
 * Inside an `AppFrame`, descendants fill its parts through `AppFrameBandContent`.
 */
export function AppFrameBand({
  leading,
  status,
  children,
  actions,
  toolsLabel,
  actionsLabel,
  className,
  ...rest
}: AppFrameBandProps) {
  const strings = useUiStrings();
  const contents = useBandContents({ leading, status, tools: children, actions });
  return (
    <div {...rest} {...hooks.root({ className })} role="group">
      {isEmptyNode(contents.leading) ? null : (
        <div {...hooks.slot('leading')}>{contents.leading}</div>
      )}
      {isEmptyNode(contents.status) ? null : <div {...hooks.slot('status')}>{contents.status}</div>}
      {isEmptyNode(contents.tools) ? null : (
        <ToolbarRow
          className={hooks.slotClass('tools')}
          overflow="scroll"
          justify="start"
          aria-label={toolsLabel ?? strings.tools}
        >
          {contents.tools}
        </ToolbarRow>
      )}
      {isEmptyNode(contents.actions) ? null : (
        <div {...hooks.slot('actions')} role="group" aria-label={actionsLabel ?? strings.actions}>
          {contents.actions}
        </div>
      )}
    </div>
  );
}

/**
 * Fills a part of the nearest frame's band from anywhere below the frame, in place of its own.
 * Without a frame above, it renders its children in place.
 */
export function AppFrameBandContent({ slot, children }: AppFrameBandContentProps) {
  if (!useIsInsideAppFrame()) return <>{children}</>;
  return <ProjectionContent slot={toAppFrameSlot(slot)}>{children}</ProjectionContent>;
}
