import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectShortcutPlatform,
  formatAriaKeyShortcuts,
  formatShortcut,
  formatShortcutAccessibleText,
  formatShortcutDescription,
  formatShortcutKeys,
  formatShortcutTooltip,
  type ShortcutChord,
} from './shortcut-format.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shortcut formatting', () => {
  it('UIC-SHORTCUT-1.1 UIC-SHORTCUT-1.2 draws canonical and structured chords in each notation', () => {
    const chords: Array<[ShortcutChord, string, string]> = [
      ['Ctrl+Shift+K', '⇧⌘K', 'Ctrl+Shift+K'],
      ['Shift+Ctrl+Alt+K', '⌥⇧⌘K', 'Ctrl+Alt+Shift+K'],
      ['Ctrl+Ctrl+Shift+K', '⇧⌘K', 'Ctrl+Shift+K'],
      ['Control+Alt+Shift+Meta+K', '⌃⌥⇧⌘K', 'Ctrl+Alt+Shift+Meta+K'],
      ['Cmd+P', '⌘P', 'Meta+P'],
      [{ key: 'K', modifiers: ['primary', 'alt', 'shift'] }, '⌥⇧⌘K', 'Ctrl+Alt+Shift+K'],
      [{ key: 'Delete' }, 'Delete', 'Delete'],
      ['Ctrl++', '⌘+', 'Ctrl++'],
      ['Ctrl+.', '⌘.', 'Ctrl+.'],
      ['Ctrl+,', '⌘,', 'Ctrl+,'],
      ['Ctrl+\\', '⌘\\', 'Ctrl+\\'],
      ['Ctrl + Shift + ↑', '⇧⌘↑', 'Ctrl+Shift+↑'],
      ['Ctrl+Alt+Enter', '⌥⌘Enter', 'Ctrl+Alt+Enter'],
      ['Escape', 'Escape', 'Escape'],
      ['', '', ''],
      ['Ctrl+', '', ''],
    ];
    for (const [chord, mac, other] of chords) {
      expect(formatShortcut(chord, 'mac')).toBe(mac);
      expect(formatShortcut(chord, 'windows')).toBe(other);
      expect(formatShortcut(chord, 'linux')).toBe(other);
    }
  });

  it('UIC-SHORTCUT-1.2 lists the keycaps in display order', () => {
    expect(formatShortcutKeys('Shift+Ctrl+K', 'mac')).toEqual(['⇧', '⌘', 'K']);
    expect(formatShortcutKeys('Shift+Ctrl+K', 'linux')).toEqual(['Ctrl', 'Shift', 'K']);
    expect(formatShortcutKeys('', 'linux')).toEqual([]);
  });

  it('UIC-SHORTCUT-1.3 reads chords as words with named symbol keys', () => {
    expect(formatShortcutAccessibleText('Ctrl+Shift+K', { platform: 'mac' })).toBe(
      'Shift Command K',
    );
    expect(formatShortcutAccessibleText('Control+Alt+K', { platform: 'mac' })).toBe(
      'Control Option K',
    );
    expect(formatShortcutAccessibleText('Ctrl+Alt+Meta+K', { platform: 'windows' })).toBe(
      'Control Alt Meta K',
    );
    expect(formatShortcutAccessibleText('Ctrl+Shift+↑', { platform: 'linux' })).toBe(
      'Control Shift Up Arrow',
    );
    expect(formatShortcutAccessibleText('Ctrl++', { platform: 'linux' })).toBe('Control Plus');
    for (const [key, name] of [
      ['↓', 'Down Arrow'],
      ['←', 'Left Arrow'],
      ['→', 'Right Arrow'],
      ['.', 'Period'],
      [',', 'Comma'],
      ['\\', 'Backslash'],
      [' ', 'Space'],
    ] as const) {
      expect(formatShortcutAccessibleText({ key }, { platform: 'linux' })).toBe(name);
    }
    expect(formatShortcutAccessibleText('', { platform: 'mac' })).toBe('');
  });

  it('UIC-SHORTCUT-1.3 takes replacement key names', () => {
    const names: Record<string, string> = { Command: 'Commande', Shift: 'Maj', '↑': 'Flèche haut' };
    const keyName = (key: string) => names[key] ?? key;
    expect(formatShortcutAccessibleText('Ctrl+Shift+↑', { platform: 'mac', keyName })).toBe(
      'Maj Commande Flèche haut',
    );
    expect(formatShortcutDescription('Monte', 'Ctrl+↑', { platform: 'mac', keyName })).toBe(
      'Monte. Commande Flèche haut',
    );
  });

  it('UIC-SHORTCUT-1.5 formats tooltip and description text around the chord', () => {
    expect(formatShortcutTooltip('Save', 'Ctrl+S', 'mac')).toBe('Save (⌘S)');
    expect(formatShortcutTooltip('Save', 'Ctrl+S', 'linux')).toBe('Save (Ctrl+S)');
    expect(formatShortcutTooltip(undefined, 'Ctrl+S', 'linux')).toBe('Ctrl+S');
    expect(formatShortcutTooltip('Save', undefined, 'linux')).toBe('Save');
    expect(formatShortcutTooltip('Save', '', 'linux')).toBe('Save');
    expect(formatShortcutDescription('Unsaved changes', 'Ctrl+Shift+K', { platform: 'mac' })).toBe(
      'Unsaved changes. Shift Command K',
    );
    expect(formatShortcutDescription(undefined, 'Ctrl+Shift+K', { platform: 'linux' })).toBe(
      'Control Shift K',
    );
    expect(formatShortcutDescription('Unsaved changes', undefined, { platform: 'linux' })).toBe(
      'Unsaved changes',
    );
    expect(
      formatShortcutDescription(undefined, { key: '' }, { platform: 'linux' }),
    ).toBeUndefined();
  });
});

