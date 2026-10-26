import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// One part of a message, drawn by the component for its type (specs/CHAT-PARTS.md).
import { useId } from 'react';
import { ChatPlan, ChatReasoning } from '../chat-activity/chat-activity.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import { ChatQuestion } from '../chat-question/chat-question.js';
import { ChatSources } from '../chat-sources/chat-sources.js';
import { ChatToolCall } from '../chat-tool-call/chat-tool-call.js';
import { CodeBlock } from '../code-block/code-block.js';
import { TextDiff } from '../text-diff/text-diff.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import { ChatTextPartView } from './chat-text-part.js';
/** A tool call's approval callbacks bound to its id, passing on only what each one takes. */
function bindToolCallHandlers(context, callId) {
    const { onApprove, onDeny, onAlwaysAllow } = context;
    return {
        onApprove: onApprove && (() => onApprove(callId)),
        onDeny: onDeny && ((reason) => onDeny(callId, reason)),
        onAlwaysAllow: onAlwaysAllow && (() => onAlwaysAllow(callId)),
    };
}
function ReasoningView({ part, context }) {
    const { expansion } = context;
    return (_jsx(ChatReasoning, { text: part.text, title: part.title, status: part.status, durationMs: part.durationMs, isExpanded: expansion.expanded[part.id], onExpandedChange: (isExpanded) => expansion.setExpanded(part.id, isExpanded), expandsAutomatically: context.expandsActivity }));
}
function ToolCallView({ part, context }) {
    const { expansion } = context;
    const handlers = bindToolCallHandlers(context, part.id);
    const renderer = context.toolRenderers?.[part.name];
    if (renderer?.replaces === 'card')
        return renderer.render(part, handlers);
    return (_jsx(ChatToolCall, { id: context.toDomId(part.id), name: part.name, label: part.label, status: part.status, args: part.args, result: part.result, error: part.error, durationMs: part.durationMs, approval: part.approval, ...handlers, isExpanded: expansion.expanded[part.id], onExpandedChange: (isExpanded) => expansion.setExpanded(part.id, isExpanded), children: renderer?.render(part, handlers) }));
}
function QuestionView({ part, context }) {
    const { onAnswerQuestion, onDismissQuestion, questionAnsweredMark } = context;
    return (_jsx(ChatQuestion, { id: context.toDomId(part.id), questions: part.questions, status: part.status, answers: part.answers, onSubmit: onAnswerQuestion && ((answers) => onAnswerQuestion(part.id, answers)), onDismiss: onDismissQuestion && (() => onDismissQuestion(part.id)), answeredMark: questionAnsweredMark }));
}
function CodeView({ part, context: { onApplyCode } }) {
    return (_jsx(CodeBlock, { code: part.code, language: part.language, title: part.title, variant: part.variant, onApply: onApplyCode && ((code) => onApplyCode(code, part)) }));
}
function DiffView({ part }) {
    const titleId = useId();
    return (_jsxs("div", { ...hooks.slot('diff'), children: [part.title ? (_jsx("div", { ...hooks.slot('diff-title'), id: titleId, children: part.title })) : null, _jsx(TextDiff, { oldText: part.oldText, newText: part.newText, "aria-labelledby": part.title ? titleId : undefined })] }));
}
/** One part, drawn by the component for its type; a custom part by `renderPart`, else nothing. */
export function ChatPartView({ part, context }) {
    switch (part.type) {
        case 'text':
            return (_jsx(ChatTextPartView, { part: part, format: part.format ?? context.textFormat, renderNode: context.renderNode, getReference: context.getReference }));
        case 'reasoning':
            return _jsx(ReasoningView, { part: part, context: context });
        case 'tool-call':
            return _jsx(ToolCallView, { part: part, context: context });
        case 'question':
            return _jsx(QuestionView, { part: part, context: context });
        case 'plan':
            return _jsx(ChatPlan, { title: part.title, steps: part.steps });
        case 'sources':
            return _jsx(ChatSources, { sources: part.sources });
        case 'files':
            return (_jsx(ChatAttachmentList, { attachments: part.attachments, onRetry: context.onRetryAttachment }));
        case 'code':
            return _jsx(CodeView, { part: part, context: context });
        case 'diff':
            return _jsx(DiffView, { part: part });
        case 'custom':
            return context.renderPart?.(part) ?? null;
    }
}
//# sourceMappingURL=chat-part-view.js.map