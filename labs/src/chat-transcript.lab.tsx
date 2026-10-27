import { mountLab } from './chrome/index.js';
import { ChatTranscriptBehaviourCases } from './chat-transcript-behaviour-cases.js';
import { ChatTranscriptDisplayCases } from './chat-transcript-display-cases.js';
import { ChatTranscriptEmbeddedCases } from './chat-transcript-embedded-cases.js';
import { ChatTranscriptMessageCases } from './chat-transcript-message-cases.js';
import { ChatTranscriptWidthCases } from './chat-transcript-width-cases.js';

mountLab(
  <>
    <ChatTranscriptBehaviourCases />
    <ChatTranscriptMessageCases />
    <ChatTranscriptDisplayCases />
    <ChatTranscriptWidthCases />
    <ChatTranscriptEmbeddedCases />
  </>,
);
