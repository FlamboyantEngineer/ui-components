// What the segments of a date-time field show while that is not yet a value: a date typed in part,
// or a range with one end left empty, which the building block does not report as a change.

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { DateFieldStateContext, TimeFieldStateContext } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { FieldState } from '../field/field.js';

/** How much of one segment group the reader has filled. */
type DraftFill = 'empty' | 'partial' | 'complete';

/** What the draft reads of a segment as the building block lays it out. */
interface DraftSegment {
  isEditable: boolean;
  isPlaceholder: boolean;
}

/** Records the fill of a segment group by its slot, and returns the function that removes it. */
type ReportFill = (slot: string, fill: DraftFill) => () => void;

const DraftContext = createContext<ReportFill | null>(null);

function measureFill(segments: readonly DraftSegment[]): DraftFill {
  const editable = segments.filter((segment) => segment.isEditable);
  const filled = editable.filter((segment) => !segment.isPlaceholder).length;
  if (filled === 0) return 'empty';
  return filled === editable.length ? 'complete' : 'partial';
}

/** A group typed in part, or groups some filled and some empty, is not a value. */
function isIncomplete(fills: readonly DraftFill[]): boolean {
  return fills.includes('partial') || (fills.includes('complete') && fills.includes('empty'));
}

/**
 * Wraps one segment of a group. The group's first editable segment also reports how much of the
 * group is filled, read from the group's own state, so each group reports once.
 */
export function DraftAwareSegment({
  segment,
  slot = 'value',
  children,
}: {
  segment: DraftSegment;
  slot?: string | undefined;
  /** The segment itself. */
  children: ReactNode;
}) {
  const dateState = useContext(DateFieldStateContext);
  const timeState = useContext(TimeFieldStateContext);
  const segments: readonly DraftSegment[] = (dateState ?? timeState)?.segments ?? [];
  const isReporter = segments.find((entry) => entry.isEditable) === segment;
  const fill = measureFill(segments);
  const report = useContext(DraftContext);
  useLayoutEffect(() => {
    if (!isReporter || !report) return undefined;
    return report(slot, fill);
  }, [isReporter, report, slot, fill]);
  return children;
}

/** Collects the fill of a picker's segment groups into the field's draft issue. */
export function DateDraftScope({
  state,
  children,
}: {
  state: Pick<FieldState<unknown>, 'setDraftIssue'>;
  children: ReactNode;
}) {
  const strings = useUiStrings();
  const [fills, setFills] = useState<Readonly<Record<string, DraftFill>>>({});
  const report = useCallback<ReportFill>((slot, fill) => {
    setFills((previous) => (previous[slot] === fill ? previous : { ...previous, [slot]: fill }));
    return () =>
      setFills((previous) => {
        const { [slot]: _removed, ...rest } = previous;
        return rest;
      });
  }, []);
  const incomplete = isIncomplete(Object.values(fills));
  const { setDraftIssue } = state;
  useLayoutEffect(() => {
    setDraftIssue(incomplete ? { severity: 'error', message: strings.dateIncomplete } : null);
  }, [incomplete, setDraftIssue, strings.dateIncomplete]);
  return <DraftContext.Provider value={report}>{children}</DraftContext.Provider>;
}
