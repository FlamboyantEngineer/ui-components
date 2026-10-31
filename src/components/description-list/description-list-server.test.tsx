// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderInDistantZones } from '../../../test/time-zones.js';
import { DescriptionList, DescriptionRow } from './description-list.js';

describe('DescriptionList on the server', () => {
  it('UIC-DESCRIPTION-LIST-1.5 dates an instant alike whatever the server zone', () => {
    const [utc, kiritimati] = renderInDistantZones(() => (
      <DescriptionList>
        <DescriptionRow label="Shipped" value="2026-10-30T13:30:00Z" />
      </DescriptionList>
    ));
    expect(kiritimati).toBe(utc);
    expect(utc).toContain('Oct 30, 2026');
  });
});
