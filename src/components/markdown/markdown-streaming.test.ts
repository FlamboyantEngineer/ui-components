import { describe, expect, it } from 'vitest';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';

const prepare = prepareStreamingMarkdown;

describe('prepareStreamingMarkdown', () => {
  it('UIC-MARKDOWN-2.11 shows an unclosed fence as code and holds back a partial closing fence', () => {
    expect(prepare('Run:\n\n```sh\nnpm test')).toBe('Run:\n\n```sh\nnpm test');
    expect(prepare('```sh\nnpm *test')).toBe('```sh\nnpm *test');
    expect(prepare('```sh\nnpm test\n``')).toBe('```sh\nnpm test');
    expect(prepare('~~~~\ncode\n~~~')).toBe('~~~~\ncode');
    expect(prepare('- step\n\n  ```js\n  run()\n  `')).toBe('- step\n\n  ```js\n  run()');
    const [block] = parseMarkdown(prepare('```py\nprint(1)\n``')).children;
    expect(block).toEqual({ type: 'codeBlock', language: 'py', text: 'print(1)' });
  });

  it('UIC-MARKDOWN-2.11 holds back a last line that cannot be read yet', () => {
    expect(prepare('Intro\n```py')).toBe('Intro');
    expect(prepare('Intro\n``')).toBe('Intro');
    expect(prepare('A paragraph\n-')).toBe('A paragraph');
    expect(prepare('A paragraph\n==')).toBe('A paragraph');
    expect(prepare('- one\n- ')).toBe('- one');
    expect(prepare('1. one\n2.')).toBe('1. one');
    expect(prepare('Text\n\n##')).toBe('Text\n');
    expect(prepare('Text\n\n> ')).toBe('Text\n');
    expect(prepare('Done.\n')).toBe('Done.');
    expect(prepare('## Inst')).toBe('## Inst');
  });

  it('UIC-MARKDOWN-2.11 holds back a partial table row and a header without its divider', () => {
    const table = '| City | Days |\n|---|--:|\n| Lisbon | 3 |';
    expect(prepare(`${table}\n| Porto | 2`)).toBe(table);
    expect(prepare(`${table}\n`)).toBe(table);
    expect(prepare('Plan:\n\n| City | Days |\n|---|-')).toBe('Plan:\n');
    expect(prepare('Plan:\n\n| City | Days |\n')).toBe('Plan:\n');
    expect(prepare('| City')).toBe('');
  });

  it('UIC-MARKDOWN-2.11 closes the inline syntax of the last paragraph only', () => {
    expect(prepare('First **bold**.\n\nThen **more')).toBe('First **bold**.\n\nThen **more**');
    expect(prepare('- one **a\n- two *b')).toBe('- one **a\n- two *b*');
    expect(prepare('Some *text\n\n    indented *code')).toBe('Some *text\n\n    indented *code');
  });
});
