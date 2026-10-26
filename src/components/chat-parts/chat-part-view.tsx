// One part of a message, drawn by the component for its type (specs/CHAT-PARTS.md).

import { useId, type ReactNode } from 'react';
import { ChatPlan, ChatReasoning } from '../chat-activity/chat-activity.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import { ChatQuestion } from '../chat-question/chat-question.js';
import { ChatSources } from '../chat-sources/chat-sources.js';
import { ChatToolCall } from '../chat-tool-call/chat-tool-call.js';
import { CodeBlock } from '../code-block/code-block.js';
import { TextDiff } from '../text-diff/text-diff.js';
import type {
  ChatCodePart,
  ChatDiffPart,
  ChatPart,
  ChatQuestionPart,
  ChatReasoningPart,
  ChatTextFormat,
  ChatToolCallPart,
} from './chat-part.js';
import type { ChatPartsProps, ChatToolCallHandlers } from './chat-parts.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import { ChatTextPartView, type MarkdownNodeRenderer } from './chat-text-part.js';
import type { PartsExpansion } from './use-parts-expansion.js';

/** What every part view draws with: the message's callbacks, overrides and expansion. */
export interface PartContext extends Pick<
  ChatPartsProps,
  | 'toolRenderers'
  | 'onApprove'
  | 'onDeny'
  | 'onAlwaysAllow'
  | 'onAnswerQuestion'
  | 'onDismissQuestion'
  | 'questionAnsweredMark'
  | 'onRetryAttachment'
  | 'onApplyCode'
  | 'renderPart'
> {
  textFormat: ChatTextFormat;
  renderNode: MarkdownNodeRenderer;
  /** The DOM id of a part: its id, prefixed by the message's. */
  toDomId: (id: string) => string;
  expansion: PartsExpansion;
}

interface PartViewProps<P extends ChatPart> {
  part: P;
  context: PartContext;
}

/** A tool call's approval callbacks bound to its id, passing on only what each one takes. */
function bindToolCallHandlers(context: PartContext, callId: string): ChatToolCallHandlers {
  const { onApprove, onDeny, onAlwaysAllow } = context;
  return {
    onApprove: onApprove && (() => onApprove(callId)),
    onDeny: onDeny && ((reason?: string) => onDeny(callId, reason)),
    onAlwaysAllow: onAlwaysAllow && (() => onAlwaysAllow(callId)),
  };
}

function ReasoningView({ part, context }: PartViewProps<ChatReasoningPart>) {
  const { expansion } = context;
  return (
    <ChatReasoning
      text={part.text}
      status={part.status}
      durationMs={part.durationMs}
      isExpanded={expansion.expanded[part.id]}
      onExpandedChange={(isExpanded) => expansion.setExpanded(part.id, isExpanded)}
    />
  );
}

function ToolCallView({ part, context }: PartViewProps<ChatToolCallPart>) {
  const { expansion } = context;
  const handlers = bindToolCallHandlers(context, part.id);
  const renderer = context.toolRenderers?.[part.name];
  if (renderer?.replaces === 'card') return renderer.render(part, handlers);
  return (
    <ChatToolCall
      id={context.toDomId(part.id)}
      name={part.name}
      label={part.label}
      status={part.status}
      args={part.args}
      result={part.result}
      error={part.error}
      durationMs={part.durationMs}
      approval={part.approval}
      {...handlers}
      isExpanded={expansion.expanded[part.id]}
      onExpandedChange={(isExpanded) => expansion.setExpanded(part.id, isExpanded)}
    >
      {renderer?.render(part, handlers)}
    </ChatToolCall>
  );
}

function QuestionView({ part, context }: PartViewProps<ChatQuestionPart>) {
  const { onAnswerQuestion, onDismissQuestion, questionAnsweredMark } = context;
  return (
    <ChatQuestion
      id={context.toDomId(part.id)}
      questions={part.questions}
      status={part.status}
      answers={part.answers}
      onSubmit={onAnswerQuestion && ((answers) => onAnswerQuestion(part.id, answers))}
      onDismiss={onDismissQuestion && (() => onDismissQuestion(part.id))}
      answeredMark={questionAnsweredMark}
    />
  );
}

function CodeView({ part, context: { onApplyCode } }: PartViewProps<ChatCodePart>) {
  return (
    <CodeBlock
      code={part.code}
      language={part.language}
      title={part.title}
      variant={part.variant}
      onApply={onApplyCode && ((code) => onApplyCode(code, part))}
    />
  );
}

function DiffView({ part }: { part: ChatDiffPart }) {
  const titleId = useId();
  return (
    <div {...hooks.slot('diff')}>
      {part.title ? (
        <div {...hooks.slot('diff-title')} id={titleId}>
          {part.title}
        </div>
      ) : null}
      <TextDiff
        oldText={part.oldText}
        newText={part.newText}
        aria-labelledby={part.title ? titleId : undefined}
      />
    </div>
  );
}

/** One part, drawn by the component for its type; a custom part by `renderPart`, else nothing. */
export function ChatPartView({ part, context }: PartViewProps<ChatPart>): ReactNode {
  switch (part.type) {
    case 'text':
      return (
        <ChatTextPartView
          part={part}
          format={part.format ?? context.textFormat}
          renderNode={context.renderNode}
        />
      );
    case 'reasoning':
      return <ReasoningView part={part} context={context} />;
    case 'tool-call':
      return <ToolCallView part={part} context={context} />;
    case 'question':
      return <QuestionView part={part} context={context} />;
    case 'plan':
      return <ChatPlan title={part.title} steps={part.steps} />;
    case 'sources':
      return <ChatSources sources={part.sources} />;
    case 'files':
      return (
        <ChatAttachmentList attachments={part.attachments} onRetry={context.onRetryAttachment} />
      );
    case 'code':
      return <CodeView part={part} context={context} />;
    case 'diff':
      return <DiffView part={part} />;
    case 'custom':
      return context.renderPart?.(part) ?? null;
  }
}
