import { describe, expect, it } from 'vitest';
import { isTimeFirst, parseAttributionTemplate } from './attribution-template.js';

describe('parseAttributionTemplate', () => {
  it('UIC-ATTRIBUTION-1.1 splits literal text and tokens with their offsets', () => {
    expect(parseAttributionTemplate('Edited {time} by {person}')).toEqual([
      { kind: 'text', text: 'Edited ', offset: 0 },
      { kind: 'time', offset: 7 },
      { kind: 'text', text: ' by ', offset: 13 },
      { kind: 'person', offset: 17 },
    ]);
    expect(parseAttributionTemplate('{person}, {time}.')).toEqual([
      { kind: 'person', offset: 0 },
      { kind: 'text', text: ', ', offset: 8 },
      { kind: 'time', offset: 10 },
      { kind: 'text', text: '.', offset: 16 },
    ]);
    expect(parseAttributionTemplate('{when} {{time}}')).toEqual([
      { kind: 'text', text: '{when} {', offset: 0 },
      { kind: 'time', offset: 8 },
      { kind: 'text', text: '}', offset: 14 },
    ]);
    expect(parseAttributionTemplate('')).toEqual([]);
  });

  it('UIC-ATTRIBUTION-1.2 knows when the time starts the sentence', () => {
    expect(isTimeFirst(parseAttributionTemplate('{time} by {person}'))).toBe(true);
    expect(isTimeFirst(parseAttributionTemplate('  {time}'))).toBe(true);
    expect(isTimeFirst(parseAttributionTemplate('Edited {time}'))).toBe(false);
    expect(isTimeFirst(parseAttributionTemplate('{person} {time}'))).toBe(false);
    expect(isTimeFirst(parseAttributionTemplate('No time'))).toBe(true);
  });
});
