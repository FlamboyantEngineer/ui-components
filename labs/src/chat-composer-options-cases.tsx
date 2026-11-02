// The Chat lab's host hooks into the composer and the messages: the composer's id for a control
// outside the chat, the paste and selection hooks, a host trigger, the message menu's icons and
// how a question card marks its answered tabs.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatQuestionPart } from '../../src/components/chat-parts/index.js';
import type {
  MessageComposerPaste,
  MessageComposerPasteResult,
  MessageComposerRange,
  MessageComposerTrigger,
} from '../../src/components/message-composer/rich/index.js';
import { StarGlyph } from '../../src/core/glyphs.js';
import {
  assistantPeople,
  getLabNow,
  plannerId,
  readerId,
  sentMessage,
  textMessage,
} from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const composerId = 'lab-chat-composer';

const conversation: ChatMessageData[] = [
  textMessage({
    id: 'options-question',
    authorId: readerId,
    time: '2026-04-20T10:00:00',
    text: 'Where should we stay in Porto?',
  }),
  textMessage({
    id: 'options-answer',
    authorId: plannerId,
    time: '2026-04-20T10:00:06',
    text: 'Ribeira is close to the river; Bonfim is quieter and cheaper.',
  }),
];

const places = [
  { id: 'ribeira', label: 'Ribeira' },
  { id: 'bonfim', label: 'Bonfim' },
  { id: 'foz', label: 'Foz' },
];

/** `%` opens the host's neighbourhoods. */
const placeTrigger: MessageComposerTrigger = {
  id: 'places',
  character: '%',
  label: 'Neighbourhoods',
  getCompletions: (query) =>
    places.filter((place) => place.label.toLowerCase().includes(query.toLowerCase())),
};

const triggers = [placeTrigger];

const tripLink = /^https:\/\/example\.test\/trip\/([a-z-]+)$/;

/**
 * Refuses pasted text that holds a card number, turns a trip link into a reference and leaves any
 * other paste to the composer; reports what it did.
 */
function usePasteHook() {
  const [pasted, setPasted] = useState('nothing');
  const onPaste = ({ text }: MessageComposerPaste): MessageComposerPasteResult => {
    if (/\d{4} \d{4} \d{4} \d{4}/.test(text)) {
      setPasted('refused a card number');
      return null;
    }
    const match = tripLink.exec(text.trim());
    if (!match) {
      setPasted('plain text');
      return undefined;
    }
    const label = `Trip: ${match[1] ?? ''}`;
    setPasted(`replaced a link with ${label}`);
    return {
      text: label,
      tokens: [{ kind: 'reference', id: match[1] ?? '', label, start: 0, end: label.length }],
    };
  };
  return { pasted, onPaste };
}

const showRange = (range: MessageComposerRange | null) =>
  range ? `${String(range.start)}–${String(range.end)}` : 'none';

/**
 * A chat whose composer a button outside it focuses by id, whose pastes the host checks, whose
 * selection it reads and whose `%` opens the host's neighbourhoods.
 */
function ComposerHooks() {
  const [messages, setMessages] = useState<readonly ChatMessageData[]>(conversation);
  const [selection, setSelection] = useState<MessageComposerRange | null>(null);
  const paste = usePasteHook();
  return (
    <div data-lab-demo="composer-hooks">
      <Button size="sm" onPress={() => document.getElementById(composerId)?.focus()}>
        Write a message
      </Button>
      <div style={{ height: 320 }}>
        <Chat
          aria-label="Planning the stay"
          messages={messages}
          participants={assistantPeople}
          currentUserId={readerId}
          getNow={getLabNow}
          composerInputId={composerId}
          onComposerPaste={paste.onPaste}
          onComposerSelectionChange={setSelection}
          triggers={triggers}
          onSend={(text, tokens) => setMessages((list) => [...list, sentMessage(text, tokens)])}
        />
      </div>
      <LabOutput name="pasted">{paste.pasted}</LabOutput>
      <LabOutput name="selection">{showRange(selection)}</LabOutput>
    </div>
  );
}

/** Copy draws no icon in the message menu and Good response a star; Bad response keeps its own. */
const menuIcons = { copy: null, up: StarGlyph };

/** An assistant chat whose message menus draw the host's icons. */
function MenuIconsChat() {
  const [copied, setCopied] = useState('nothing');
  return (
    <div data-lab-demo="menu-icons">
      <div style={{ height: 260 }}>
        <Chat
          aria-label="Stay advice with menu icons"
          messages={conversation}
          participants={assistantPeople}
          currentUserId={readerId}
          getNow={getLabNow}
          messageMenuIcons={menuIcons}
          onCopy={(id) => setCopied(id)}
          onFeedback={() => undefined}
        />
      </div>
      <LabOutput name="copied">{copied}</LabOutput>
    </div>
  );
}

const twoQuestions: ChatQuestionPart = {
  type: 'question',
  id: 'stay-questions',
  status: 'pending',
  questions: [
    {
      id: 'area',
      question: 'Which area suits you?',
      header: 'Area',
      selectionMode: 'single',
      options: [
        { id: 'ribeira', label: 'Ribeira' },
        { id: 'bonfim', label: 'Bonfim' },
      ],
    },
    {
      id: 'nights',
      question: 'How many nights?',
      header: 'Nights',
      selectionMode: 'single',
      options: [
        { id: 'two', label: 'Two' },
        { id: 'three', label: 'Three' },
      ],
    },
  ],
};

/** A reply asking two questions, in a chat whose answered tabs show a check or only a style. */
function questionMessages(mark: string): ChatMessageData[] {
  return [
    {
      id: `mark-${mark}-ask`,
      authorId: plannerId,
      createdAt: '2026-04-20T10:00:06',
      parts: [{ ...twoQuestions, id: `stay-questions-${mark}` }],
    },
  ];
}

export function ChatComposerOptionsCases() {
  return (
    <>
      <LabSection
        title="Composer hooks"
        description="composerInputId gives the composer's text box an id, which Write a message, outside the chat, focuses. onComposerPaste sees each paste first: it refuses a card number (1234 5678 9012 3456), turns a link such as https://example.test/trip/porto into a reference, and leaves other text alone. onComposerSelectionChange reports the selection, and triggers adds the host's % vocabulary of neighbourhoods."
      >
        <ComposerHooks />
      </LabSection>
      <LabSection
        title="Message menu icons"
        description="messageMenuIcons replaces the message menu's icons: open a reply's menu with a secondary click or Shift+F10 to see Copy without an icon, Good response with a star and Bad response with its own."
      >
        <MenuIconsChat />
      </LabSection>
      <LabSection
        title="Answered question tabs"
        description="questionAnsweredMark sets how a question card in the chat marks an answered tab: a check (icon, the default) or the stylesheet alone (style). Answer the first question to see its tab marked."
      >
        <StateMatrix
          axes={{ mark: ['icon', 'style'] }}
          render={({ mark }) => (
            <div style={{ height: 480, width: 420 }}>
              <Chat
                aria-label={`Stay questions (${mark})`}
                messages={questionMessages(mark)}
                participants={assistantPeople}
                currentUserId={readerId}
                getNow={getLabNow}
                questionAnsweredMark={mark}
                onAnswerQuestion={() => undefined}
              />
            </div>
          )}
        />
      </LabSection>
    </>
  );
}
