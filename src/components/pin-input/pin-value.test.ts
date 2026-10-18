import { describe, expect, it } from 'vitest';
import {
  filterPinCharacters,
  findActivePinCell,
  readEnteredText,
  writePinCharacters,
} from './pin-value.js';

describe('pin value', () => {
  it('UIC-PIN-INPUT-1.3 keeps only the characters a cell type takes', () => {
    expect(filterPinCharacters('12-ab 3Z', 'numeric')).toBe('123');
    expect(filterPinCharacters('12-ab 3Z', 'alphanumeric')).toBe('12ab3Z');
    expect(filterPinCharacters('12-ab 3Z', 'alphabetic')).toBe('abZ');
    expect(filterPinCharacters('é٣', 'alphanumeric')).toBe('');
  });

  it('UIC-PIN-INPUT-2.1 UIC-PIN-INPUT-2.4 writes over the cells from one on, within the length', () => {
    expect(writePinCharacters('', { index: 0, characters: '7', length: 4 })).toBe('7');
    expect(writePinCharacters('1234', { index: 1, characters: '9', length: 4 })).toBe('1934');
    expect(writePinCharacters('123456', { index: 2, characters: '99', length: 6 })).toBe('129956');
    expect(writePinCharacters('12', { index: 2, characters: '345678', length: 4 })).toBe('1234');
  });

  it('UIC-PIN-INPUT-2.1 UIC-PIN-INPUT-1.5 reads the character typed beside an old one, and autofill whole', () => {
    expect(readEnteredText('5', '')).toBe('5');
    expect(readEnteredText('15', '1')).toBe('5');
    expect(readEnteredText('51', '1')).toBe('5');
    expect(readEnteredText('11', '1')).toBe('1');
    expect(readEnteredText('5', '1')).toBe('5');
    expect(readEnteredText('123456', '')).toBe('123456');
    expect(readEnteredText('123456', '1')).toBe('123456');
  });

  it('UIC-PIN-INPUT-2.3 finds the cell that takes the next character', () => {
    expect(findActivePinCell('', 4)).toBe(0);
    expect(findActivePinCell('12', 4)).toBe(2);
    expect(findActivePinCell('1234', 4)).toBe(3);
    expect(findActivePinCell('123456', 4)).toBe(3);
  });
});
