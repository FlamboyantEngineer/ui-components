import { ChatParts, type ChatPart } from '../../src/components/chat-parts/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { KeptExpansion, MixedConversation, ToolRenderers } from './chat-parts-conversation.js';
import { FailedRun, failedRunParts } from './chat-parts-failure.js';
import {
  bookingCall,
  linesText,
  partSamples,
  referenceText,
  referenceTokens,
  partTypes,
  renderLabPart,
  searchCall,
  textTokens,
  tokenText,
} from './chat-parts-samples.js';
import { StreamedAnswer } from './chat-parts-stream.js';
import { getLabReference } from './reference-samples.js';

const stepStates = [
  'running',
  'answering',
  'done',
  'single',
  'awaiting-approval',
  'failed',
] as const;

const thinking: ChatPart = {
  type: 'reasoning',
  id: 'r1',
  text: 'Two sights a day keeps the weekend **calm**.',
  status: 'complete',
  durationMs: 2100,
};
const running: ChatPart = { ...searchCall, status: 'running', durationMs: undefined };

const stepCases: Record<(typeof stepStates)[number], { parts: ChatPart[]; isStreaming: boolean }> =
  {
    running: { parts: [thinking, running], isStreaming: true },
    answering: {
      parts: [
        thinking,
        searchCall,
        { type: 'text', text: 'Here are three **soups**', status: 'streaming' },
      ],
      isStreaming: true,
    },
    done: {
      parts: [thinking, searchCall, { type: 'text', text: 'Here are three **soups**.' }],
      isStreaming: false,
    },
    single: { parts: [{ type: 'text', text: 'Let me look.' }, running], isStreaming: true },
    'awaiting-approval': { parts: [thinking, bookingCall], isStreaming: false },
    failed: { parts: failedRunParts, isStreaming: false },
  };

const ignore = () => undefined;

const textCases = {
  tokens: { text: tokenText, tokens: textTokens },
  references: { text: referenceText, tokens: referenceTokens },
  lines: { text: linesText, tokens: undefined },
};

mountLab(
  <>
    <LabSection
      title="Part types"
      description="One message part of each type, drawn by its component: Markdown and plain text, reasoning, a tool call, a question, a plan, sources, attachments (one failed), code, terminal output, a diff under its title and a custom part drawn by renderPart."
    >
      <StateMatrix
        axes={{ type: partTypes, parts: ['rendered'] }}
        render={({ type }) => (
          <div style={{ width: 380 }}>
            <ChatParts
              parts={partSamples[type]}
              messageId={`type-${type}`}
              renderPart={renderLabPart}
              onRetryAttachment={ignore}
              onAnswerQuestion={ignore}
              onApplyCode={ignore}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Text and tokens"
      description="Text renders as Markdown by default, or as written with its line breaks in plain format. Mention and command tokens show as pills in both; a token inside code stays as written. Record references show as record chips whose name, link and preview come from the host's getReference lookup by id, a missing and a restricted record among them."
    >
      <StateMatrix
        axes={{ content: ['tokens', 'references', 'lines'], format: ['markdown', 'plain'] }}
        render={({ content, format }) => (
          <div style={{ width: 300 }}>
            <ChatParts
              parts={[{ type: 'text', ...textCases[content] }]}
              textFormat={format}
              getReference={getLabReference}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Steps"
      description="Consecutive reasoning and tool calls fold into a group of steps. It runs while it ends a streaming message, collapses once the answer streams after it or the message completes, and stays open while a tool call in it waits for approval or once one in it failed. A single step that ends the message stays on its own."
    >
      <StateMatrix
        axes={{ state: stepStates, parts: ['rendered'] }}
        render={({ state }) => (
          <div style={{ width: 380 }}>
            <ChatParts
              {...stepCases[state]}
              messageId={`steps-${state}`}
              onApprove={ignore}
              onDeny={ignore}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Tool renderers"
      description="A forecast tool draws its result inside the default card; a booking tool draws its own card, with the approval callbacks bound to the call."
    >
      <ToolRenderers />
    </LabSection>
    <LabSection
      title="Streamed answer"
      description="Press Next event (or Play) to stream a reply: the reasoning streams inside a running group of steps, a tool call runs, its sources arrive, then the answer streams with citations and the group collapses."
    >
      <StreamedAnswer />
    </LabSection>
    <LabSection
      title="Failed step"
      description="Press Next event (or Play) to stream a run whose hotel search fails between steps that succeed. The group stays open around the failure once the answer follows and the run finishes. Close the group while the hotel search runs and the failure opens it again; close it after the failure and it stays closed."
    >
      <FailedRun />
    </LabSection>
    <LabSection
      title="Mixed message"
      description="A message with mention and command pills and photos, then a reply mixing a plan, steps with a forecast renderer and an approval, an answer with citations and code, sources, a question, code, a diff, a custom part and a failed upload. The host records each decision and logs every callback."
    >
      <MixedConversation />
    </LabSection>
    <LabSection
      title="Kept expansion"
      description="The host keeps the reader's open and closed choices (expandedParts), so they survive a remount, as under virtualization."
    >
      <KeptExpansion />
    </LabSection>
  </>,
);
