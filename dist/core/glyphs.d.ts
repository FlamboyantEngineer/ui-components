import type { ComponentType } from 'react';
/** Props the library passes to a glyph component. Any SVG icon component that accepts them works. */
export interface GlyphComponentProps {
    /** The glyph and slot classes. */
    className?: string;
    /** The glyph's built-in name. */
    'data-glyph'?: string;
    /** Glyphs are decorative. */
    'aria-hidden'?: boolean | 'true' | 'false';
    /** Keeps the SVG out of the tab order in browsers that focus SVG. */
    focusable?: boolean | 'true' | 'false';
}
export type GlyphComponent = ComponentType<GlyphComponentProps>;
export type GlyphName = keyof typeof defaultGlyphs;
export type GlyphMap = Record<GlyphName, GlyphComponent>;
/** The built-in glyphs every component draws from. Hosts replace any of them through `UiProvider`. */
export declare const defaultGlyphs: {
    'chevron-down': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'chevron-up': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'chevron-left': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'chevron-right': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'chevron-double-left': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'chevron-double-right': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'arrow-up': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'arrow-down': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'arrow-left': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'arrow-right': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    close: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    check: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    more: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'more-vertical': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'sort-ascending': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'sort-descending': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'sort-none': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    expand: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    collapse: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    search: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    filter: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    info: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    warning: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    error: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    success: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    help: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    plus: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    minus: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    undo: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    redo: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    restore: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    refresh: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    edit: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    copy: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    save: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    delete: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    calendar: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'drag-handle': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    upload: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    folder: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    users: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'fit-width': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'fit-page': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'eye-dropper': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    eye: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'eye-slash': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    scrub: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    link: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'external-link': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    sidebar: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'trend-up': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'trend-down': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'trend-flat': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    offline: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    lock: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    emoji: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    bell: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    clock: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    envelope: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'envelope-open': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    send: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    attach: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    stop: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    download: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    rotate: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    file: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    image: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    video: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    audio: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'file-pdf': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'file-archive': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'file-text': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    star: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    adjustments: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    move: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    table: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    resize: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    formula: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    play: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    pause: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    paragraph: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    bold: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    italic: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    underline: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    strikethrough: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    code: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'code-block': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'heading-1': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'heading-2': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'heading-3': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'list-bullet': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'list-numbered': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'list-task': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    quote: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    unlink: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    pending: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    skipped: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'hand-raised': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'no-symbol': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'x-circle': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'thumbs-up': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'thumbs-down': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    reply: import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
    'bell-slash': import("react").ForwardRefExoticComponent<Omit<import("react").SVGProps<SVGSVGElement>, "ref"> & {
        title?: string;
        titleId?: string;
    } & import("react").RefAttributes<SVGSVGElement>>;
};
export declare const glyphNames: GlyphName[];
//# sourceMappingURL=glyphs.d.ts.map