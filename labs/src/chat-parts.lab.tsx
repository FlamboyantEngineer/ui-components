import { type ChatPart, ChatParts } from '../../src/components/chat-parts/index.js';
import {
  HyphenatedIds,
  KeptExpansion,
  MixedConversation,
  ToolRenderers,
} from './chat-parts-conversation.js';
import { FailedRun, failedRunParts } from './chat-parts-failure.js';
import { ActivityExpansion, AnsweredMarks } from './chat-parts-options.js';
import {
  bookingCall,
  linesText,
  linkedReferenceText,
  linkedReferenceTokens,
  literalText,
  literalTokens,
  partSamples,
  partTypes,
  referenceText,
  referenceTokens,
  renderLabPart,
  searchCall,
  textTokens,
  tokenText,
} from './chat-parts-samples.js';
import { WorkingSession } from './chat-parts-session.js';
import { ApprovalStream, StreamedAnswer } from './chat-parts-stream.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { getLabReference } from './reference-samples.js';

const stepStates = [
  'running',
  'answering',
  'done',
  'single',
  'single-done',
  'awaiting-approval',
  'failed',
  'failed-opened',
  'long-label',
] as const;

const thinking: ChatPart = {
  type: 'reasoning',
  id: 'r1',
  text: 'Two sights a day keeps the weekend **calm**.',
  status: 'complete',
  durationMs: 2100,
};
const running: ChatPart = { ...searchCall, status: 'running', durationMs: undefined };
const longCall: ChatPart = {
  ...searchCall,
  id: 'call-long',
  label: 'Search saved recipes for a lentil soup that keeps for three days and suits a slow cooker',
};

interface StepCase {
  parts: ChatPart[];
  isStreaming: boolean;
  expandedParts?: Record<string, boolean>;
}

const stepCases: Record<(typeof stepStates)[number], StepCase> = {
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
  'single-done': {
    parts: [{ type: 'text', text: 'Let me look.' }, searchCall],
    isStreaming: false,
  },
  'awaiting-approval': { parts: [thinking, bookingCall], isStreaming: false },
  failed: { parts: failedRunParts, isStreaming: false },
  'failed-opened': {
    parts: failedRunParts,
    isStreaming: false,
    expandedParts: { 'steps:plan': true, hotels: true },
  },
  'long-label': { parts: [thinking, longCall, searchCall], isStreaming: true },
};

const ignore = () => undefined;

const textCases = {
  tokens: { text: tokenText, tokens: textTokens },
  references: { text: referenceText, tokens: referenceTokens },
  lines: { text: linesText, tokens: undefined },
  literal: { text: literalText, tokens: literalTokens },
  linked: { text: linkedReferenceText, tokens: linkedReferenceTokens },
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
      description="Text renders as Markdown by default, or as written with its line breaks in plain format. Mention and command tokens show as pills in both; a token inside code stays as written. Record references show as record chips whose name, link and preview come from the host's getReference lookup by id, a missing and a restricted record among them. Text holding characters that look like the token markers keeps them as text: only real tokens become pills. A record reference inside a Markdown link shows its chip without a link of its own, so links never nest."
    >
      <StateMatrix
        axes={{
          content: ['tokens', 'references', 'lines', 'literal', 'linked'],
          format: ['markdown', 'plain'],
        }}
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
      description="Consecutive reasoning and tool calls fold into a group of steps, summed up by the kinds of its calls once it ends. It runs while it ends a streaming message, collapses once the answer streams after it or the message completes, and stays open while a tool call in it waits for approval. A failed call is a quiet row like the others, told apart by its red ! glyph, with its error closed in its body until the reader opens it (failed-opened). A single tool call folds into a group too (single, single-done), so it keeps its place, state and focus as the message streams after it, and every call takes the same quiet row style. A long tool call label wraps beside its status glyph."
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
      title="Steps on request"
      description="By default a message's steps open while they run (expandsActivity). With expandsActivity false they stay closed while the message streams, still busy, until the reader opens them; the reader's choice then holds when Streaming is turned off."
    >
      <ActivityExpansion />
    </LabSection>
    <LabSection
      title="Answered tabs"
      description="questionAnsweredMark chooses how a question card's answered tabs show: icon (the default) draws a check before the label; style leaves the mark to the stylesheet through data-answered. Pick an answer to the first question to mark its tab."
    >
      <AnsweredMarks />
    </LabSection>
    <LabSection
      title="Working session"
      description="Each run of tool calls collapses to one line summing up what it did by kind (Read files, edited files, ran commands), led by the glyph of its first kind. Text the assistant writes between tool calls shows as part of the message and splits the runs. The last run is open: its calls are quiet rows with their kind's glyph and target, and a row with details opens them below."
    >
      <WorkingSession />
    </LabSection>
    <LabSection
      title="Tool renderers"
      description="A forecast tool draws its result inside the default card; a booking tool draws its own card, with the approval callbacks bound to the call. A tool named toString has no renderer and draws the default card."
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
      description="Press Next event (or Play) to stream a run whose hotel search fails between steps that succeed. The failed search shows as a quiet row with a red ! glyph and its error closed; the failure opens nothing, so the group collapses once the answer follows, and a group closed during the run stays closed. Open the row to read the error, close it to hide it again."
    >
      <FailedRun />
    </LabSection>
    <LabSection
      title="Approval while streaming"
      description="A booking waits for approval while the reply keeps streaming. Press Deny and type a reason, then press Next event (or Play) to stream text after the call: the call stays in its group of steps, so the reason, its focus and the open Deny form survive each event."
    >
      <ApprovalStream />
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
    <LabSection
      title="Hyphenated message ids"
      description="Message m-1 with call p and message m with call 1-p would both join to m-1-p; the message id is written with its hyphens encoded (m%2D1-p), so the two calls keep their own DOM ids."
    >
      <HyphenatedIds />
    </LabSection>
  </>,
);
