// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderInDistantZones } from '../../../test/time-zones.js';
import { VersionHistory } from './version-history.js';

describe('VersionHistory on the server', () => {
  it('UIC-VERSION-HISTORY-1.2 titles an unnamed version alike whatever the server zone', () => {
    const versions = [{ id: 'v1', time: '2026-10-30T13:30:00Z' }];
    const [utc, kiritimati] = renderInDistantZones(() => (
      <VersionHistory versions={versions} getNow={() => new Date('2026-10-31T01:00:00Z')} />
    ));
    expect(kiritimati).toBe(utc);
    expect(utc).toContain('Oct 30, 2026');
  });
});
