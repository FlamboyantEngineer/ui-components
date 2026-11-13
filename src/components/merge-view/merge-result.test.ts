import { describe, expect, it } from 'vitest';
import { getMergeViewResult } from './merge-result.js';

const markers = { ours: 'Ours', theirs: 'Theirs' };

describe('merge view result', () => {
  it('UIC-MERGE-VIEW-2.5 reports a merge that needs no action before any change', () => {
    expect(
      getMergeViewResult({
        base: 'flour\nsugar\nsalt\n',
        ours: 'flour\nbrown sugar\nsalt\n',
        theirs: 'flour\nsugar\nsea salt\n',
        markers,
      }),
    ).toEqual({ text: 'flour\nbrown sugar\nsea salt\n', resolutions: [], unresolved: 0 });
  });

  it('UIC-MERGE-VIEW-2.5 reports each conflict unresolved, between markers, before any change', () => {
    expect(
      getMergeViewResult({ base: 'milk', ours: 'oat milk', theirs: 'cream', markers }),
    ).toEqual({
      text: '<<<<<<< Ours\noat milk\n=======\ncream\n>>>>>>> Theirs',
      resolutions: ['unresolved'],
      unresolved: 1,
    });
  });

  it('UIC-MERGE-VIEW-2.5 writes the line breaks our text uses', () => {
    const result = getMergeViewResult({
      base: 'flour\r\nsugar\r\nsalt\r\n',
      ours: 'flour\r\nbrown sugar\r\nsalt\r\n',
      theirs: 'flour\r\nsugar\r\nsea salt\r\n',
      markers,
    });
    expect(result.text).toBe('flour\r\nbrown sugar\r\nsea salt\r\n');
  });
});
