import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLineBox } from './read-line-box.js';

function styled(style: Partial<CSSStyleDeclaration>): HTMLElement {
  const element = document.createElement('div');
  Object.assign(element.style, style);
  document.body.append(element);
  return element;
}

afterEach(() => document.body.replaceChildren());

describe('readLineBox (UIC-RICH-TEXT-EDITOR-1.2)', () => {
  it('reads the line height, the padding and, under border-box, the frame', () => {
    const element = styled({
      lineHeight: '20px',
      paddingTop: '4px',
      paddingBottom: '6px',
      borderTopWidth: '1px',
      borderBottomWidth: '1px',
      borderStyle: 'solid',
      boxSizing: 'border-box',
    });
    expect(readLineBox(element)).toEqual({ lineHeight: 20, padding: 10, frame: 12 });
  });

  it('leaves the frame out under content-box', () => {
    const element = styled({ lineHeight: '18px', paddingTop: '4px', paddingBottom: '4px' });
    expect(readLineBox(element)).toEqual({ lineHeight: 18, padding: 8, frame: 0 });
  });

  it('falls back to 1.2 times the font size, then to 16 pixels', () => {
    expect(readLineBox(styled({ fontSize: '10px' }))?.lineHeight).toBe(12);
    expect(readLineBox(styled({}))?.lineHeight).toBe(19.2);
    const unreadable = styled({});
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      ...getComputedStyle(unreadable),
      lineHeight: 'normal',
      fontSize: '',
    } as CSSStyleDeclaration);
    expect(readLineBox(unreadable)?.lineHeight).toBe(16);
  });

  it('is null for an element outside a window', () => {
    const detached = document.implementation.createHTMLDocument().createElement('div');
    expect(readLineBox(detached)).toBeNull();
  });
});
