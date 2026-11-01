import { describe, expect, it } from 'vitest';
import {
  countNumberedLines,
  readCodeBlockValue,
  splitTerminalLines,
  splitTokenLines,
} from './code-block-content.js';

describe('splitTerminalLines', () => {
  it('UIC-CODE-BLOCK-3.1 reads command lines after the prompt and output lines', () => {
    expect(splitTerminalLines('$ git status\nOn branch main\n$\n$HOME\n  $ indented', '$')).toEqual(
      [
        { kind: 'command', text: 'git status' },
        { kind: 'output', text: 'On branch main' },
        { kind: 'command', text: '' },
        { kind: 'output', text: '$HOME' },
        { kind: 'output', text: '  $ indented' },
      ],
    );
    expect(splitTerminalLines('PS> dir\nfile.txt', 'PS>')[0]).toEqual({
      kind: 'command',
      text: 'dir',
    });
  });

  it('UIC-CODE-BLOCK-2.1 copies the commands, or the code when there are none', () => {
    const lines = splitTerminalLines('$ npm ci\nok\n$ npm test', '$');
    const commands = lines.filter((line) => line.kind === 'command');
    expect(readCodeBlockValue('$ npm ci\nok\n$ npm test', commands)).toBe('npm ci\nnpm test');
    expect(readCodeBlockValue('ok', [])).toBe('ok');
  });
});

describe('splitTokenLines', () => {
  it('UIC-CODE-BLOCK-1.5 splits tokens at line breaks and keeps their types across lines', () => {
    expect(
      splitTokenLines([
        { text: 'a = ', type: null },
        { text: '"x\ny"', type: 'string' },
        { text: '\n\n', type: null },
        { text: 'b', type: 'name' },
      ]),
    ).toEqual([
      [
        { text: 'a = ', type: null },
        { text: '"x', type: 'string' },
      ],
      [{ text: 'y"', type: 'string' }],
      [],
      [{ text: 'b', type: 'name' }],
    ]);
    expect(splitTokenLines([{ text: '' }])).toEqual([[]]);
  });

  it('UIC-CODE-BLOCK-1.5 leaves the empty line after a final line break unnumbered', () => {
    expect(countNumberedLines('a\nb'.split('\n').length, 'a\nb')).toBe(2);
    expect(countNumberedLines('a\nb\n'.split('\n').length, 'a\nb\n')).toBe(2);
    expect(countNumberedLines('a\n\n'.split('\n').length, 'a\n\n')).toBe(2);
    expect(countNumberedLines(1, '')).toBe(1);
    expect(countNumberedLines(2, '\n')).toBe(1);
  });
});
