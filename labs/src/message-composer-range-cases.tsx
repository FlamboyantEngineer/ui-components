// The rich composer's selection and range contract, interceptable paste and host triggers: a
// host's own controls read and replace ranges of the draft, pasted links resolve to references
// later, and `$` tools and `#` files open their own vocabularies, `#` from a slow source.

import {
  AdjustmentsGlyph,
  FileGlyph,
  FileTextGlyph,
  FolderGlyph,
  SearchGlyph,
} from '../../src/core/glyphs.js';
import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  RichMessageComposer,
  type MessageComposerHandle,
  type MessageComposerMessage,
  type MessageComposerPaste,
  type MessageComposerRange,
  type MessageComposerSuggestion,
  type MessageComposerTrigger,
} from '../../src/components/message-composer/rich/index.js';
import { LabSection } from './chrome/index.js';
import { SentMessage } from './message-composer-rich-cases.js';

const people = [
  { id: 'ana', label: 'Ana Lopez' },
  { id: 'jon', label: 'Jon Berg' },
];

const startDraft: MessageComposerMessage = {
  text: 'Ask @Ana Lopez about the **plan**\nthen book the room',
  tokens: [{ kind: 'mention', id: 'ana', label: 'Ana Lopez', start: 4, end: 14 }],
};

const linkPattern = /^https:\/\/example\.test\/doc\/([a-z0-9-]+)$/;

/** A reference fragment for a sample document link, found after a short wait. */
function resolveLink({ text }: MessageComposerPaste) {
  const match = linkPattern.exec(text.trim());
  if (!match) return undefined;
  const id = match[1] ?? '';
  const label = `DOC-${id.toUpperCase()}`;
  return new Promise<MessageComposerMessage | null>((resolve) => {
    setTimeout(() => {
      resolve(
        id === 'missing'
          ? null
          : {
              text: label,
              tokens: [{ kind: 'reference', id, label, start: 0, end: label.length }],
            },
      );
    }, 600);
  });
}

const showRange = (range: MessageComposerRange | null) =>
  range ? `${String(range.start)}–${String(range.end)}` : 'none';

/**
 * A composer beside the host's own controls: select a word, replace a range across a line break and
 * the mention, put a reference in place of the selection after focus moved to a button, and paste
 * `https://example.test/doc/plan` to see it turn into a reference once the lookup answers.
 */
function RangeComposer() {
  const handle = useRef<MessageComposerHandle>(null);
  const [selection, setSelection] = useState<MessageComposerRange | null>(null);
  const [draft, setDraft] = useState(startDraft);
  const [owner, setOwner] = useState(1);
  const [result, setResult] = useState('');
  const run = (label: string, action: (composer: MessageComposerHandle) => string) => {
    const composer = handle.current;
    setResult(composer ? `${label}: ${action(composer)}` : `${label}: unavailable`);
  };
  return (
    <div data-lab-ranges>
      <RichMessageComposer
        aria-label="Message with ranges"
        inputId="lab-range-input"
        handleRef={handle}
        defaultValue={startDraft}
        persistKey={`message-composer-lab:ranges:${String(owner)}`}
        mentions={people}
        onChange={setDraft}
        onSelectionChange={setSelection}
        onPaste={resolveLink}
        onSubmit={() => undefined}
      />
      <div role="group" aria-label="Host controls">
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            run('Select plan', (composer) => composer.setSelection({ start: 27, end: 31 }))
          }
        >
          Select “plan”
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            run('Insert reference', (composer) =>
              composer.replaceSelection({
                text: 'DOC-BRIEF',
                tokens: [{ kind: 'reference', id: 'brief', label: 'DOC-BRIEF', start: 0, end: 9 }],
              }),
            )
          }
        >
          Replace the selection with a reference
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() =>
            run('Replace range', (composer) =>
              composer.replaceRange({ start: 6, end: 38 }, '@Jon Berg to share it,\nand'),
            )
          }
        >
          Replace 6–38
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setOwner((value) => value + 1)}>
          Switch to another draft
        </Button>
      </div>
      <p data-lab-output="selection">Selection: {showRange(selection)}</p>
      <p data-lab-output="result">{result}</p>
      <p data-lab-output="draft">
        <SentMessage message={draft} />
      </p>
    </div>
  );
}

