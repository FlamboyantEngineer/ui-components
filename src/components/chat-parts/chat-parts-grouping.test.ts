import { describe, expect, it } from 'vitest';
import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';
import {
  groupChatParts,
  isAwaitingApproval,
  isFailedCall,
  isStepActive,
  sumStepDurations,
  toPartKey,
} from './chat-parts-grouping.js';

const reasoning = (id: string, durationMs?: number): ChatReasoningPart => ({
  type: 'reasoning',
  id,
  text: 'Comparing options.',
  status: 'complete',
  durationMs,
});
const call = (id: string, overrides: Partial<ChatToolCallPart> = {}): ChatToolCallPart => ({
  type: 'tool-call',
  id,
  name: 'search_recipes',
  status: 'succeeded',
  ...overrides,
});
const text = (value: string): ChatPart => ({ type: 'text', text: value });

const shape = (parts: readonly ChatPart[]) =>
  groupChatParts(parts).map((item) =>
    item.kind === 'steps' ? `steps(${item.steps.map((step) => step.id).join(',')})` : item.key,
  );

describe('groupChatParts', () => {
  it('UIC-CHAT-PARTS-5.1 folds two or more consecutive steps into one group', () => {
    expect(shape([text('Hi'), reasoning('r1'), call('c1'), call('c2'), text('Done')])).toEqual([
      'text@0',
      'steps(r1,c1,c2)',
      'text@4',
    ]);
    expect(shape([reasoning('r1'), call('c1')])).toEqual(['steps(r1,c1)']);
  });

  it('UIC-CHAT-PARTS-5.1 groups a single step only when further parts follow it', () => {
    expect(shape([reasoning('r1')])).toEqual(['reasoning:r1']);
    expect(shape([text('Looking'), call('c1')])).toEqual(['text@0', 'tool-call:c1']);
    expect(shape([reasoning('r1'), text('Answer')])).toEqual(['steps(r1)', 'text@1']);
    expect(shape([call('c1'), text('a'), reasoning('r2'), text('b')])).toEqual([
      'steps(c1)',
      'text@1',
      'steps(r2)',
      'text@3',
    ]);
    expect(shape([])).toEqual([]);
  });

  it('UIC-CHAT-PARTS-5.1 keys a group by its first step', () => {
    const [group] = groupChatParts([reasoning('r1'), call('c1')]);
    expect(group?.key).toBe('steps:r1');
  });
});

describe('toPartKey', () => {
  it('UIC-CHAT-PARTS-1.1 keys a part by its type and id, else its type and position', () => {
    expect(toPartKey({ type: 'text', id: 'intro', text: 'Hi' }, 3)).toBe('text:intro');
    expect(toPartKey({ type: 'text', text: 'Hi' }, 3)).toBe('text@3');
    expect(toPartKey(call('c1'), 0)).toBe('tool-call:c1');
  });
});

describe('sumStepDurations', () => {
  it('UIC-CHAT-PARTS-5.2 sums the durations the steps have', () => {
    expect(sumStepDurations([reasoning('r1', 1200), call('c1', { durationMs: 800 })])).toBe(2000);
    expect(sumStepDurations([reasoning('r1', 1200), call('c1')])).toBe(1200);
    expect(sumStepDurations([reasoning('r1'), call('c1')])).toBeUndefined();
  });
});

describe('isStepActive', () => {
  it('UIC-CHAT-PARTS-5.2 counts streaming reasoning and pending or running calls as at work', () => {
    expect(isStepActive({ ...reasoning('r1'), status: 'streaming' })).toBe(true);
    expect(isStepActive(reasoning('r1'))).toBe(false);
    expect(isStepActive(call('c1', { status: 'pending' }))).toBe(true);
    expect(isStepActive(call('c1', { status: 'running' }))).toBe(true);
    expect(isStepActive(call('c1', { status: 'approval-requested' }))).toBe(false);
    expect(isStepActive(call('c1'))).toBe(false);
  });
});

describe('isAwaitingApproval', () => {
  it('UIC-CHAT-PARTS-5.3 finds calls whose approval waits for a decision', () => {
    expect(isAwaitingApproval(call('c1', { status: 'approval-requested' }))).toBe(true);
    expect(
      isAwaitingApproval(
        call('c1', { status: 'approval-requested', approval: { decision: 'approved' } }),
      ),
    ).toBe(false);
    expect(isAwaitingApproval(call('c1', { status: 'running' }))).toBe(false);
    expect(isAwaitingApproval(reasoning('r1'))).toBe(false);
  });
});

describe('isFailedCall', () => {
  it('UIC-CHAT-PARTS-5.4 finds failed calls only', () => {
    expect(isFailedCall(call('c1', { status: 'failed' }))).toBe(true);
    expect(isFailedCall(call('c1'))).toBe(false);
    expect(isFailedCall(call('c1', { status: 'denied' }))).toBe(false);
    expect(isFailedCall(call('c1', { status: 'cancelled' }))).toBe(false);
    expect(isFailedCall(reasoning('r1'))).toBe(false);
  });
});
