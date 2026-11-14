// The "+" menu of the Chat lab's agent app: things to add to the message, the tools the agent may
// use, and the agent's commands. The composer adds its own Sending section after them.

import type {
  MessageComposerMenuItem,
  MessageComposerMenuSection,
} from '../../src/components/message-composer/index.js';
import {
  AttachGlyph,
  AudioGlyph,
  CalendarGlyph,
  GlobeGlyph,
  ImageGlyph,
  TerminalGlyph,
} from '../../src/core/glyphs.js';
import { plannerCommands } from './chat-everything-samples.js';

/** The tools the agent may use, with what each does. */
export const agentTools = [
  {
    id: 'web',
    label: 'Web search',
    description: 'Look up opening hours and prices',
    icon: GlobeGlyph,
  },
  { id: 'maps', label: 'Maps', description: 'Find places and routes', icon: ImageGlyph },
  {
    id: 'bookings',
    label: 'Bookings',
    description: 'Tables, trains and hotels',
    icon: CalendarGlyph,
  },
] as const;

/** The places the reader can drop into the message. */
const places = ['Alfama', 'Belém', 'Miradouro da Graça', 'LX Factory'];

/** The sections: Add, Tools (each a toggle), then Commands as pills. */
export function createAgentMenu(tools: {
  enabled: readonly string[];
  onChange: (enabled: readonly string[]) => void;
}): MessageComposerMenuSection[] {
  const toggle = (id: string, isOn: boolean) =>
    tools.onChange(isOn ? [...tools.enabled, id] : tools.enabled.filter((entry) => entry !== id));
  const placeItems: MessageComposerMenuItem[] = places.map((place) => ({
    id: `place-${place}`,
    label: place,
    onAction: (composer) => composer.insertText(`${place} `),
  }));
  return [
    {
      id: 'add',
      title: 'Add',
      items: [
        {
          id: 'attach',
          label: 'Attach files',
          description: 'Photos, tickets and notes',
          icon: AttachGlyph,
          onAction: (composer) => composer.attachFiles(),
        },
        {
          id: 'place',
          label: 'A place',
          description: 'From your saved places',
          icon: ImageGlyph,
          items: placeItems,
        },
        {
          id: 'voice',
          label: 'Record a voice note',
          icon: AudioGlyph,
          isDisabled: true,
          disabledReason: 'Allow the microphone first',
        },
      ],
    },
    {
      id: 'tools',
      title: 'Tools',
      items: agentTools.map((tool) => ({
        ...tool,
        isSelected: tools.enabled.includes(tool.id),
        onSelectedChange: (isOn: boolean) => toggle(tool.id, isOn),
      })),
    },
    {
      id: 'commands',
      title: 'Commands',
      items: plannerCommands.map((command) => ({
        id: `command-${command.id}`,
        label: `/${command.label}`,
        description: command.description,
        icon: TerminalGlyph,
        onAction: (composer) =>
          composer.insertPill({ kind: 'command', id: command.id, label: command.label }),
      })),
    },
  ];
}
