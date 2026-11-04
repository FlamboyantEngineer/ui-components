// The message composer's "+" menu: two categories of neutral sample items, on a plain composer and
// on a rich composer whose menu leads with a search field. The Chat lab's host controls reuse it.
import { useState } from 'react';
import {
  MessageComposer,
  MessageComposerEmojiButton,
  type MessageComposerHelpers,
  MessageComposerMenuButton,
  type MessageComposerMenuButtonProps,
  type MessageComposerMenuItem,
} from '../../src/components/message-composer/index.js';
import {
  type MessageComposerMessage,
  RichMessageComposer,
} from '../../src/components/message-composer/rich/index.js';
import {
  AttachGlyph,
  AudioGlyph,
  CalendarGlyph,
  ClockGlyph,
  EditGlyph,
  EnvelopeGlyph,
  FilePdfGlyph,
  FileTextGlyph,
  FolderGlyph,
  ImageGlyph,
  ListBulletGlyph,
  ListTaskGlyph,
} from '../../src/core/glyphs.js';
import { LabSection } from './chrome/index.js';
import { AttachmentChip, SentMessage } from './message-composer-rich-cases.js';

/** A source that inserts its command as a pill (as its text in the plain composer). */
function commandItem(
  id: string,
  label: string,
  fields: Partial<MessageComposerMenuItem>,
): MessageComposerMenuItem {
  return {
    id,
    label,
    ...fields,
    onAction: (composer: MessageComposerHelpers) =>
      composer.insertPill({ kind: 'command', id, label: id }),
  };
}

/** A file of the shared drive, inserted as a reference to it. */
function fileItem(
  id: string,
  label: string,
  fields: Partial<MessageComposerMenuItem>,
): MessageComposerMenuItem {
  return {
    id,
    label,
    ...fields,
    onAction: (composer: MessageComposerHelpers) => composer.insertText(`[${label}] `),
  };
}

/**
 * The lab's menu: things to add (attach files, a goal prompt, the plan mode toggle and an
 * unavailable voice note), then integrations with icons and notes, one with a submenu of files
 * and one with a shortcut hint.
 */
export function createLabComposerMenu(plan: {
  isPlanning: boolean;
  onPlanningChange: (isPlanning: boolean) => void;
}): MessageComposerMenuButtonProps {
  return {
    sections: [
      {
        id: 'add',
        title: 'Add',
        items: [
          {
            id: 'attach',
            label: 'Attach files',
            description: 'Images, documents and text',
            icon: AttachGlyph,
            onAction: (composer) => composer.attachFiles(),
          },
          {
            id: 'goal',
            label: 'Insert a goal prompt',
            description: 'Start from a template',
            icon: EditGlyph,
            onAction: (composer) => composer.insertText('Goal: '),
          },
          {
            id: 'plan',
            label: 'Plan mode',
            description: 'Outline the steps first',
            icon: ListTaskGlyph,
            isSelected: plan.isPlanning,
            onSelectedChange: plan.onPlanningChange,
          },
          {
            id: 'voice',
            label: 'Record a voice note',
            description: 'Up to two minutes',
            icon: AudioGlyph,
            isDisabled: true,
            disabledReason: 'Allow the microphone first',
          },
        ],
      },
      {
        id: 'integrations',
        title: 'Integrations',
        items: [
          commandItem('calendar', 'Calendar', {
            description: 'Shared schedule',
            icon: CalendarGlyph,
            shortcut: 'Alt+C',
          }),
          {
            id: 'files',
            label: 'Files',
            description: 'Team drive',
            icon: FolderGlyph,
            items: [
              fileItem('report', 'Report.pdf', { icon: FilePdfGlyph, description: 'Edited today' }),
              fileItem('field-notes', 'Field notes.txt', {
                icon: FileTextGlyph,
                description: 'Edited yesterday',
              }),
            ],
          },
          commandItem('mail', 'Mail', { description: 'Inbox', icon: EnvelopeGlyph }),
          commandItem('photos', 'Photos', { description: 'Shared albums', icon: ImageGlyph }),
          commandItem('reminders', 'Reminders', { description: 'Due dates', icon: ClockGlyph }),
          commandItem('tasks', 'Tasks', { description: 'Project board', icon: ListBulletGlyph }),
        ],
      },
    ],
  };
}

/** The files a lab composer attached, as removable chips above its text. */
function useLabFiles() {
  const [names, setNames] = useState<string[]>([]);
  return {
    names,
    attachments:
      names.length > 0
        ? names.map((name) => (
            <AttachmentChip
              key={name}
              name={name}
              onRemove={() => setNames((list) => list.filter((file) => file !== name))}
            />
          ))
        : undefined,
    onAttach: (added: File[]) => setNames((list) => [...list, ...added.map((file) => file.name)]),
    clear: () => setNames([]),
  };
}

/** A plain composer with the menu and the files it attaches, and a rich one with a searchable menu. */
function MenuComposers() {
  const [isPlanning, setPlanning] = useState(false);
  const files = useLabFiles();
  const richFiles = useLabFiles();
  const [sent, setSent] = useState('nothing');
  const [richSent, setRichSent] = useState<MessageComposerMessage | null>(null);
  const menu = createLabComposerMenu({ isPlanning, onPlanningChange: setPlanning });
  return (
    <>
      <MessageComposer
        aria-label="Message with a menu"
        placeholder="Write a message, or press + for more"
        startControls={
          <>
            <MessageComposerMenuButton {...menu} />
            <MessageComposerEmojiButton />
          </>
        }
        allowsEmptySubmit={files.names.length > 0}
        attachments={files.attachments}
        onAttach={files.onAttach}
        onSubmit={(text) => {
          setSent([text.trim(), ...files.names].filter(Boolean).join(' + '));
          files.clear();
        }}
        data-lab-composer="menu"
      />
      <p>
        Plan mode: <output data-lab-output="plan">{isPlanning ? 'on' : 'off'}</output>. Sent:{' '}
        <output data-lab-output="menu-sent">{sent}</output>
      </p>
      <RichMessageComposer
        aria-label="Prompt with a searchable menu"
        placeholder="Ask anything, or press + and search"
        startControls={<MessageComposerMenuButton {...menu} filterable />}
        allowsEmptySubmit={richFiles.names.length > 0}
        attachments={richFiles.attachments}
        onAttach={richFiles.onAttach}
        onSubmit={(message) => {
          setRichSent(message);
          richFiles.clear();
        }}
        data-lab-composer="menu-search"
      />
      <p>
        Sent:{' '}
        <output data-lab-output="menu-search-sent">
          {richSent ? <SentMessage message={richSent} /> : 'nothing'}
        </output>
      </p>
    </>
  );
}

export function ComposerMenuSection() {
  return (
    <LabSection
      title="Composer menu"
      description="The + button, placed first among the start controls, opens a menu upward from it (below it when there is no room above): Add (attach files through the system chooser, insert a goal prompt at the caret, the Plan mode toggle, which keeps the menu open, and a voice note that is unavailable and says why) and Integrations with icons and notes, a submenu of files and a shortcut hint; the list scrolls. Choosing an insertion puts focus back in the text after it. The rich composer's menu leads with a search field that narrows the items by label and note, and its commands go in as pills."
    >
      <MenuComposers />
    </LabSection>
  );
}