describe('key sequences', () => {
  it('UIC-SHORTCUT-1.7 formats a sequence of chords in each notation and as words', () => {
    expect(formatShortcut(['G', 'I'], 'linux')).toBe('G I');
    expect(formatShortcut(['Ctrl+K', 'Ctrl+C'], 'mac')).toBe('⌘K ⌘C');
    expect(formatShortcut(['Ctrl+K', { key: 'C', modifiers: ['shift'] }], 'windows')).toBe(
      'Ctrl+K Shift+C',
    );
    expect(formatShortcutAccessibleText(['G', 'I'], { platform: 'linux' })).toBe('G, then I');
    expect(formatShortcutAccessibleText(['Ctrl+K', 'Ctrl+C'], { platform: 'mac' })).toBe(
      'Command K, then Command C',
    );
    expect(
      formatShortcutAccessibleText(['G', 'I'], {
        platform: 'linux',
        joinSteps: (previous, next) => `${previous} puis ${next}`,
      }),
    ).toBe('G puis I');
  });

  it('UIC-SHORTCUT-1.7 skips empty chords and reads a one-chord sequence as the chord', () => {
    expect(formatShortcut(['G', '', { key: '' }, 'I'], 'linux')).toBe('G I');
    expect(formatShortcut(['Ctrl+K'], 'linux')).toBe('Ctrl+K');
    expect(formatShortcut([], 'linux')).toBe('');
    expect(formatShortcutAccessibleText(['', 'Ctrl+K'], { platform: 'linux' })).toBe('Control K');
    expect(formatShortcutAccessibleText([], { platform: 'linux' })).toBe('');
  });

  it('UIC-SHORTCUT-1.7 puts sequences in tooltip and description text', () => {
    expect(formatShortcutTooltip('Go to inbox', ['G', 'I'], 'linux')).toBe('Go to inbox (G I)');
    expect(formatShortcutDescription('Opens the inbox', ['G', 'I'], { platform: 'linux' })).toBe(
      'Opens the inbox. G, then I',
    );
  });
});