const TOOLS: (MessageComposerSuggestion & { glyph: typeof SearchGlyph })[] = [
  {
    id: 'tool-search',
    label: 'Search',
    text: '$search',
    description: 'Look things up',
    glyph: SearchGlyph,
  },
  {
    id: 'tool-tidy',
    label: 'Tidy',
    text: '$tidy',
    description: 'Clean up a draft',
    glyph: AdjustmentsGlyph,
  },
  { id: 'tool-outline', label: 'Outline', text: '$outline', glyph: FileTextGlyph },
];

const toolTrigger: MessageComposerTrigger = {
  id: 'tools',
  character: '$',
  label: 'Tools',
  getCompletions: (query) =>
    TOOLS.filter((tool) => tool.label.toLowerCase().includes(query.toLowerCase())).map(
      ({ glyph, ...tool }) => ({ ...tool, icon: glyph }),
    ),
  getIcon: (token) => TOOLS.find((tool) => tool.id === token.id)?.glyph,
};

const FILES = [
  'notes/agenda.md',
  'notes/budget.md',
  'plans/garden.md',
  'plans/kitchen.md',
  'photos/summer.png',
];

/** A slow file search: answers after a delay that grows with the query, and fails on `fail`. */
const fileTrigger: MessageComposerTrigger = {
  id: 'files',
  character: '#',
  label: 'Files',
  getCompletions: (query, { signal }) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => {
          if (query === 'fail') {
            reject(new Error('The file search is offline.'));
            return;
          }
          resolve(
            FILES.filter((path) => path.includes(query)).map((path) => ({
              id: path,
              label: path.split('/').at(-1) ?? path,
              text: `#${path}`,
              description: path,
              icon: path.startsWith('photos') ? FolderGlyph : FileGlyph,
            })),
          );
        },
        // Shorter queries answer later, so out-of-order answers happen while typing.
        900 - Math.min(query.length, 6) * 120,
      );
      signal.addEventListener('abort', () => clearTimeout(timer));
    }),
  getIcon: () => FileGlyph,
};

/** `$` tools from a list, `#` files from a slow source, and `@` mentions, in one draft. */
function TriggerComposer() {
  const [sent, setSent] = useState<MessageComposerMessage | null>(null);
  return (
    <div data-lab-triggers>
      <RichMessageComposer
        aria-label="Message with tools and files"
        placeholder="Type $ for tools, # for files, @ for people"
        mentions={people}
        triggers={triggers}
        onSubmit={(message) => {
          setSent(message);
        }}
      />
      <p data-lab-output="sent">{sent ? <SentMessage message={sent} /> : 'Nothing sent yet.'}</p>
    </div>
  );
}

const triggers = [toolTrigger, fileTrigger];

export function RangeComposerSections() {
  return (
    <>
      <LabSection
        title="Selection and ranges"
        description="The host's own controls read and replace ranges of the draft by offsets in its Markdown text: Select “plan” selects a word, Replace 6–38 swaps a stretch across the mention and the line break for new text (the mention it cuts goes whole), and the reference button replaces the selection kept from before focus moved to it. Each edit is one undo step. Paste https://example.test/doc/plan: the link goes in at once and becomes a DOC-PLAN reference when the lookup answers; …/doc/missing stays a link. Typing over the pasted link, or switching to another draft first, drops the late answer."
      >
        <RangeComposer />
      </LabSection>
      <LabSection
        title="Host triggers"
        description="$ opens the host's tools, with icons, and inserts them as tokens that keep their raw text ($search) while the chip shows the label; # searches files from a slow source that shows Loading for the current query only, ignores answers that come back out of order, cancels its search when Escape or a click outside closes the list, shows a failure for the query fail and No results for no match; @ still mentions people."
      >
        <TriggerComposer />
      </LabSection>
    </>
  );
}
