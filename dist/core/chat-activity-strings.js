const planStepStatusNames = {
    pending: 'Pending',
    'in-progress': 'In progress',
    done: 'Done',
    failed: 'Failed',
    skipped: 'Skipped',
};
const stepsText = (count) => (count === 1 ? '1 step' : `${count} steps`);
/** A duration in whole seconds: seconds under a minute, else minutes and seconds. */
function durationText(seconds) {
    if (seconds < 60)
        return `${seconds} s`;
    const rest = seconds % 60;
    return rest === 0
        ? `${Math.floor(seconds / 60)} min`
        : `${Math.floor(seconds / 60)} min ${rest} s`;
}
const forText = (seconds) => seconds ? `for ${durationText(seconds)}` : 'for a moment';
export const chatActivityStrings = {
    chatReasoningStreaming: 'Thinking…',
    chatReasoningComplete: (seconds) => `Thought ${forText(seconds)}`,
    chatStepsRunning: (count) => `Working… · ${stepsText(count)}`,
    chatStepsComplete: (count, seconds) => `Worked ${forText(seconds)} · ${stepsText(count)}`,
    chatPlan: 'Plan',
    chatPlanProgress: (done, total) => `${done} of ${total} done`,
    chatPlanStepStatus: (status) => planStepStatusNames[status],
    chatPlanChanged: (changes) => changes
        .map(({ label, status }) => `${label}: ${planStepStatusNames[status].toLowerCase()}`)
        .join('. '),
};
//# sourceMappingURL=chat-activity-strings.js.map