import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { getDisplayName } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { SegmentedBar } from '../segmented-bar/segmented-bar.js';
import { UserIdentity } from '../user-identity/user-identity.js';
const hooks = createHooks('approval-panel', [
    'header',
    'title',
    'outcome',
    'progress',
    'approvers',
    'approver',
    'identity',
    'you',
    'decision',
    'time',
    'comment',
    'remind',
    'request-again',
    'actions',
]);
const decisionTones = {
    pending: 'neutral',
    approved: 'success',
    rejected: 'danger',
    abstained: 'info',
};
const decisionGlyphs = {
    pending: 'clock',
    approved: 'check',
    rejected: 'close',
    abstained: 'minus',
};
const decisions = [
    'approved',
    'rejected',
    'abstained',
    'pending',
];
/** The approvals needed, a whole number from 1: `requiredCount`, else every approver. */
function resolveRequired(requiredCount, approverCount) {
    const count = requiredCount === undefined || !Number.isFinite(requiredCount) ? approverCount : requiredCount;
    return Math.max(1, Math.trunc(count));
}
/** Rejected by any rejection, approved once the approvals reach the count needed, else pending. */
function resolveApprovalOutcome(approvers, requiredCount) {
    if (approvers.some((approver) => approver.decision === 'rejected'))
        return 'rejected';
    const approved = approvers.filter((approver) => approver.decision === 'approved').length;
    return approved >= requiredCount ? 'approved' : 'pending';
}
function ApproverActions({ approver, onRemind, onRequestAgain }) {
    const strings = useUiStrings();
    const name = getDisplayName(approver.person.name, strings.unnamed);
    if (approver.decision === 'pending') {
        if (!onRemind)
            return null;
        const label = strings.remindApprover(name);
        return (_jsx(Button, { icon: "bell", label: label, tooltip: label, size: "sm", className: hooks.slotClass('remind'), onPress: () => onRemind(approver.id) }));
    }
    if (!onRequestAgain)
        return null;
    const label = strings.requestApprovalAgain(name);
    return (_jsx(Button, { icon: "refresh", label: label, tooltip: label, size: "sm", className: hooks.slotClass('request-again'), onPress: () => onRequestAgain(approver.id) }));
}
function ApproverRow(props) {
    const strings = useUiStrings();
    const { approver, isCurrent, getNow } = props;
    const { decision } = approver;
    return (_jsxs("li", { ...hooks.slot('approver', { decision, current: isCurrent }), children: [_jsx(UserIdentity, { ...approver.person, size: "sm", nameSuffix: isCurrent ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('you'), children: strings.you })] })) : null, className: hooks.slotClass('identity') }), _jsx(Badge, { tone: decisionTones[decision], startIcon: decisionGlyphs[decision], size: "sm", className: hooks.slotClass('decision'), children: strings.approvalDecision(decision) }), approver.time ? (_jsx(RelativeTime, { value: approver.time, getNow: getNow, className: hooks.slotClass('time') })) : null, isEmptyNode(approver.comment) ? null : (_jsx("div", { ...hooks.slot('comment'), children: approver.comment })), _jsx(ApproverActions, { ...props })] }));
}
/**
 * Who must decide on something and where each decision stands: a heading with the outcome, the
 * approvals given against those needed over a bar of every decision, one row per approver with
 * their decision, time and comment, Remind and Request again actions, and the reader's own
 * decision under them.
 */
export function ApprovalPanel({ approvers, requiredCount, title, currentApproverId, onRemind, onRequestAgain, getNow, children, className, ...rest }) {
    const strings = useUiStrings();
    const titleId = useId();
    const Heading = `h${useHeadingLevel(undefined)}`;
    const required = resolveRequired(requiredCount, approvers.length);
    const outcome = resolveApprovalOutcome(approvers, required);
    const countOf = (decision) => approvers.filter((approver) => approver.decision === decision).length;
    const segments = decisions.map((decision) => ({
        id: decision,
        label: strings.approvalDecision(decision),
        value: countOf(decision),
        tone: decision === 'pending' ? undefined : decisionTones[decision],
    }));
    return (_jsxs("section", { ...rest, ...hooks.root({ className, props: rest, data: { outcome } }), "aria-labelledby": titleId, children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx(Heading, { ...hooks.slot('title'), id: titleId, children: title ?? strings.approvals }), _jsx(Badge, { variant: "status", tone: decisionTones[outcome], size: "sm", className: hooks.slotClass('outcome'), children: strings.approvalDecision(outcome) })] }), _jsx(SegmentedBar
            // Approvals past the count needed read as the count needed (`1 of 1 approval`).
            , { 
                // Approvals past the count needed read as the count needed (`1 of 1 approval`).
                label: strings.approvalProgress(Math.min(countOf('approved'), required), required), segments: segments, showTotal: false, size: "sm", className: hooks.slotClass('progress') }), _jsx("ul", { ...hooks.slot('approvers'), "aria-label": strings.approvers, children: approvers.map((approver) => (_jsx(ApproverRow, { approver: approver, isCurrent: approver.id === currentApproverId, onRemind: onRemind, onRequestAgain: onRequestAgain, getNow: getNow }, toKeyIdentity(approver.id)))) }), isEmptyNode(children) ? null : _jsx("div", { ...hooks.slot('actions'), children: children })] }));
}
//# sourceMappingURL=approval-panel.js.map