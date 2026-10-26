/** Each bundled locale besides English, loading its emoji names and keywords as a separate chunk. */
declare const loaders: {
    bn: () => Promise<typeof import("./emoji-data-bn.js")>;
    da: () => Promise<typeof import("./emoji-data-da.js")>;
    de: () => Promise<typeof import("./emoji-data-de.js")>;
    'en-gb': () => Promise<typeof import("./emoji-data-en-gb.js")>;
    es: () => Promise<typeof import("./emoji-data-es.js")>;
    'es-mx': () => Promise<typeof import("./emoji-data-es-mx.js")>;
    et: () => Promise<typeof import("./emoji-data-et.js")>;
    fi: () => Promise<typeof import("./emoji-data-fi.js")>;
    fr: () => Promise<typeof import("./emoji-data-fr.js")>;
    hi: () => Promise<typeof import("./emoji-data-hi.js")>;
    hu: () => Promise<typeof import("./emoji-data-hu.js")>;
    it: () => Promise<typeof import("./emoji-data-it.js")>;
    ja: () => Promise<typeof import("./emoji-data-ja.js")>;
    ko: () => Promise<typeof import("./emoji-data-ko.js")>;
    lt: () => Promise<typeof import("./emoji-data-lt.js")>;
    ms: () => Promise<typeof import("./emoji-data-ms.js")>;
    nb: () => Promise<typeof import("./emoji-data-nb.js")>;
    nl: () => Promise<typeof import("./emoji-data-nl.js")>;
    pl: () => Promise<typeof import("./emoji-data-pl.js")>;
    pt: () => Promise<typeof import("./emoji-data-pt.js")>;
    ru: () => Promise<typeof import("./emoji-data-ru.js")>;
    sv: () => Promise<typeof import("./emoji-data-sv.js")>;
    th: () => Promise<typeof import("./emoji-data-th.js")>;
    uk: () => Promise<typeof import("./emoji-data-uk.js")>;
    vi: () => Promise<typeof import("./emoji-data-vi.js")>;
    zh: () => Promise<typeof import("./emoji-data-zh.js")>;
    'zh-hant': () => Promise<typeof import("./emoji-data-zh-hant.js")>;
};
/** A locale whose emoji names and keywords the picker bundles. */
export type EmojiLocale = 'en' | keyof typeof loaders;
/** Whether the picker bundles the emoji names and keywords of `locale`. */
export declare function isEmojiLocale(locale: string): locale is EmojiLocale;
/** Loads the compact names and keywords of a bundled locale other than English. */
export declare function importEmojiLocale(locale: Exclude<EmojiLocale, 'en'>): Promise<string>;
export {};
//# sourceMappingURL=emoji-locales.d.ts.map