'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SetStateAction,
} from 'react';
import { I18nProvider, RouterProvider } from '../primitives/index.js';
import type { GlyphComponent, GlyphMap, GlyphName } from './glyph-types.js';
import { mergeClassNames } from './hooks.js';
import { OverlayPresenceScope } from './overlay-presence.js';
import { formatMessage, type MessageValues } from './message-format.js';
import { createMemoryStorage, type UiStorage } from './storage.js';
import { en } from './locales/index.js';
import { compileStrings, defaultStrings, type UiMessages, type UiStrings } from './strings.js';
import { omitUndefined } from '../utils/omit-undefined.js';
import { useLatest } from '../utils/use-latest.js';

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

/** Formats an ICU MessageFormat message with the provider's locale. */
export type UiFormatMessage = (message: string, values?: MessageValues) => string;

export interface UiProviderProps {
  /** Replaces built-in glyphs by name. Unlisted glyphs keep their default (or the outer provider's). */
  icons?: Partial<GlyphMap> | undefined;
  /**
   * A language file, or part of one: built-in text by key, as ICU MessageFormat messages. Unlisted
   * keys keep the outer provider's text, and English below every provider.
   */
  messages?: Partial<UiMessages> | undefined;
  /** BCP 47 locale for the messages' plurals, numbers and lists, and for formatting, collation and direction. */
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
  /** The imported icon component to draw. */
  icon: GlyphComponent;
  /** Usually the host component's slot class, e.g. `ui-button__icon`. */
  className?: string | undefined;
}

export interface PersistCodec<T> {
  parse(raw: string): T;
  stringify(value: T): string;
}

interface UiContextValue {
  glyphs: Partial<GlyphMap>;
  messages: UiMessages;
  locale: string;
  strings: UiStrings;
  renderLink: UiLinkRenderer;
  storage: UiStorage;
}

const renderAnchor: UiLinkRenderer = (props) => <a {...props} />;

const defaultContext: UiContextValue = {
  glyphs: {},
  messages: en,
  locale: 'en-US',
  strings: defaultStrings,
  renderLink: renderAnchor,
  storage: createMemoryStorage(),
};

const UiContext = createContext<UiContextValue>(defaultContext);

const jsonCodec: PersistCodec<never> = {
  parse: (raw) => JSON.parse(raw) as never,
  stringify: (value) => JSON.stringify(value),
};

/**
 * Supplies glyphs, text, locale, link rendering and storage to every component below it.
 * Components work without a provider, using Heroicons, English text and in-memory storage.
 * Nested providers merge over their parent. Changing `messages` or `locale` re-renders the
 * components below in the new language.
 */
export function UiProvider({
  icons,
  messages,
  locale,
  renderLink,
  navigate,
  useHref,
  storage,
  children,
}: UiProviderProps) {
  const parent = useContext(UiContext);
  const text = useMemo(() => {
    const merged = messages ? { ...parent.messages, ...omitUndefined(messages) } : parent.messages;
    const resolvedLocale = locale ?? parent.locale;
    const isSameText = merged === parent.messages && resolvedLocale === parent.locale;
    return {
      messages: merged,
      locale: resolvedLocale,
      strings: isSameText ? parent.strings : compileStrings(merged, resolvedLocale),
    };
  }, [parent.messages, parent.locale, parent.strings, messages, locale]);
  const value = useMemo<UiContextValue>(
    () => ({
      ...text,
      glyphs: icons ? { ...parent.glyphs, ...omitUndefined(icons) } : parent.glyphs,
      renderLink: renderLink ?? parent.renderLink,
      storage: storage ?? parent.storage,
    }),
    [text, parent.glyphs, parent.renderLink, parent.storage, icons, renderLink, storage],
  );

  let content = (
    <OverlayPresenceScope>
      <UiContext.Provider value={value}>{children}</UiContext.Provider>
    </OverlayPresenceScope>
  );
  if (navigate) {
    content = (
      <RouterProvider navigate={navigate} {...(useHref ? { useHref } : {})}>
        {content}
      </RouterProvider>
    );
  }
  if (locale) content = <I18nProvider locale={locale}>{content}</I18nProvider>;
  return content;
}

/** Resolves a provider override, using the supplied default when the key is unlisted. */
export function useGlyph(name: GlyphName, fallback: GlyphComponent): GlyphComponent {
  return useContext(UiContext).glyphs[name] ?? fallback;
}

/** The built-in text in the provider's language. */
export function useUiStrings(): UiStrings {
  return useContext(UiContext).strings;
}

/**
 * Formats the host's own ICU MessageFormat messages with the provider's locale, so its sentences
 * follow the same plural rules, numbers and lists as the built-in text.
 */
export function useFormatMessage(): UiFormatMessage {
  const { locale } = useContext(UiContext);
  return useCallback((message, values) => formatMessage(message, values, locale), [locale]);
}

/** The storage adapter for persisted layout state. */
export function useUiStorage(): UiStorage {
  return useContext(UiContext).storage;
}

/** Renders a link through the provider's link renderer. */
export function UiLink(props: UiLinkProps) {
  return useContext(UiContext).renderLink(props);
}

/** Draws an imported icon as decoration (hidden from assistive technology). */
export function Glyph({ icon: Component, className }: GlyphProps) {
  return (
    <Component
      className={mergeClassNames('ui-glyph', className)}
      data-glyph={Component.glyphName}
      aria-hidden="true"
      focusable="false"
    />
  );
}

/**
 * State persisted through the provider storage adapter under `key`. Without a key it is plain state.
 * Changing the key or adapter reads the new store. Unreadable values fall back to `initialValue`.
 */
export function usePersistentState<T>(
  key: string | undefined,
  initialValue: T | (() => T),
  codec: PersistCodec<T> = jsonCodec as PersistCodec<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const adapter = useUiStorage();
  const storage = key === undefined ? undefined : adapter;
  // Plain state does not belong to an adapter; persisted state belongs to both adapter and key.
  const read = (): T => {
    const fallback = () =>
      typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    if (key === undefined || storage === undefined) return fallback();
    const raw = storage.getItem(key);
    if (raw === null) return fallback();
    try {
      return codec.parse(raw);
    } catch {
      return fallback();
    }
  };

  const [state, setState] = useState(() => ({ key, storage, value: read() }));
  let current = state;
  if (state.key !== key || state.storage !== storage) {
    current = { key, storage, value: read() };
    setState(current);
  }

  const latest = useLatest({ ...current, codec });

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const { key, storage, codec, value } = latest.current;
      const next = typeof action === 'function' ? (action as (previous: T) => T)(value) : action;
      latest.current.value = next;
      if (key !== undefined && storage !== undefined) storage.setItem(key, codec.stringify(next));
      setState({ key, storage, value: next });
    },
    [latest],
  );

  return [current.value, setValue];
}
