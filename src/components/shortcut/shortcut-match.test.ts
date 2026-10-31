import { describe, expect, it } from 'vitest';
import { isChordPress, matchesChord } from './shortcut-match.js';

type Press = Partial<Omit<KeyboardEvent, 'getModifierState'>> & { altGraph?: boolean };

/** A key press with no modifier held unless given; `altGraph` reports AltGr held. */
function press({ altGraph = false, ...init }: Press): KeyboardEvent {
  return {
    key: '',
    code: '',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    repeat: false,
    isComposing: false,
    getModifierState: (modifier: string) => modifier === 'AltGraph' && altGraph,
    ...init,
  } as KeyboardEvent;
}

describe('matchesChord', () => {
  it('UIC-SHORTCUT-1.8 matches a non-Latin letter as typed and as the key in its place', () => {
    const cyrillic = press({ key: 'я', code: 'KeyZ', ctrlKey: true });
    expect(matchesChord(cyrillic, { key: 'я', modifiers: ['control'] })).toBe(true);
    expect(matchesChord(cyrillic, 'Control+Я')).toBe(true);
    expect(matchesChord(cyrillic, 'Control+Z')).toBe(true);
    expect(matchesChord(cyrillic, 'Control+X')).toBe(false);
    const greek = press({ key: 'λ', code: 'KeyL', altKey: true });
    expect(matchesChord(greek, 'Alt+λ')).toBe(true);
    expect(matchesChord(greek, 'Alt+L')).toBe(true);
  });

  it('UIC-SHORTCUT-1.8 reads a Latin letter a layout moved only as the letter it types', () => {
    const azerty = press({ key: 'a', code: 'KeyQ', ctrlKey: true });
    expect(matchesChord(azerty, { key: 'a', modifiers: ['control'] })).toBe(true);
    expect(matchesChord(azerty, { key: 'q', modifiers: ['control'] })).toBe(false);
  });

  it('UIC-SHORTCUT-1.8 matches shifted symbols and Option characters by their key and modifiers', () => {
    const bang = press({ key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true });
    expect(matchesChord(bang, { key: '1', modifiers: ['control', 'shift'] })).toBe(true);
    expect(matchesChord(bang, { key: '!', modifiers: ['control', 'shift'] })).toBe(true);
    expect(matchesChord(bang, { key: '!', modifiers: ['control'] })).toBe(false);
    const question = press({ key: '?', code: 'Slash', ctrlKey: true, shiftKey: true });
    expect(matchesChord(question, { key: '?', modifiers: ['control', 'shift'] })).toBe(true);
    const pi = press({ key: 'π', code: 'KeyP', altKey: true });
    expect(matchesChord(pi, 'Alt+P')).toBe(true);
    expect(matchesChord(pi, 'P')).toBe(false);
  });

  it('UIC-SHORTCUT-1.8 never reads AltGr typing a character as Control+Alt', () => {
    const at = press({ key: '@', code: 'KeyQ', ctrlKey: true, altKey: true, altGraph: true });
    expect(matchesChord(at, { key: 'q', modifiers: ['control', 'alt'] })).toBe(false);
    expect(matchesChord(at, { key: '@', modifiers: ['control', 'alt'] })).toBe(false);
    // Control+Alt on a key AltGr types nothing on still matches, as does a press without AltGr.
    const letter = press({ key: 'q', code: 'KeyQ', ctrlKey: true, altKey: true, altGraph: true });
    expect(matchesChord(letter, { key: 'q', modifiers: ['control', 'alt'] })).toBe(true);
    const plain = press({ key: '@', code: 'KeyQ', ctrlKey: true, altKey: true });
    expect(matchesChord(plain, { key: 'q', modifiers: ['control', 'alt'] })).toBe(true);
  });

  it('UIC-SHORTCUT-1.8 tells the explicit Control key from the platform primary modifier', () => {
    const control = press({ key: 'k', code: 'KeyK', ctrlKey: true });
    const meta = press({ key: 'k', code: 'KeyK', metaKey: true });
    expect(matchesChord(control, { key: 'k', modifiers: ['control'] })).toBe(true);
    expect(matchesChord(meta, { key: 'k', modifiers: ['control'] })).toBe(false);
    expect(matchesChord(meta, { key: 'k', modifiers: ['meta'] })).toBe(true);
    expect(matchesChord(press({ key: 'k', ctrlKey: true, shiftKey: true }), 'Control+K')).toBe(
      false,
    );
  });

  it('UIC-SHORTCUT-1.8 never matches a repeat or a composing key press', () => {
    const chord = { key: 'я', modifiers: ['control'] } as const;
    expect(isChordPress(press({ key: 'я', code: 'KeyZ', ctrlKey: true }), chord)).toBe(true);
    expect(isChordPress(press({ key: 'я', ctrlKey: true, repeat: true }), chord)).toBe(false);
    expect(isChordPress(press({ key: 'я', ctrlKey: true, isComposing: true }), chord)).toBe(false);
  });
});
