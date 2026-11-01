import { describe, expect, it } from 'vitest';
import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';
import {
  groupChatParts,
  isAwaitingApproval,
  isStepActive,
  summarizeSteps,
  toPartKey,
} from './chat-parts-grouping.js';

const reasoning = (id: string): ChatReasoningPart => ({
  type: 'reasoning',
  id,
  text: 'Comparing options.',
  status: 'complete',
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

  it('UIC-CHAT-PARTS-5.1 groups a single tool call, whether or not parts follow it', () => {
    expect(shape([text('Looking'), call('c1')])).toEqual(['text@0', 'steps(c1)']);
    expect(shape([call('c1')])).toEqual(['steps(c1)']);
    expect(shape([call('c1'), text('a'), call('c2'), text('b')])).toEqual([
      'steps(c1)',
      'text@1',
      'steps(c2)',
      'text@3',
    ]);
    expect(shape([])).toEqual([]);
  });

  it('UIC-CHAT-PARTS-5.1 leaves reasoning without a tool call alone', () => {
    expect(shape([reasoning('r1')])).toEqual(['reasoning:r1']);
    expect(shape([reasoning('r1'), text('Answer')])).toEqual(['reasoning:r1', 'text@1']);
    expect(
      shape([reasoning('r1'), reasoning('r2'), text('a'), reasoning('r3'), call('c1')]),
    ).toEqual(['reasoning:r1', 'reasoning:r2', 'text@2', 'steps(r3,c1)']);
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

describe('summarizeSteps', () => {
  it('UIC-CHAT-PARTS-5.2 counts the tool calls of each kind, in the order kinds first appear', () => {
    expect(
      summarizeSteps([
        reasoning('r1'),
        call('c1', { kind: 'edit' }),
        call('c2', { kind: 'read' }),
        call('c3', { kind: 'edit' }),
        call('c4'),
      ]),
    ).toEqual([
      { kind: 'edit', count: 2 },
      { kind: 'read', count: 1 },
      { kind: 'other', count: 1 },
    ]);
    expect(summarizeSteps([reasoning('r1')])).toEqual([]);
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
