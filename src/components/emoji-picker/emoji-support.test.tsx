import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEmojiData } from './emoji-catalog.js';
import { EmojiPicker } from './emoji-picker.js';
import { detectEmojiSupport } from './emoji-support.js';

/** How a fake platform draws a glyph. */
type Drawing = 'colour' | 'letters' | 'blank' | 'parts';

const meltingFace = '\u{1FAE0}';
const distortedFace = '\u{1FAEA}';
const shakingFace = '\u{1FAE8}';
const headShaking = '\u{1F642}‍↔️';
const flag = '\u{1F1EB}\u{1F1F7}';

/** Stubs `OffscreenCanvas` with a platform that draws each glyph as `draw` says. */
function stubPlatform(draw: (glyph: string) => Drawing) {
  const fonts: string[] = [];
  const context = {
    font: '',
    textBaseline: '',
    fillStyle: '',
    glyph: '',
    clearRect() {},
    fillText(glyph: string) {
      this.glyph = glyph;
      fonts.push(this.font);
    },
    getImageData() {
      const drawing = draw(this.glyph);
      if (drawing === 'blank') return { data: new Uint8ClampedArray(4) };
      if (drawing === 'letters') {
        const red = this.fillStyle === '#ff0000';
        return { data: Uint8ClampedArray.from([red ? 255 : 0, 0, red ? 0 : 255, 255]) };
      }
      return { data: Uint8ClampedArray.from([200, 120, 40, 255]) };
    },
    measureText(glyph: string) {
      return { width: draw(glyph) === 'parts' ? 32 : 16 };
    },
  };
  const constructed = vi.fn();
  function FakeCanvas(width: number, height: number) {
    constructed(width, height);
    return { getContext: () => context };
  }
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  return { fonts, constructed };
}

const fixture = parseEmojiData(
  [
    'smileys',
    '😀||grinning face|grinning|happy|1',
    `${meltingFace}||melting face|melting_face|sarcasm|14`,
    'flags',
    '🏁||chequered flag|checkered_flag|race|0.6',
    '🇯🇵||flag: Japan|jp|flag|2',
  ].join('\n'),
);
const loadFixture = () => Promise.resolve(fixture);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('emoji support', { timeout: 15_000 }, () => {
  it('UIC-EMOJI-PICKER-5.1 finds the newest version drawn as one colour emoji and the flags', () => {
    const { fonts, constructed } = stubPlatform((glyph) => {
      if (glyph === distortedFace) return 'blank';
      if (glyph === '\u{1FAE9}') return 'letters';
      if (glyph === headShaking) return 'parts';
      return glyph === flag ? 'letters' : 'colour';
    });
    const support = detectEmojiSupport('Inter');
    expect(support).toEqual({ version: 15, countryFlags: false });
    expect(fonts.every((font) => font === '16px Inter')).toBe(true);
    expect(detectEmojiSupport('Inter')).toBe(support);
    expect(constructed).toHaveBeenCalledTimes(1);
  });

  it('UIC-EMOJI-PICKER-5.1 cannot tell without a colour emoji font or a canvas', () => {
    stubPlatform(() => 'letters');
    expect(detectEmojiSupport('Plain')).toEqual({ version: undefined, countryFlags: true });
    stubPlatform((glyph) => ([shakingFace, '\u{1F600}'].includes(glyph) ? 'colour' : 'parts'));
    expect(detectEmojiSupport('Partial')).toEqual({ version: 15, countryFlags: false });
    vi.stubGlobal('OffscreenCanvas', function NoContext() {
      return { getContext: () => null };
    });
    expect(detectEmojiSupport('No context')).toEqual({ version: undefined, countryFlags: true });
    vi.unstubAllGlobals();
    vi.stubGlobal('OffscreenCanvas', undefined);
    expect(detectEmojiSupport('Inter')).toEqual({ version: undefined, countryFlags: true });
  });

  it('UIC-EMOJI-PICKER-5.1 UIC-EMOJI-PICKER-5.2 leaves out what the platform cannot draw', async () => {
    const user = userEvent.setup();
    // A platform that draws Emoji 13.1 and no country flags.
    stubPlatform((glyph) =>
      glyph === flag || (glyph.codePointAt(0) ?? 0) >= 0x1fae0 || glyph === headShaking
        ? 'letters'
        : 'colour',
    );
    const { rerender } = render(<EmojiPicker loadEmoji={loadFixture} />);
    await user.click(await screen.findByRole('tab', { name: 'Flags' }));
    const flags = screen.getByRole('grid', { name: 'Flags' });
    expect(
      within(flags)
        .getAllByRole('row')
        .map((row) => row.getAttribute('aria-label')),
    ).toEqual(['chequered flag']);
    await user.type(screen.getByRole('searchbox'), 'melting');
    expect(screen.getByRole('status')).toHaveTextContent('No results');

    rerender(<EmojiPicker loadEmoji={loadFixture} emojiVersion={14} />);
    expect(await screen.findByRole('row', { name: 'melting face' })).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'flag');
    expect(screen.queryByRole('row', { name: 'flag: Japan' })).not.toBeInTheDocument();

    rerender(<EmojiPicker loadEmoji={loadFixture} renderEmoji={(unicode) => unicode} />);
    expect(await screen.findByRole('row', { name: 'flag: Japan' })).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'melting');
    expect(screen.getByRole('row', { name: 'melting face' })).toBeInTheDocument();
  });
});