describe('platform detection', () => {
  it('UIC-SHORTCUT-1.4 prefers the client hint, then the platform, then the user agent', () => {
    const cases: Array<[Parameters<typeof detectShortcutPlatform>[0], string]> = [
      [undefined, 'linux'],
      [{}, 'linux'],
      [{ platform: 'MacIntel' }, 'mac'],
      [{ platform: '', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }, 'mac'],
      [{ platform: 'iPhone' }, 'mac'],
      [{ platform: 'Linux x86_64' }, 'linux'],
      [{ platform: 'Win32' }, 'windows'],
      [{ userAgentData: { platform: 'Windows' }, platform: 'MacIntel' }, 'windows'],
      [{ userAgentData: { platform: '' }, platform: 'MacIntel' }, 'mac'],
    ];
    for (const [source, expected] of cases) {
      expect(detectShortcutPlatform(source)).toBe(expected);
    }
  });

  it('UIC-SHORTCUT-1.4 reads the browser navigator by default and handles a missing one', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(detectShortcutPlatform()).toBe('mac');
    vi.stubGlobal('navigator', undefined);
    expect(detectShortcutPlatform()).toBe('linux');
  });

  it('UIC-SHORTCUT-1.4 detects once, lazily, and never when a platform is given', async () => {
    vi.resetModules();
    const fresh = await import('./shortcut-format.js');
    let reads = 0;
    vi.stubGlobal('navigator', {
      get platform() {
        reads += 1;
        return 'MacIntel';
      },
    });
    expect(reads).toBe(0);
    expect(fresh.formatShortcut('Ctrl+K', 'linux')).toBe('Ctrl+K');
    expect(fresh.formatShortcutAccessibleText('Ctrl+K', { platform: 'windows' })).toBe('Control K');
    expect(reads).toBe(0);
    expect(fresh.formatShortcutTooltip('Open', 'Ctrl+K')).toBe('Open (⌘K)');
    expect(fresh.formatShortcutDescription('Open menu', 'Ctrl+K')).toBe('Open menu. Command K');
    expect(fresh.formatShortcut('Ctrl+C')).toBe('⌘C');
    expect(fresh.formatShortcutKeys('Ctrl+C')).toEqual(['⌘', 'C']);
    expect(fresh.formatShortcutAccessibleText('Ctrl+C')).toBe('Command C');
    expect(fresh.getShortcutPlatform()).toBe('mac');
    expect(reads).toBe(1);
  });
});

describe('aria-keyshortcuts values', () => {
  it('UIC-SHORTCUT-1.6 writes chords as aria-keyshortcuts values for the platform', () => {
    const chords: Array<[ShortcutChord, string, string]> = [
      ['Ctrl+Shift+K', 'Shift+Meta+K', 'Control+Shift+K'],
      ['Shift+Ctrl+Alt+k', 'Alt+Shift+Meta+K', 'Control+Alt+Shift+K'],
      ['Control+Meta+P', 'Control+Meta+P', 'Control+Meta+P'],
      [{ key: 's', modifiers: ['primary'] }, 'Meta+S', 'Control+S'],
      ['Ctrl++', 'Meta+Plus', 'Control+Plus'],
      [{ key: ' ', modifiers: ['shift'] }, 'Shift+Space', 'Shift+Space'],
      ['Alt+↑', 'Alt+ArrowUp', 'Alt+ArrowUp'],
      ['Ctrl+↓', 'Meta+ArrowDown', 'Control+ArrowDown'],
      ['←', 'ArrowLeft', 'ArrowLeft'],
      ['Shift+→', 'Shift+ArrowRight', 'Shift+ArrowRight'],
      ['Ctrl+Enter', 'Meta+Enter', 'Control+Enter'],
      ['F2', 'F2', 'F2'],
      ['Ctrl+.', 'Meta+.', 'Control+.'],
      ['', '', ''],
      ['Ctrl+', '', ''],
    ];
    for (const [chord, mac, other] of chords) {
      expect(formatAriaKeyShortcuts(chord, 'mac')).toBe(mac);
      expect(formatAriaKeyShortcuts(chord, 'windows')).toBe(other);
      expect(formatAriaKeyShortcuts(chord, 'linux')).toBe(other);
    }
  });
});
