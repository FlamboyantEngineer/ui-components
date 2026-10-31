import { useState, type KeyboardEvent } from 'react';
import { KeyHints, Shortcut, matchesChord } from '../../src/components/shortcut/shortcut.js';
import {
  formatShortcutDescription,
  formatShortcutTooltip,
  getShortcutPlatform,
} from '../../src/components/shortcut/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
  </>,
);
