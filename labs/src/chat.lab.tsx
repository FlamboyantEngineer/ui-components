import { Button } from '../../src/components/button/button.js';
import { ChatHeader } from '../../src/components/chat/index.js';
import { ChatAssistantCases } from './chat-assistant-cases.js';
import { ChatChromeCases } from './chat-chrome-cases.js';
import { ChatEverythingCases } from './chat-everything-cases.js';
import { ChatGroupCases } from './chat-group-cases.js';
import { ChatPeopleCases } from './chat-people-cases.js';
import { ana, ben, mia, planner } from './chat-samples.js';
import { ChatStateCases } from './chat-state-cases.js';
import { ChatSurfaceCases } from './chat-surface-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
          actions={<Button icon="more" label={`More (${participants}, ${line})`} size="sm" />}
        />
      )}
    />
  );
}

mountLab(
  <>
    <ChatEverythingCases />
    <ChatAssistantCases />
    <ChatPeopleCases />
    <ChatGroupCases />
    <ChatChromeCases />
    <ChatSurfaceCases />
    <ChatStateCases />
    <LabSection
      title="Header"
      description="ChatHeader on its own: one participant with their presence (or a plain avatar without it; an assistant's is rounded), a stack of several that lists everyone with their presence when pressed, the title as a heading, a line saying who is typing or what the assistant does, and the host's controls."
    >
      <HeaderMatrix />
    </LabSection>
  </>,
);
