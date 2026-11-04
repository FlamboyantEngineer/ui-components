import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import {
  insertStep,
  isStepDirty,
  isStepListDirty,
  moveStep,
  readStepValue,
  removeStep,
  resolveStepDrop,
  resolveStepMove,
  type StepListEditorStep,
  updateStep,
} from './step-list.js';

const steps: StepListEditorStep[] = [
  { id: 'a', values: { action: 'Open' } },
  { id: 'b', values: { action: 'Type', data: 'ada' } },
  { id: 'c', values: { action: 'Save' } },
];

const ids = (list: readonly StepListEditorStep[]) => list.map((step) => step.id);

describe('step list edits', () => {
  it('UIC-STEP-LIST-EDITOR-1.3 UIC-STEP-LIST-EDITOR-2.1 inserts, updates and removes steps', () => {
    const added = { id: 'd', values: {} };
    expect(ids(insertStep(steps, 1, added))).toEqual(['a', 'd', 'b', 'c']);
    expect(ids(insertStep(steps, 9, added))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(insertStep(steps, -2, added))).toEqual(['d', 'a', 'b', 'c']);
    const typed = updateStep(steps, { id: 'b', values: { action: 'Paste' } });
    expect(typed[1]).toEqual({ id: 'b', values: { action: 'Paste' } });
    expect(typed[0]).toBe(steps[0]);
    expect(ids(removeStep(steps, 'b'))).toEqual(['a', 'c']);
    expect(readStepValue(requireDefined(steps[1]), 'data')).toBe('ada');
    expect(readStepValue(requireDefined(steps[0]), 'data')).toBe('');
  });

  it('UIC-STEP-LIST-EDITOR-2.2 UIC-STEP-LIST-EDITOR-2.3 moves a step one place, never past the ends', () => {
    expect(resolveStepMove(steps, 'a', 1)).toEqual({ key: 'a', targetKey: 'b', position: 'after' });
    expect(resolveStepMove(steps, 'c', -1)).toEqual({
      key: 'c',
      targetKey: 'b',
      position: 'before',
    });
    expect(resolveStepMove(steps, 'a', -1)).toBeNull();
    expect(resolveStepMove(steps, 'c', 1)).toBeNull();
    expect(resolveStepMove(steps, 'x', 1)).toBeNull();
    expect(ids(moveStep(steps, { key: 'a', targetKey: 'c', position: 'after' }))).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(ids(moveStep(steps, { key: 'c', targetKey: 'a', position: 'before' }))).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(moveStep(steps, { key: 'a', targetKey: 'a', position: 'after' })).toBe(steps);
    expect(moveStep(steps, { key: 'a', targetKey: 'x', position: 'after' })).toBe(steps);
  });

  it('UIC-STEP-LIST-EDITOR-2.4 drops a step in the place of its target', () => {
    expect(resolveStepDrop(steps, { key: 'a', targetKey: 'c' })).toEqual({
      key: 'a',
      targetKey: 'c',
      position: 'after',
    });
    expect(resolveStepDrop(steps, { key: 'c', targetKey: 'b' })).toEqual({
      key: 'c',
      targetKey: 'b',
      position: 'before',
    });
    expect(resolveStepDrop(steps, { key: 'b', targetKey: 'b' })).toBeNull();
    expect(resolveStepDrop(steps, { key: 'x', targetKey: 'b' })).toBeNull();
  });

  it('UIC-STEP-LIST-EDITOR-3.1 compares steps and lists with their committed versions', () => {
    const columns = ['action', 'data'];
    expect(
      isStepDirty(
        requireDefined(steps[0]),
        { id: 'a', values: { action: 'Open', data: '' } },
        columns,
      ),
    ).toBe(false);
    expect(
      isStepDirty(requireDefined(steps[0]), { id: 'a', values: { action: 'Close' } }, columns),
    ).toBe(true);
    expect(isStepDirty(requireDefined(steps[0]), undefined, columns)).toBe(true);
    expect(isStepListDirty(steps, steps, columns)).toBe(false);
    expect(isStepListDirty(steps.slice(0, 2), steps, columns)).toBe(true);
    expect(
      isStepListDirty(
        [requireDefined(steps[1]), requireDefined(steps[0]), requireDefined(steps[2])],
        steps,
        columns,
      ),
    ).toBe(true);
    expect(isStepListDirty(updateStep(steps, { id: 'c', values: {} }), steps, columns)).toBe(true);
  });
});
