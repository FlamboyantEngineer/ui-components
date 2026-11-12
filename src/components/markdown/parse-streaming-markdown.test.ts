import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { prepareStreamingMarkdown } from './markdown-streaming.js';
import { parseMarkdown } from './parse-markdown.js';
import { parseStreamingMarkdown, type StreamingMarkdownParse } from './parse-streaming-markdown.js';

const reply = [
  '## Install',
  '',
  'Run the **installer** and follow the `prompts`.',
  '',
  '- Download the package',
  '- Open it',
  '',
  '  Then restart.',
  '',
  'After the list.',
  '',
  '```py',
  'print(1)',
  '',
  'value = 2',
  '```',
  '',
  '| City | Trains |',
  '|---|---|',
  '| Lisbon | 12 |',
  '',
  '> A quote',
  'that continues lazily.',
  '',
  '    indented code',
  '',
  'Setext heading',
  '===',
  '',
  '## Install',
  '',
  'Done.',
].join('\n');

/** Every prefix of `source`, parsed as a stream parses it. */
function streamPrefixes(source: string): Array<{ prefix: string; parse: StreamingMarkdownParse }> {
  const parses: Array<{ prefix: string; parse: StreamingMarkdownParse }> = [];
  let previous: StreamingMarkdownParse | null = null;
  for (let end = 1; end <= source.length; end += 1) {
    const prefix = prepareStreamingMarkdown(source.slice(0, end));
    previous = parseStreamingMarkdown(prefix, previous);
    parses.push({ prefix, parse: previous });
  }
  return parses;
}

describe('parseStreamingMarkdown', () => {
  it('UIC-MARKDOWN-2.13 equals a whole parse of the prepared source at every chunk', () => {
    for (const { prefix, parse } of streamPrefixes(reply)) {
      expect(parse.document).toEqual(parseMarkdown(prefix));
    }
  });

  it('UIC-MARKDOWN-2.13 keeps the settled blocks as they were parsed', () => {
    const parses = streamPrefixes(reply).map(({ parse }) => parse);
    const last = requireDefined(parses.at(-1));
    expect(last.settled.length).toBeGreaterThan(reply.length / 2);
    const heading = last.document.children[0];
    const from = parses.findIndex((parse) => parse.settledBlocks[0] === heading);
    expect(from).toBeGreaterThan(0);
    // From the chunk that settled it on, the heading is the same object.
    for (const parse of parses.slice(from)) expect(parse.document.children[0]).toBe(heading);
  });

  it('UIC-MARKDOWN-2.13 gives a heading after the settled point an id the settled ones do not hold', () => {
    const parse = parseStreamingMarkdown('## Install\n\nText\n\n## Install\n\nMore', null);
    expect(parse.settledHeadingIds).toEqual(['install']);
    expect(
      parse.document.children.flatMap((block) => (block.type === 'heading' ? [block.id] : [])),
    ).toEqual(['install', 'install-2']);
  });

  it('UIC-MARKDOWN-2.13 does not settle a piece that leaves a fence open', () => {
    const source = '1. Run:\n   ```sh\n   npm i\n\nText\n```\n\nStill code\n\nMore\n';
    const parse = parseStreamingMarkdown(source, null);
    expect(parse.document).toEqual(parseMarkdown(source));
    // The list item's fence closes at `Text`, and the fence after it takes the rest.
    expect(parse.settled).toBe('');
  });

  it('UIC-MARKDOWN-2.13 parses a source with a link definition whole', () => {
    const settled = parseStreamingMarkdown('Text\n\nSee [docs].\n\nMore', null);
    expect(settled.settled).not.toBe('');
    const defined = parseStreamingMarkdown('Text\n\nSee [docs].\n\n[docs]: /docs\n\nMore', settled);
    expect(defined.settled).toBe('');
    expect(defined.document).toEqual(parseMarkdown('Text\n\nSee [docs].\n\n[docs]: /docs\n\nMore'));
    const quoted = '> Text\n\n> [docs]: /docs\n\nMore';
    expect(parseStreamingMarkdown(quoted, null).settled).toBe('');
    const listed = '- Text\n\n- [docs]: /docs\n\nMore';
    expect(parseStreamingMarkdown(listed, null).settled).toBe('');
  });

  it('UIC-MARKDOWN-2.13 keeps settling text that only contains a bracket and a colon', () => {
    const source = 'Text\n\n```py\nif x[0]:\n    pass\n```\n\nSee items[1]: two\n\nMore';
    const parse = parseStreamingMarkdown(source, null);
    expect(parse.settled).not.toBe('');
    expect(parse.document).toEqual(parseMarkdown(source));
  });

  it('UIC-MARKDOWN-2.13 reads carriage returns as line ends and keeps settling', () => {
    const windows = reply.replaceAll('\n', '\r\n');
    let previous: StreamingMarkdownParse | null = null;
    for (let end = 1; end <= windows.length; end += 7) {
      const prefix = prepareStreamingMarkdown(windows.slice(0, end));
      previous = parseStreamingMarkdown(prefix, previous);
      expect(previous.document).toEqual(parseMarkdown(prefix));
    }
    expect(requireDefined(previous).settled).not.toBe('');
  });

  it('UIC-MARKDOWN-2.13 starts over for a source that does not continue the previous one', () => {
    const first = parseStreamingMarkdown('Lisbon\n\nPorto\n', null);
    const next = parseStreamingMarkdown('Madrid\n\nSeville\n', first);
    expect(next.document).toEqual(parseMarkdown('Madrid\n\nSeville\n'));
  });
});
