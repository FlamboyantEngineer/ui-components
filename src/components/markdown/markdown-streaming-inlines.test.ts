import { describe, expect, it } from 'vitest';
import { closeStreamingInlines } from './markdown-streaming-inlines.js';

describe('closeStreamingInlines', () => {
  it('UIC-MARKDOWN-2.11 closes emphasis, strong and strikethrough before trailing spaces', () => {
    expect(closeStreamingInlines('Pack **light')).toBe('Pack **light**');
    expect(closeStreamingInlines('Pack *light ')).toBe('Pack *light* ');
    expect(closeStreamingInlines('Pack __light _and dry')).toBe('Pack __light _and dry___');
    expect(closeStreamingInlines('Old ~~plan')).toBe('Old ~~plan~~');
    expect(closeStreamingInlines('**Done** and *more*')).toBe('**Done** and *more*');
    expect(closeStreamingInlines('Pack **light*')).toBe('Pack **light**');
  });

  it('UIC-MARKDOWN-2.11 drops a marker that nothing follows yet', () => {
    expect(closeStreamingInlines('Pack ')).toBe('Pack ');
    expect(closeStreamingInlines('Pack **')).toBe('Pack ');
    expect(closeStreamingInlines('Pack *light* and _')).toBe('Pack *light* and ');
    expect(closeStreamingInlines('Run `')).toBe('Run ');
  });

  it('UIC-MARKDOWN-2.11 leaves markers inside words, URLs, code and arithmetic alone', () => {
    expect(closeStreamingInlines('Use snake_case names')).toBe('Use snake_case names');
    expect(closeStreamingInlines('See https://example.com/a_b')).toBe(
      'See https://example.com/a_b',
    );
    expect(closeStreamingInlines('Compute 2 * 3 or 2*3')).toBe('Compute 2 * 3 or 2*3');
    expect(closeStreamingInlines('About ~5 km')).toBe('About ~5 km');
    expect(closeStreamingInlines('Escaped \\*star')).toBe('Escaped \\*star');
    expect(closeStreamingInlines('* item **b')).toBe('* item **b**');
  });

  it('UIC-MARKDOWN-2.11 closes a code span, whose content is not read as syntax', () => {
    expect(closeStreamingInlines('Run `npm test')).toBe('Run `npm test`');
    expect(closeStreamingInlines('Run ``a ` b')).toBe('Run ``a ` b``');
    expect(closeStreamingInlines('**Run `a*b')).toBe('**Run `a*b`**');
    expect(closeStreamingInlines('Run `a*b` *now')).toBe('Run `a*b` *now*');
  });

  it('UIC-MARKDOWN-2.11 shows a link being typed as its label and holds back images and autolinks', () => {
    expect(closeStreamingInlines('Read [the gu')).toBe('Read the gu');
    expect(closeStreamingInlines('Read [the guide')).toBe('Read the guide');
    expect(closeStreamingInlines('Read [the guide]')).toBe('Read the guide');
    expect(closeStreamingInlines('Read [the guide](https://exa')).toBe('Read the guide');
    expect(closeStreamingInlines('Read [**the** guide](/g')).toBe('Read **the** guide');
    expect(closeStreamingInlines('Read [the guide](/g) now')).toBe('Read [the guide](/g) now');
    expect(closeStreamingInlines('A map ![Lis')).toBe('A map ');
    expect(closeStreamingInlines('A map ![Lisbon](/m')).toBe('A map ');
    expect(closeStreamingInlines('Visit <https://exam')).toBe('Visit ');
    expect(closeStreamingInlines('Use arr[0] and [docs')).toBe('Use arr[0] and docs');
  });

  it('UIC-MARKDOWN-2.11 keeps citation markers and task markers, holding back a partial one', () => {
    expect(closeStreamingInlines('Sunny all week [1]')).toBe('Sunny all week [1]');
    expect(closeStreamingInlines('Sunny all week [1, 2]')).toBe('Sunny all week [1, 2]');
    expect(closeStreamingInlines('Sunny all week [1')).toBe('Sunny all week ');
    expect(closeStreamingInlines('Sunny [see [1]')).toBe('Sunny see [1]');
    expect(closeStreamingInlines('- [x]')).toBe('- [x]');
  });
});
