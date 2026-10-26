import { type AnchorHTMLAttributes, type Dispatch, type ReactElement, type ReactNode, type Ref, type SetStateAction } from 'react';
import { type GlyphComponent, type GlyphMap, type GlyphName } from './glyphs.js';
import { type UiStorage } from './storage.js';
import { type UiStrings } from './strings.js';
/** Props a link renderer receives. It must render an element that navigates to `href`. */
export interface UiLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    /** Where the link navigates. */
    href: string;
    /** The rendered anchor. */
    ref?: Ref<HTMLAnchorElement> | undefined;
}
/** Renders the links the library draws (breadcrumbs, list rows, tree items), e.g. through a router's Link. */
export type UiLinkRenderer = (props: UiLinkProps) => ReactElement;
/** Navigates client-side to a router href, with the options a link or item passed. */
export type UiNavigate = (href: string, routerOptions?: unknown) => void;
/** Maps a router href to the native href a link renders. */
export type UiHref = (href: string) => string;
export interface UiProviderProps {
    /** Replaces built-in glyphs by name. Unlisted glyphs keep their default (or the outer provider's). */
    icons?: Partial<GlyphMap> | undefined;
    /** Replaces built-in strings by key. */
    strings?: Partial<UiStrings> | undefined;
    /** BCP 47 locale for formatting, collation and direction. */
    locale?: string | undefined;
    /** Renders library links. Defaults to a plain anchor. */
    renderLink?: UiLinkRenderer | undefined;
    /** Client-side navigation for links, menu items and tabs with an `href`. */
    navigate?: UiNavigate | undefined;
    /** Maps a router href to a native href for links. */
    useHref?: UiHref | undefined;
    /** Where components persist layout state. Defaults to an in-memory store. */
    storage?: UiStorage | undefined;
    /** The components that use these services. */
    children?: ReactNode;
}
export interface GlyphProps {
    /** The built-in glyph to draw. */
    name: GlyphName;
    /** Usually the host component's slot class, e.g. `ui-button__icon`. */
    className?: string | undefined;
}
export interface PersistCodec<T> {
    parse(raw: string): T;
    stringify(value: T): string;
}
/**
 * Supplies glyphs, strings, locale, link rendering and storage to every component below it.
 * Components work without a provider, using Heroicons, English strings and in-memory storage.
 * Nested providers merge over their parent.
 */
export declare function UiProvider({ icons, strings, locale, renderLink, navigate, useHref, storage, children, }: UiProviderProps): import("react").JSX.Element;
/** The glyph component for a built-in glyph name. */
export declare function useGlyph(name: GlyphName): GlyphComponent;
/** The built-in strings, with provider overrides applied. */
export declare function useUiStrings(): UiStrings;
/** The storage adapter for persisted layout state. */
export declare function useUiStorage(): UiStorage;
/** Renders a link through the provider's link renderer. */
export declare function UiLink(props: UiLinkProps): ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
/** Draws a built-in glyph as decoration (hidden from assistive technology). */
export declare function Glyph({ name, className }: GlyphProps): import("react").JSX.Element;
/**
 * State persisted through the provider storage adapter under `key`. Without a key it is plain state.
 * Unreadable stored values fall back to `initialValue`.
 */
export declare function usePersistentState<T>(key: string | undefined, initialValue: T | (() => T), codec?: PersistCodec<T>): [T, Dispatch<SetStateAction<T>>];
//# sourceMappingURL=provider.d.ts.map