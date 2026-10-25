import { describe, expect, it } from 'vitest';
import {
  countDoneSteps,
  listChangedSteps,
  mapStepStatuses,
  toWholeSeconds,
  type ChatPlanStep,
} from './chat-activity.js';

const steps: ChatPlanStep[] = [
  { id: 'hotel', label: 'Book the hotel', status: 'done' },
  { id: 'trains', label: 'Compare trains', status: 'in-progress' },
  { id: 'bags', label: 'Pack the bags', status: 'pending' },
  { id: 'museum', label: 'Reserve the museum', status: 'done' },
];

describe('chat activity model', () => {
  it('UIC-CHAT-ACTIVITY-1.3 rounds a duration to whole seconds', () => {
    expect(toWholeSeconds(undefined)).toBeUndefined();
    expect(toWholeSeconds(0)).toBe(0);
    expect(toWholeSeconds(499)).toBe(0);
    expect(toWholeSeconds(500)).toBe(1);
    expect(toWholeSeconds(4400)).toBe(4);
    expect(toWholeSeconds(65_200)).toBe(65);
    expect(toWholeSeconds(-20)).toBe(0);
  });

  it('UIC-CHAT-ACTIVITY-3.3 counts the steps done', () => {
    expect(countDoneSteps(steps)).toBe(2);
    expect(countDoneSteps([])).toBe(0);
  });

  it('UIC-CHAT-ACTIVITY-3.4 lists the steps whose status changed, new pending steps excepted', () => {
    const before = mapStepStatuses(steps);
    expect(before.get('trains')).toBe('in-progress');
    expect(listChangedSteps(steps, before)).toEqual([]);
    const after: ChatPlanStep[] = [
      { id: 'hotel', label: 'Book the hotel', status: 'done' },
      { id: 'trains', label: 'Compare trains', status: 'done' },
      { id: 'bags', label: 'Pack the bags', status: 'in-progress' },
      { id: 'museum', label: 'Reserve the museum', status: 'done' },
      { id: 'tickets', label: 'Print the tickets', status: 'pending' },
      { id: 'cafe', label: 'Find a café', status: 'skipped' },
    ];
    expect(listChangedSteps(after, before).map((step) => step.id)).toEqual([
      'trains',
      'bags',
      'cafe',
    ]);
  });
});
