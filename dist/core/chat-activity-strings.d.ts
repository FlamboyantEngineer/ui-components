/** Strings of an assistant's activity in a chat: reasoning, groups of steps and plans. */
export interface ChatActivityStrings {
    /** Labels reasoning while it streams in. */
    chatReasoningStreaming: string;
    /** Labels finished reasoning by how long it took in whole seconds; `0` or none reads as a moment. */
    chatReasoningComplete: (seconds?: number) => string;
    /** Labels a group of steps while its run goes on, by the number of steps. */
    chatStepsRunning: (count: number) => string;
    /** Labels a group of steps once its run ended, by the number of steps and its whole seconds. */
    chatStepsComplete: (count: number, seconds?: number) => string;
    /** Names a plan without a title. */
    chatPlan: string;
    /** A plan's progress: how many of its steps are done. */
    chatPlanProgress: (done: number, total: number) => string;
    /** The status words read after a plan step's label (`Book the hotel, Done`). */
    chatPlanStepStatus: (status: 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped') => string;
    /** Announces the plan steps whose status changed, each by its label and new status (`Book the hotel: done`). */
    chatPlanChanged: (changes: readonly {
        label: string;
        status: 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped';
    }[]) => string;
}
export declare const chatActivityStrings: ChatActivityStrings;
//# sourceMappingURL=chat-activity-strings.d.ts.map