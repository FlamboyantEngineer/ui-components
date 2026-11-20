'use client';

// The collapsible frame reasoning and groups of steps share: a trigger with a label and a busy
// indicator, and a panel that opens while the work goes on and collapses once it ends.

import { type ReactNode, useState } from 'react';
import type { ComponentHooks, DataValues } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useFocusWithin } from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { Spinner } from '../progress-bar/progress-bar.js';
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace/trace.js';

/** Whether an activity part is open, which follows its progress until the reader chooses. */
export interface ActivityExpansionProps {
  /** Whether it is open (controlled); `undefined` leaves it to its progress and the reader. */
  isExpanded?: boolean | undefined;
  /** Opens or closes it from the start whatever its progress, as if the reader had chosen. */
  defaultExpanded?: boolean | undefined;
  /** Receives each state the reader requests, also while controlled. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** Opens on its own while the work goes on; without it, it stays closed until the reader opens it. Defaults to `true`. */
  expandsAutomatically?: boolean | undefined;
}

/** The slots the shared frame draws. */
type ActivityDisclosureSlot = 'trigger' | 'label' | 'spinner' | 'panel';

interface ActivityDisclosureProps extends Omit<BaseProps, 'id'>, ActivityExpansionProps {
  /** The hooks of the part that renders the frame. */
  hooks: ComponentHooks<ActivityDisclosureSlot>;
  /** The work goes on: the panel opens on its own and a busy indicator shows. */
  isActive: boolean;
  /** Publishes `aria-busy` on the panel while its content is still coming in. */
  isPanelBusy?: boolean | undefined;
  /** The trigger's label, which also names the panel. */
  label: string;
  /** A decorative glyph before the label. */
  glyph?: ReactNode;
  /** The part's hook values on its root. */
  data: DataValues;
  /** The panel's content. */
  children?: ReactNode;
}

/**
 * The open state: the caller's, else the reader's choice, else open while the work goes on or while
 * focus is inside the panel, so the panel never collapses under the reader's focus.
 */
function useActivityExpansion({
  isActive,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  expandsAutomatically = true,
}: ActivityExpansionProps & { isActive: boolean }) {
  const [choice, setChoice] = useState(defaultExpanded);
  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
  return {
    isExpanded: isExpanded ?? choice ?? ((expandsAutomatically && isActive) || isFocusWithin),
    onExpandedChange(next: boolean) {
      setChoice(next);
      onExpandedChange?.(next);
    },
    focusWithinProps,
  };
}

/**
 * A trace step whose details show and hide: a `TraceCollapsible` whose trigger holds one
 * `TraceLine` (the glyph, the label and, while the work goes on, a decorative spinner) and whose
 * content holds the panel, a group named by the trigger.
 */
export function ActivityDisclosure({
  hooks,
  isActive,
  isPanelBusy = false,
  label,
  glyph,
  data,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  expandsAutomatically,
  className,
  children,
  ...rest
}: ActivityDisclosureProps) {
  const expansion = useActivityExpansion({
    isActive,
    isExpanded,
    defaultExpanded,
    onExpandedChange,
    expandsAutomatically,
  });
  return (
    <TraceCollapsible
      {...rest}
      {...hooks.root({ className, props: rest, data })}
      isExpanded={expansion.isExpanded}
      onExpandedChange={expansion.onExpandedChange}
    >
      <TraceCollapsibleTrigger className={hooks.slotClass('trigger')}>
        <TraceLine status={isActive ? 'running' : undefined}>
          {glyph ? <TraceIcon>{glyph}</TraceIcon> : null}
          <TraceTitle className={hooks.slotClass('label')}>{label}</TraceTitle>
          {isActive ? <Spinner size="sm" className={hooks.slotClass('spinner')} /> : null}
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent
        className={hooks.slotClass('panel')}
        render={(props) => (
          <div
            {...mergeProps(props, expansion.focusWithinProps)}
            aria-busy={isPanelBusy || undefined}
          />
        )}
      >
        {children}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}
