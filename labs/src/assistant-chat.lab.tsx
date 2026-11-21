import { AssistantChatCase } from './assistant-chat-cases.js';
import { LabSection, mountLab } from './chrome/index.js';

mountLab(
  <>
    <LabSection title="Assistant thread">
      <AssistantChatCase />
    </LabSection>
    <LabSection title="Older messages">
      <AssistantChatCase hasHistory />
    </LabSection>
  </>,
);
