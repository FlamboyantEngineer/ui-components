/** The requests a card sends its host: the reader's answers, or their dismissal. */
export type QuestionRequestKind = 'submit' | 'dismiss';
export interface QuestionRequest {
    /** The request whose promise has not settled. */
    running: QuestionRequestKind | null;
    /** Why the last request failed, until the next one. */
    failure: string | null;
    /** Sends a request through `action`, unless one is running. */
    run: (kind: QuestionRequestKind, action: QuestionAction) => void;
}
/** A host callback; a returned promise keeps its request running until it settles. */
type QuestionAction = () => void | Promise<unknown>;
/**
 * The requests of a pending card, one at a time. The state belongs to `scope`, the card's id
 * while it is pending: it starts over when the card changes id or leaves pending, so a request
 * sent for one card never marks or fails another. A callback that returns no promise leaves no
 * trace unless it throws.
 */
export declare function useQuestionRequest(scope: string | undefined): QuestionRequest;
export {};
//# sourceMappingURL=chat-question-request.d.ts.map