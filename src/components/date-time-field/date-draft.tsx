'use client';

// What the segments of a date-time field show while that is not yet a value: a date typed in part,
// or a range with one end left empty, which the building block does not report as a change.

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ContextType,
  type ReactNode,
  type RefObject,
} from 'react';
import { DateFieldStateContext, TimeFieldStateContext } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { FieldState } from '../field/field.js';
import { useNativeReset } from '../../utils/use-native-reset.js';

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

/** A segment group's state in the building block, the one a native reset clears. */
type SegmentGroupState = NonNullable<ContextType<typeof DateFieldStateContext>>;

/** A segment the reader typed, as the building block's `setSegment` takes it back. */
interface TypedSegment {
  type: Parameters<SegmentGroupState['setSegment']>[0];
  value: number;
}

/** Records a segment group's state by its slot, and returns the function that removes it. */
type RegisterGroup = (slot: string, state: SegmentGroupState) => () => void;

const GroupContext = createContext<RegisterGroup | null>(null);

/**
 * The segments of a group typed in part, or `null` for an empty or full group, which shows the
 * field's value: only a partial group is a draft the field does not hold itself.
 */
function readTypedSegments(state: SegmentGroupState): TypedSegment[] | null {
  const editable = state.segments.filter((segment) => segment.isEditable);
  const typed = editable.filter((segment) => !segment.isPlaceholder);
  if (typed.length === 0 || typed.length === editable.length) return null;
  return typed.map((segment) => ({ type: segment.type, value: segment.value ?? 0 }));
}

/**
 * The building block clears a group's typed segments on its form's own `reset` listener, before a
 * listener that cancels the reset has run, while the field holds its value through the reset. This
 * notes each group's segments typed in part as the reset starts, and a cancelled reset types them
 * back, one per render, as `setSegment` builds on the segments the group last rendered.
 */
function useGroupReset(root: RefObject<Element | null>): RegisterGroup {
  const groups = useRef(new Map<string, SegmentGroupState>());
  const noted = useRef(new Map<string, TypedSegment[]>());
  const pending = useRef(new Map<string, TypedSegment[]>());
  const typeNext = useCallback((slot: string) => {
    const next = pending.current.get(slot)?.shift();
    if (next) groups.current.get(slot)?.setSegment(next.type, next.value);
    else pending.current.delete(slot);
  }, []);
  useNativeReset(root, () => noted.current.clear(), {
    onStart: () => {
      noted.current.clear();
      for (const [slot, state] of groups.current) {
        const typed = readTypedSegments(state);
        if (typed) noted.current.set(slot, typed);
      }
    },
    onCancel: () => {
      pending.current = noted.current;
      noted.current = new Map();
      for (const slot of pending.current.keys()) typeNext(slot);
    },
  });
  return useCallback<RegisterGroup>(
    (slot, state) => {
      groups.current.set(slot, state);
      typeNext(slot);
      return () => {
        if (groups.current.get(slot) === state) groups.current.delete(slot);
      };
    },
    [typeNext],
  );
}

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
  const groupState = dateState ?? timeState;
  const segments: readonly DraftSegment[] = groupState?.segments ?? [];
  const isReporter = segments.find((entry) => entry.isEditable) === segment;
  const fill = measureFill(segments);
  const report = useContext(DraftContext);
  useLayoutEffect(() => {
    if (!isReporter || !report) return undefined;
    return report(slot, fill);
  }, [isReporter, report, slot, fill]);
  const register = useContext(GroupContext);
  useLayoutEffect(() => {
    if (!isReporter || !register || !groupState) return undefined;
    return register(slot, groupState);
  }, [isReporter, register, slot, groupState]);
  return children;
}

/** Collects the fill of a picker's segment groups into the field's draft issue. */
export function DateDraftScope({
  state,
  root,
  children,
}: {
  state: Pick<FieldState<unknown>, 'setDraftIssue'>;
  /** An element of the field, which finds the form whose reset the segments follow. */
  root: RefObject<Element | null>;
  children: ReactNode;
}) {
  const register = useGroupReset(root);
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
  return (
    <DraftContext value={report}>
      <GroupContext value={register}>{children}</GroupContext>
    </DraftContext>
  );
}
