/** One piece of a template: literal text, the time or the person. */
export type AttributionSegment = {
    kind: 'text';
    text: string;
    offset: number;
} | {
    kind: 'time' | 'person';
    offset: number;
};
/**
 * The template's literal text, `{time}` and `{person}` tokens in order, each with its offset in the
 * template as a stable key. Other braces stay literal.
 */
export declare function parseAttributionTemplate(template: string): AttributionSegment[];
/** Whether the time token starts the sentence: no visible text comes before it. */
export declare function isTimeFirst(segments: readonly AttributionSegment[]): boolean;
//# sourceMappingURL=attribution-template.d.ts.map