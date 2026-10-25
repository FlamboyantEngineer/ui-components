import { describe, expect, it } from 'vitest';
import { readCodeBlockValue, splitTerminalLines } from './code-block-content.js';

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
