import {
  ChatMessage,
  ChatTranscript,
  type ChatTranscriptPresentation,
} from '../../src/components/chat-transcript/index.js';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { at, getNow, helper, maria } from './chat-transcript-message-samples.js';

const widths = { narrow: 320, wide: 560 } as const;
const presentations = [
  'framed',
  'embedded',
] as const satisfies readonly ChatTranscriptPresentation[];

const replies = [
  'The ridge trail reopened this morning.',
  'The lower bridge is still closed, so start from the north car park.',
  'Allow three hours there and back, with a stop at the lookout.',
  'Bring water: the spring at the halfway hut is dry this month.',
];

/** A panel with tabs, as a host draws it, holding a conversation on its own surface. */
function PanelConversation({
  width,
  presentation,
}: {
  width: keyof typeof widths;
  presentation: ChatTranscriptPresentation;
}) {
  const name = `${presentation}-${width}`;
  return (
    <div
      style={{
        width: widths[width],
        border: '1px solid var(--ref-border)',
        borderRadius: 'var(--ref-radius)',
        background: 'var(--ref-surface)',
      }}
    >
      <Tabs defaultSelectedKey="conversation">
        <TabList aria-label={`Panel ${name}`}>
          <Tab id="conversation">Conversation</Tab>
          <Tab id="notes">Notes</Tab>
        </TabList>
        <TabPanel id="conversation">
          <div style={{ height: 280 }}>
            <ChatTranscript
              aria-label={`Conversation in a ${width} panel, ${presentation}`}
              presentation={presentation}
              data-lab-transcript={name}
            >
              <ChatMessage
                id={`${name}-ask`}
                origin="sent"
                author={maria}
                time={at(20, 9, 50)}
                getNow={getNow}
              >
                Is the ridge trail open?
              </ChatMessage>
              {replies.map((reply, index) => (
                <ChatMessage
                  key={reply}
                  id={`${name}-reply-${index + 1}`}
                  author={helper}
                  time={at(20, 9, 51 + index)}
                  getNow={getNow}
                >
                  {reply}
                </ChatMessage>
              ))}
            </ChatTranscript>
          </div>
        </TabPanel>
        <TabPanel id="notes">Notes for the trip.</TabPanel>
      </Tabs>
    </div>
  );
}

/** The transcript framed on its own canvas, and embedded in a host's panel, narrow and wide. */
export function ChatTranscriptEmbeddedCases() {
  return (
    <LabSection
      title="Embedded in a panel"
      description="A framed transcript draws its own bordered, rounded canvas; an embedded one (presentation embedded) draws no frame, so the panel's surface shows through. The messages keep their padding, and the log still scrolls, follows the latest message, moves by keyboard and offers Jump to latest when scrolled away."
    >
      <StateMatrix
        axes={{ width: ['narrow', 'wide'], presentation: presentations }}
        render={({ width, presentation }) => (
          <PanelConversation width={width} presentation={presentation} />
        )}
      />
    </LabSection>
  );
}
