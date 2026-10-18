import { describe, expect, it } from 'vitest';
import { collectGroupKeys, flattenTimelineRows, type TimelineRow } from './timeline-rows.js';

const rows: TimelineRow[] = [
  {
    id: 'plan',
    label: 'Planning',
    children: [
      { id: 'survey', label: 'Survey' },
      { id: 'design', label: 'Design', children: [{ id: 'sketch', label: 'Sketches' }] },
    ],
  },
  { id: 'build', label: 'Build', children: [] },
];

describe('timeline rows', () => {
  it('UIC-TIMELINE-1.4 flattens rows in order with their depth and group state', () => {
    expect(
      flattenTimelineRows(rows).map(({ row, level, hasChildren, isExpanded }) => [
        row.id,
        level,
        hasChildren,
        isExpanded,
      ]),
    ).toEqual([
      ['plan', 1, true, true],
      ['survey', 2, false, false],
      ['design', 2, true, true],
      ['sketch', 3, false, false],
      ['build', 1, false, false],
    ]);
    expect(collectGroupKeys(rows)).toEqual(['plan', 'design']);
  });

  it('UIC-TIMELINE-1.4 hides the descendants of collapsed groups', () => {
    expect(flattenTimelineRows(rows, new Set(['plan'])).map(({ row }) => row.id)).toEqual([
      'plan',
      'survey',
      'design',
      'build',
    ]);
    expect(flattenTimelineRows(rows, new Set(['design'])).map(({ row }) => row.id)).toEqual([
      'plan',
      'build',
    ]);
  });
});
