import { describe, expect, it } from 'vitest';
import { getInitials, getLeadingLetter } from './initials.js';

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

describe('getLeadingLetter', () => {
  it('UIC-INITIALS-2.1 takes the first letter or digit in any script, upper-cased', () => {
    expect(getLeadingLetter('OneDrive')).toBe('O');
    expect(getLeadingLetter('search_recipes')).toBe('S');
    expect(getLeadingLetter('__private.tool')).toBe('P');
    expect(getLeadingLetter('7zip')).toBe('7');
    expect(getLeadingLetter('日本語')).toBe('日');
    expect(getLeadingLetter('жизнь')).toBe('Ж');
    expect(getLeadingLetter('\u{1F4C1} files')).toBe('F');
    expect(getLeadingLetter('éclair')).toBe('É');
    expect(getLeadingLetter('e\u0301clair')).toBe('E\u0301');
    expect(getLeadingLetter('ßtraße')).toBe('ß');
  });

  it('UIC-INITIALS-2.1 returns undefined for a name without a letter or a digit', () => {
    expect(getLeadingLetter('')).toBeUndefined();
    expect(getLeadingLetter('\u{1F680}\u{2728}')).toBeUndefined();
    expect(getLeadingLetter('--')).toBeUndefined();
  });
});
