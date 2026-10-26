import { mountLab } from './chrome/index.js';
import { ChatTranscriptBehaviourCases } from './chat-transcript-behaviour-cases.js';
import { ChatTranscriptDisplayCases } from './chat-transcript-display-cases.js';
import { ChatTranscriptMessageCases } from './chat-transcript-message-cases.js';

mountLab(
  <>
    <ChatTranscriptBehaviourCases />
    <ChatTranscriptMessageCases />
    <ChatTranscriptDisplayCases />
  </>,
);
