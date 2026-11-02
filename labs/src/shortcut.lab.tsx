import { useState, type KeyboardEvent } from 'react';
import {
  KeyHints,
  Shortcut,
  ShortcutAppearanceContext,
  matchesChord,
  type ShortcutAppearance,
} from '../../src/components/shortcut/shortcut.js';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import { MoreGlyph, UndoGlyph } from '../../src/core/glyphs.js';
import {
  detectShortcutPlatform,
  formatShortcut,
  formatAriaKeyShortcuts,
  formatShortcutAccessibleText,
  formatShortcutDescription,
  formatShortcutKeys,
  formatShortcutTooltip,
  getShortcutPlatform,
} from '../../src/components/shortcut/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabHelperCalls } from './lab-helper-calls.js';

const platforms = ['mac', 'windows', 'linux'] as const;
const chords = [
  'Ctrl+K',
  'Ctrl+Shift+K',
  'Control+Alt+Shift+Meta+K',
  'Ctrl++',
  'Ctrl + Shift + ↑',
  'Ctrl+Alt+Enter',
  'Escape',
] as const;
const legend = [
  { keys: ['↑', '↓'], action: 'move' },
  { keys: ['Enter'], action: 'select' },
  { keys: ['Escape'], action: 'close' },
];
const sequences = {
  'G I': ['G', 'I'],
  'Ctrl+K Ctrl+C': ['Ctrl+K', 'Ctrl+C'],
  'Ctrl+K Shift+↑': ['Ctrl+K', 'Shift+↑'],
} as const;

/** French names for the keys the lab's samples use; the rest read as written. */
const frenchKeys: Readonly<Record<string, string>> = {
  Control: 'Contrôle',
  Shift: 'Maj',
  '↑': 'Flèche haut',
  Enter: 'Entrée',
};
const frenchKeyName = (key: string) => frenchKeys[key] ?? key;
const ariaSamples = [
  ['Ctrl+S', 'mac'],
  ['Ctrl+S', 'windows'],
  ['Alt+Shift+↑', 'linux'],
  ['Ctrl++', 'windows'],
  ['Ctrl+Alt+Space', 'mac'],
] as const;

const appearances = ['keycaps', 'text'] as const satisfies readonly ShortcutAppearance[];
const samples = ['Ctrl+Shift+K', 'Ctrl++', ['G', 'I'], ['Ctrl+K', 'Ctrl+C']] as const;

/** A menu and a button tooltip whose shortcuts take the appearance of the context around them. */
function ComposedShortcuts({ appearance }: { appearance: ShortcutAppearance }) {
  return (
    <ShortcutAppearanceContext value={appearance}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <MenuTrigger>
          <Button icon={MoreGlyph} label={`Edit (${appearance})`} variant="secondary" />
          <MenuPopover>
            <Menu aria-label={`Edit actions (${appearance})`}>
              <MenuItem id="cut" shortcut="Ctrl+X">
                Cut
              </MenuItem>
              <MenuItem id="copy" shortcut="Ctrl+C">
                Copy
              </MenuItem>
              <MenuItem id="go" shortcut={['G', 'I']}>
                Go to inbox
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <Button
          icon={UndoGlyph}
          label={`Undo (${appearance})`}
          tooltip="Undo"
          shortcut="Ctrl+Z"
          variant="secondary"
        />
        <KeyHints hints={legend} platform="linux" />
      </div>
    </ShortcutAppearanceContext>
  );
}

const tried = ['Control+Я', 'Control+Z', 'Control+Alt+Q', 'Ctrl+Shift+1'] as const;

