import { KeyHints, Shortcut } from '../../src/components/shortcut/shortcut.js';
import {
  formatShortcutDescription,
  formatShortcutTooltip,
  getShortcutPlatform,
} from '../../src/components/shortcut/shortcut-format.js';
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
    </LabSection>
    <LabSection title="Key legends" description="Hints of keys and actions on one metadata line.">
      <StateMatrix
        axes={{ platform: platforms }}
        render={({ platform }) => (
          <KeyHints
            hints={[...legend, { keys: [sequences['G I']], action: 'go to inbox' }]}
            platform={platform}
          />
        )}
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
  </>,
);
