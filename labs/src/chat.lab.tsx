import { Button } from '../../src/components/button/button.js';
import { ChatHeader } from '../../src/components/chat/index.js';
import { Cluster } from '../../src/components/layout/layout.js';
import { Link } from '../../src/components/link/link.js';
import { MoreGlyph } from '../../src/core/glyphs.js';
import { ChatAssistantCases, ChatTypingWhileStreamingCases } from './chat-assistant-cases.js';
import { ChatCaretCases } from './chat-caret-cases.js';
import { ChatChromeCases } from './chat-chrome-cases.js';
import { ChatComposerOptionsCases } from './chat-composer-options-cases.js';
import { ChatDisplayCases } from './chat-display-cases.js';
import { ChatEverythingCases } from './chat-everything-cases.js';
import { ChatGroupCases } from './chat-group-cases.js';
import { ChatHostCases } from './chat-host-cases.js';
import { ChatInlineOptionsCases } from './chat-inline-options-cases.js';
import { ChatLongCases } from './chat-long-cases.js';
import { ChatNativeCases } from './chat-native-cases.js';
import { ChatPeopleCases } from './chat-people-cases.js';
import { ChatProgressCases } from './chat-progress-cases.js';
import { ChatQueueCases } from './chat-queue-cases.js';
import { ChatReferenceCases } from './chat-reference-cases.js';
import { ana, ben, mia, planner } from './chat-samples.js';
import { ChatSidebarCases } from './chat-sidebar-cases.js';
import { ChatStateCases } from './chat-state-cases.js';
import { ChatSurfaceCases } from './chat-surface-cases.js';
import { ChatThinkingCases } from './chat-thinking-cases.js';
import { ChatThinkingStyles } from './chat-thinking-styles.js';
import { ChatWideContentCases } from './chat-wide-content-cases.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const people = {
  'one with presence': [ana],
  'one without presence': [mia],
  assistant: [planner],
  several: [ana, ben, mia],
} as const;

const lines = { none: undefined, typing: 'Ana is typing…' } as const;

/** ChatHeader on its own: the participants it shows, its line and the host's controls. */
function HeaderMatrix() {
  return (
    <StateMatrix
      axes={{
        participants: Object.keys(people) as (keyof typeof people)[],
        line: ['none', 'typing'],
      }}
      render={({ participants, line }) => (
        <ChatHeader
          title={participants === 'several' ? 'Weekend team' : people[participants][0].name}
          participants={people[participants]}
          status={lines[line]}
          actions={<Button icon={MoreGlyph} label={`More (${participants}, ${line})`} size="sm" />}
        />
      )}
    />
  );
}

mountLab(
  <>
    <LabSection
      title="Chat family examples"
      description="Focused examples share the Chat family API, contract and reference styling."
    >
      <Cluster space="md" wrap="wrap">
        <Link href="assistant-chat.html">Composable assistant thread</Link>
        <Link href="chat-activity.html">Activity</Link>
        <Link href="chat-controller.html">Controller</Link>
        <Link href="chat-list.html">Conversation list</Link>
        <Link href="chat-message-actions.html">Message actions</Link>
        <Link href="chat-model-picker.html">Model picker</Link>
        <Link href="chat-parts.html">Message parts</Link>
        <Link href="chat-question.html">Questions</Link>
        <Link href="chat-sources.html">Sources</Link>
        <Link href="chat-tool-call.html">Tool calls</Link>
      </Cluster>
    </LabSection>
    <ChatEverythingCases />
    <ChatAssistantCases />
    <ChatTypingWhileStreamingCases />
    <ChatQueueCases />
    <ChatProgressCases />
    <ChatThinkingCases />
    <ChatCaretCases />
    <ChatThinkingStyles />
    <ChatInlineOptionsCases />
    <ChatHostCases />
    <ChatComposerOptionsCases />
    <ChatReferenceCases />
    <ChatSidebarCases />
    <ChatPeopleCases />
    <ChatGroupCases />
    <ChatChromeCases />
    <ChatSurfaceCases />
    <ChatStateCases />
    <ChatDisplayCases />
    <ChatWideContentCases />
    <ChatLongCases />
    <ChatNativeCases />
    <LabSection
      title="Header"
      description="ChatHeader on its own: one participant with their presence (or a plain avatar without it; an assistant's is rounded), a stack of several that lists everyone with their presence when pressed, the title as a heading, a line saying who is typing or what the assistant does, and the host's controls."
    >
      <HeaderMatrix />
    </LabSection>
  </>,
);