/** Names the chords a key press in the field matches, as a command would read them. */
function ChordTester() {
  const [matched, setMatched] = useState('Press a chord in the field');
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['Control', 'Alt', 'Shift', 'Meta', 'AltGraph'].includes(event.key)) return;
    const hits = tried.filter((chord) => matchesChord(event.nativeEvent, chord));
    setMatched(hits.length > 0 ? hits.join(', ') : 'No chord');
  };
  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <label>
        Chord field <input type="text" onKeyDown={onKeyDown} />
      </label>
      <p>
        Watching{' '}
        {tried.map((chord) => (
          <span key={chord}>
            <Shortcut chord={chord} />{' '}
          </span>
        ))}
      </p>
      <output data-lab-output="chord">{matched}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Notation"
      description="Each canonical chord in each platform's notation. Ctrl is Command on macOS; Control is always the Control key."
    >
      <StateMatrix
        axes={{ chord: chords, platform: platforms }}
        render={({ chord, platform }) => <Shortcut chord={chord} platform={platform} />}
      />
    </LabSection>
    <LabSection
      title="Appearance"
      description="Keycaps box each key; text draws the same notation as quiet inline text, with no key boxes. Chords, the literal plus key and sequences keep their platform notation and their separators."
    >
      <StateMatrix
        axes={{ appearance: appearances, platform: platforms }}
        render={({ appearance, platform }) => (
          <span style={{ display: 'inline-flex', gap: 16 }}>
            {samples.map((chord) => (
              <Shortcut
                key={String(chord)}
                chord={chord}
                platform={platform}
                appearance={appearance}
              />
            ))}
          </span>
        )}
      />
    </LabSection>
    <LabSection
      title="Appearance of composed shortcuts"
      description="ShortcutAppearanceContext sets the appearance of the shortcuts inside it that set none: a menu item's, a button tooltip's (hover or focus Undo) and a key legend's."
    >
      <StateMatrix
        axes={{ appearance: appearances }}
        render={({ appearance }) => <ComposedShortcuts appearance={appearance} />}
      />
    </LabSection>
    <LabSection
      title="Readable text"
      description="Readable shortcuts carry visually hidden words for screen readers; decorative ones draw only the keycaps."
    >
      <StateMatrix
        axes={{ text: ['readable', 'decorative'], platform: platforms }}
        render={({ text, platform }) => (
          <Shortcut chord="Ctrl+Shift+K" platform={platform} decorative={text === 'decorative'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Key sequences"
      description="Chords pressed one after another, drawn chord by chord and read as G, then I."
    >
      <StateMatrix
        axes={{
          sequence: Object.keys(sequences) as Array<keyof typeof sequences>,
          platform: platforms,
        }}
        render={({ sequence, platform }) => (
          <Shortcut chord={sequences[sequence]} platform={platform} />
        )}
      />
      <p data-lab-sequence-hints>
        <KeyHints
          hints={[
            { keys: [sequences['G I']], action: 'go to inbox' },
            { keys: [['G', 'S']], action: 'go to starred' },
          ]}
          platform="linux"
        />
      </p>
    </LabSection>
    <LabSection title="Key legends" description="Hints of keys and actions on one metadata line.">
      <StateMatrix
        axes={{ platform: platforms }}
        render={({ platform }) => <KeyHints hints={legend} platform={platform} />}
      />
    </LabSection>
    <LabSection
      title="Detected platform"
      description={`This browser reads as ${getShortcutPlatform()}. Text forms for tooltips and descriptions follow it.`}
    >
      <p data-lab-detected>
        <Shortcut chord="Ctrl+S" /> · <code>{formatShortcutTooltip('Save', 'Ctrl+S')}</code> ·{' '}
        <code>{formatShortcutDescription('Saves the draft', 'Ctrl+S')}</code>
      </p>
    </LabSection>
    <LabSection
      title="Matching key presses"
      description="A Cyrillic я matches both Control+Я and Control+Z; AltGr typing @ on the Q key is text, not Control+Alt+Q."
    >
      <ChordTester />
    </LabSection>
    <LabSection
      title="Host helpers"
      description="Text forms of a chord for a host that draws its own shortcut, such as in a native menu or a title attribute."
    >
      <LabHelperCalls
        calls={[
          [
            "detectShortcutPlatform({ platform: 'MacIntel' })",
            detectShortcutPlatform({ platform: 'MacIntel' }),
          ],
          ["formatShortcut('Ctrl+Shift+K', 'mac')", formatShortcut('Ctrl+Shift+K', 'mac')],
          ["formatShortcut(['G', 'I'], 'linux')", formatShortcut(['G', 'I'], 'linux')],
          [
            "formatShortcutKeys('Ctrl+Shift+K', 'windows')",
            JSON.stringify(formatShortcutKeys('Ctrl+Shift+K', 'windows')),
          ],
          [
            "formatShortcutAccessibleText('Ctrl+Shift+K', { platform: 'mac' })",
            formatShortcutAccessibleText('Ctrl+Shift+K', { platform: 'mac' }),
          ],
        ]}
      />
    </LabSection>
    <LabSection
      title="Translated key names"
      description="keyName and joinSteps replace the built-in English for one call: here French key names, and a sequence of three chords joined step by step."
    >
      <LabHelperCalls
        calls={[
          [
            "formatShortcutAccessibleText(['Ctrl+K', 'Shift+↑', 'Enter'], { platform: 'windows', keyName: frenchKeyName, joinSteps: (previous, next) => `${previous}, puis ${next}` })",
            formatShortcutAccessibleText(['Ctrl+K', 'Shift+↑', 'Enter'], {
              platform: 'windows',
              keyName: frenchKeyName,
              joinSteps: (previous, next) => `${previous}, puis ${next}`,
            }),
          ],
        ]}
      />
    </LabSection>
    <LabSection
      title="Readable text beside aria-keyshortcuts"
      description="formatAriaKeyShortcuts gives the machine-readable value a control publishes; it takes one chord, never a sequence, because aria-keyshortcuts cannot express one."
    >
      <table data-lab-case="aria-keyshortcuts">
        <thead>
          <tr>
            <th scope="col">Chord</th>
            <th scope="col">Platform</th>
            <th scope="col">Readable text</th>
            <th scope="col">aria-keyshortcuts</th>
          </tr>
        </thead>
        <tbody>
          {ariaSamples.map(([chord, platform]) => (
            <tr key={`${chord} ${platform}`} data-lab-chord={`${chord} ${platform}`}>
              <td>
                <code>{chord}</code>
              </td>
              <td>{platform}</td>
              <td data-lab-output="text">{formatShortcutAccessibleText(chord, { platform })}</td>
              <td>
                <code data-lab-output="aria">{formatAriaKeyShortcuts(chord, platform)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LabSection>
  </>,
);
