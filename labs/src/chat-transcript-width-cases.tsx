import { ChatSteps } from '../../src/components/chat-activity/index.js';
import { ChatToolCall } from '../../src/components/chat-tool-call/index.js';
import { ChatMessage, ChatTranscript } from '../../src/components/chat-transcript/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { at, getNow, helper, maria } from './chat-transcript-message-samples.js';

const widths = { narrow: 320, wide: 560 } as const;
const avatars = ['shown', 'hidden'] as const;
const steps = ['collapsed', 'expanded', 'long output'] as const;

const longOutput = Array.from(
  { length: 3 },
  (_, line) =>
    `dist/assets/trail-map-${line + 1}.js  ${'█'.repeat(48)}  ${(line + 1) * 128} kB  gzip ${(line + 1) * 41} kB`,
).join('\n');

function WidthConversation({
  width,
  avatar,
  shownSteps,
}: {
  width: keyof typeof widths;
  avatar: (typeof avatars)[number];
  shownSteps: (typeof steps)[number];
}) {
  const showAvatar = avatar === 'shown';
  return (
    <div style={{ width: widths[width], height: 360 }}>
      <ChatTranscript aria-label={`Reply in a ${width} transcript`}>
        <ChatMessage id="ask" origin="sent" author={maria} time={at(20, 9, 50)} getNow={getNow}>
          Build the trail map.
        </ChatMessage>
        <ChatMessage
          id="reply"
          origin="received"
          variant="plain"
          author={helper}
          time={at(20, 9, 51)}
          getNow={getNow}
          showAvatar={showAvatar}
          showAuthorName={showAvatar}
        >
          <p>The map builds.</p>
          <ChatSteps
            actions={[
              { kind: 'read', count: 1 },
              { kind: 'command', count: 1 },
            ]}
            defaultExpanded={shownSteps !== 'collapsed'}
          >
            <ChatToolCall
              id={`${width}-${avatar}-read`}
              name="Read"
              target="src/main.ts"
              kind="read"
              status="succeeded"
            />
            <ChatToolCall
              id={`${width}-${avatar}-build`}
              name="Build"
              target="npm run build"
              kind="command"
              status="succeeded"
              result={shownSteps === 'long output' ? longOutput : 'Build complete'}
            />
          </ChatSteps>
        </ChatMessage>
      </ChatTranscript>
    </div>
  );
}

/** A plain reply with its activity, in a narrow and a wide transcript, which fills the row it is given. */
export function ChatTranscriptWidthCases() {
  return (
    <LabSection
      title="Plain reply width"
      description="A plain received reply fills the row past its avatar, so its steps' summary keeps to one line and opening the steps or a tool call changes no width; opened, Build's long output scrolls inside the call. The sent bubble stays at the end."
    >
      <StateMatrix
        axes={{ width: ['narrow', 'wide'], avatar: avatars, steps }}
        render={({ width, avatar, steps: shownSteps }) => (
          <WidthConversation width={width} avatar={avatar} shownSteps={shownSteps} />
        )}
      />
    </LabSection>
  );
}
