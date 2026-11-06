import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CommandPalette,
  type CommandPaletteEntry,
} from '../../src/components/command-palette/command-palette.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const themes = ['Light', 'Dark', 'Sepia'];
const languages = ['English', 'Français', 'Español', '日本語'];

const commands: CommandPaletteEntry[] = [
  {
    type: 'section',
    id: 'appearance',
    title: 'Appearance',
    items: [
      {
        id: 'theme',
        label: 'Change theme',
        keywords: ['colour', 'dark mode'],
        commands: themes.map((theme) => ({ id: `theme-${theme.toLowerCase()}`, label: theme })),
      },
      {
        id: 'language',
        label: 'Change language',
        keywords: ['locale', 'translate'],
        commands: languages.map((language, index) => ({
          id: `language-${index}`,
          label: language,
        })),
      },
      { id: 'zoom-in', label: 'Zoom in', keywords: ['bigger', 'magnify'] },
      { id: 'zoom-out', label: 'Zoom out', keywords: ['smaller'] },
    ],
  },
  {
    type: 'section',
    id: 'notes',
    title: 'Notes',
    items: [
      { id: 'new-note', label: 'New note', keywords: ['create', 'add'] },
      { id: 'pin-note', label: 'Pin note', keywords: ['favourite'] },
      { id: 'note-export', label: 'Export notes', keywords: ['download', 'save as'] },
    ],
  },
];

/** A palette whose commands carry keywords and open pages of further commands. */
function PagedPalette() {
  const [isOpen, setOpen] = useState(false);
  const [path, setPath] = useState<Key[]>([]);
  const [last, setLast] = useState('none');
  return (
    <div data-lab-demo="pages">
      <Button size="sm" onPress={() => setOpen(true)}>
        Open the paged palette
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onOpenChange={setOpen}
        shortcut={null}
        items={commands}
        onPathChange={setPath}
        onAction={(key: Key) => setLast(String(key))}
        data-lab-palette="pages"
      />
      <LabOutput name="page-path">{path.length > 0 ? path.join(' / ') : 'first page'}</LabOutput>
      <LabOutput name="page-ran">{last}</LabOutput>
    </div>
  );
}

export function CommandPalettePagesCases() {
  return (
    <LabSection
      title="Keywords and pages"
      description="Type “dark mode” or “locale”: keywords find a command without showing in it, and matches rank by the whole label, its start, a word's start, anywhere, then keywords. Change theme and Change language open a page in place; Back, or Escape or Backspace on the empty field, returns with the text typed before."
    >
      <PagedPalette />
    </LabSection>
  );
}
