import { describe, expect, it } from 'vitest';
import { formatToolName, formatToolValue } from './format-tool-call.js';

describe('formatToolName', () => {
  it('UIC-CHAT-TOOL-CALL-1.2 reads snake, kebab, dotted and camel case names as a sentence', () => {
    expect(formatToolName('search_recipes')).toBe('Search recipes');
    expect(formatToolName('searchRecipes')).toBe('Search recipes');
    expect(formatToolName('files.read-text')).toBe('Files read text');
    expect(formatToolName('calendar/listEvents:today')).toBe('Calendar list events today');
    expect(formatToolName('  run tests ')).toBe('Run tests');
  });

  it('UIC-CHAT-TOOL-CALL-1.2 keeps words in capitals and names without words', () => {
    expect(formatToolName('get_HTTP_status')).toBe('Get HTTP status');
    expect(formatToolName('parseJSONFile')).toBe('Parse JSON file');
    expect(formatToolName('__')).toBe('__');
    expect(formatToolName('')).toBe('');
  });
});

describe('formatToolValue', () => {
  it('UIC-CHAT-TOOL-CALL-2.1 writes values as JSON indented by two spaces', () => {
    expect(formatToolValue({ city: 'Porto', days: [1, 2] })).toBe(
      '{\n  "city": "Porto",\n  "days": [\n    1,\n    2\n  ]\n}',
    );
    expect(formatToolValue(42)).toBe('42');
    expect(formatToolValue(null)).toBe('null');
    expect(formatToolValue(10n)).toBe('"10"');
  });

  it('UIC-CHAT-TOOL-CALL-2.1 re-indents JSON text and keeps other strings as given', () => {
    expect(formatToolValue(' {"ok":true} ')).toBe('{\n  "ok": true\n}');
    expect(formatToolValue('[1]')).toBe('[\n  1\n]');
    expect(formatToolValue('{not json')).toBe('{not json');
    expect(formatToolValue('Sunny, 24 degrees')).toBe('Sunny, 24 degrees');
  });

  it('UIC-CHAT-TOOL-CALL-2.1 keeps every literal of JSON text as written while re-indenting', () => {
    expect(formatToolValue('{"id": 12345678901234567890}')).toBe(
      '{\n  "id": 12345678901234567890\n}',
    );
    expect(formatToolValue('[1.0,-0,1e2,2E-3]')).toBe('[\n  1.0,\n  -0,\n  1e2,\n  2E-3\n]');
    expect(formatToolValue('{"a":1,"a":2}')).toBe('{\n  "a": 1,\n  "a": 2\n}');
    expect(formatToolValue('{"text":"\\u0041 \\/"}')).toBe('{\n  "text": "\\u0041 \\/"\n}');
    expect(formatToolValue('{"empty":{},"none":[]}')).toBe('{\n  "empty": {},\n  "none": []\n}');
    expect(formatToolValue('[1,]')).toBe('[1,]');
    expect(formatToolValue('{"a":1} trailing')).toBe('{"a":1} trailing');
  });

  it('UIC-CHAT-TOOL-CALL-2.1 falls back to String for values JSON cannot hold', () => {
    const cycle: Record<string, unknown> = { name: 'loop' };
    cycle.self = cycle;
    expect(formatToolValue(cycle)).toBe('[object Object]');
    const action = () => 1;
    expect(formatToolValue(action)).toBe(String(action));
  });
});
