import { describe, expect, it } from 'vitest';
import { getInitials } from './initials.js';

describe('getInitials', () => {
  it('UIC-INITIALS-1.1 takes the first and last word initials of a name with several words', () => {
    expect(getInitials('Maria Santos')).toBe('MS');
    expect(getInitials('  maria  de la   santos ')).toBe('MS');
    expect(getInitials('jon berg')).toBe('JB');
  });

  it('UIC-INITIALS-1.1 takes the first two characters of a single word', () => {
    expect(getInitials('plato')).toBe('PL');
    expect(getInitials('Q')).toBe('Q');
    expect(getInitials('  Ines  ')).toBe('IN');
  });

  it('UIC-INITIALS-1.1 returns a question mark for a blank name', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('UIC-INITIALS-1.2 keeps user-perceived characters whole', () => {
    const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
    const wave = '\u{1F44B}\u{1F3FD}';
    expect(getInitials(`${family} Berg`)).toBe(`${family}B`);
    expect(getInitials(`${wave}team`)).toBe(`${wave}T`);
    expect(getInitials('Émilie Durand')).toBe('ÉD');
  });
});
