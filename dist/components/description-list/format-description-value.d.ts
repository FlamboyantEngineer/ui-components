/** Both ends of a range of numbers or dates. */
export interface DescriptionRange<T extends number | string> {
    start: T;
    end: T;
}
/**
 * A value a row formats for the locale: a number, an ISO 8601 date or date and time text
 * (`2026-05-14`, `2026-05-14T09:30`), a list of texts, or a range of numbers or ISO 8601 texts.
 */
export type DescriptionValue = number | string | readonly string[] | DescriptionRange<number> | DescriptionRange<string>;
/** `Intl` options for the value's kind: number, date or list formatting. */
export type DescriptionFormatOptions = Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | Intl.ListFormatOptions;
export interface DescriptionFormatInput {
    /** A BCP 47 locale, such as `fr-FR`. */
    locale: string;
    formatOptions?: DescriptionFormatOptions | undefined;
}
/**
 * A value as text for `locale`: numbers and number ranges with `Intl.NumberFormat`, ISO 8601 dates
 * and date ranges with `Intl.DateTimeFormat` (a medium date by default), and lists of texts joined
 * with `Intl.ListFormat` (`Apples, pears, and plums` in English by default).
 */
export declare function formatDescriptionValue(value: DescriptionValue, input: DescriptionFormatInput): string;
//# sourceMappingURL=format-description-value.d.ts.map