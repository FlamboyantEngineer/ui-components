import { jsx as _jsx } from "react/jsx-runtime";
import { ChatSteps } from '../chat-activity/chat-activity.js';
import { ChatPartView } from './chat-part-view.js';
import { groupChatParts, isAwaitingApproval, isFailedCall, isStepActive, sumStepDurations, toPartKey, } from './chat-parts-grouping.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import { usePartsRenderNode } from './chat-text-part.js';
import { usePartsExpansion, usePartsReveal } from './use-parts-expansion.js';
/**
 * What a tool call calls for the reader with, shown in its group (`groupKeys`): a wait for approval,
 * which reveals even as the parts mount, or a failure, which also reveals the call's card and only
 * once it arrives, so a group the reader closed in loaded history stays closed.
 */
function toReveals(part, groupKeys) {
    if (part.type !== 'tool-call')
        return [];
    if (isAwaitingApproval(part)) {
        return [{ id: `approval:${part.id}`, keys: groupKeys, isRevealedOnMount: true }];
    }
    if (isFailedCall(part)) {
        return [{ id: `failed:${part.id}`, keys: [...groupKeys, part.id], isRevealedOnMount: false }];
    }
    return [];
}
/** What the message's tool calls call for the reader with. */
function listReveals(items) {
    return items.flatMap((item) => item.kind === 'steps'
        ? item.steps.flatMap((step) => toReveals(step, [item.key]))
        : toReveals(item.part, []));
}
/** The heading of the group's latest step when it is reasoning that streams. */
function findStepsTitle(steps) {
    const last = steps.at(-1);
    return last?.type === 'reasoning' && last.status === 'streaming' ? last.title : undefined;
}
/**
 * A group of steps: open while it runs, a tool call in it waits for approval or a tool call in it
 * failed, unless the reader chose otherwise, and collapsed afterwards.
 */
function StepsView({ item, isRunning, context }) {
    const { expansion } = context;
    const isCallingReader = item.steps.some((step) => isAwaitingApproval(step) || isFailedCall(step));
    return (_jsx(ChatSteps, { isRunning: isRunning, title: findStepsTitle(item.steps), durationMs: sumStepDurations(item.steps), stepCount: item.steps.length, isExpanded: expansion.expanded[item.key] ?? (isCallingReader || undefined), onExpandedChange: (isExpanded) => expansion.setExpanded(item.key, isExpanded), expandsAutomatically: context.expandsActivity, children: item.steps.map((step, index) => (_jsx(ChatPartView, { part: step, context: context }, toPartKey(step, index)))) }));
}
/**
 * The parts of one message, each drawn by the component for its type: text as Markdown (or plain
 * text) with code blocks, citations and token pills, reasoning, tool calls with their approvals and
 * renderers, questions, plans, sources, attachments, code, diffs and custom parts. Consecutive
 * reasoning and tool calls fold into a group of steps that runs while the message streams; both
 * open on their own while they run, unless `expandsActivity` is false.
 */
export function ChatParts({ parts, messageId, isStreaming = false, textFormat = 'markdown', expandedParts, onExpandedPartsChange, className, id, ...rest }) {
    const renderNode = usePartsRenderNode(parts, rest.onApplyCode);
    const expansion = usePartsExpansion({ expandedParts, onExpandedPartsChange });
    const items = groupChatParts(parts);
    usePartsReveal(listReveals(items), expansion);
    const context = {
        ...rest,
        textFormat,
        renderNode,
        toDomId: (partId) => (messageId === undefined ? partId : `${messageId}-${partId}`),
        expansion,
    };
    return (_jsx("div", { ...hooks.root({ className, props: rest }), id: id, children: items.map((item, index) => item.kind === 'steps' ? (_jsx(StepsView, { item: item, isRunning: isStreaming && (index === items.length - 1 || item.steps.some(isStepActive)), context: context }, item.key)) : (_jsx(ChatPartView, { part: item.part, context: context }, item.key))) }));
}
//# sourceMappingURL=chat-parts.js.map