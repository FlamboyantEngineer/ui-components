'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SetStateAction,
} from 'react';
import { I18nProvider, RouterProvider, useLocale } from '../primitives/index.js';
import type { GlyphComponent, GlyphMap, GlyphName } from './glyph-types.js';
import { mergeClassNames } from './hooks.js';
import { OverlayPresenceScope } from './overlay-presence.js';
import { DEFAULT_LOCALE, formatMessage, type MessageValues } from './message-format.js';
import { createMemoryStorage, type UiStorage } from './storage.js';
import { en } from './locales/index.js';
import { compileStrings, getDefaultStrings, type UiMessages, type UiStrings } from './strings.js';
import { omitUndefined } from '../utils/omit-undefined.js';
import { useLatest } from '../utils/use-latest.js';
import { useShallowStable } from '../utils/use-shallow-stable.js';

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
  /**
   * Replaces built-in glyphs by name. Unlisted glyphs keep their default (or the outer provider's).
   * Compared by its entries, so an object written inline costs nothing while they stay the same.
   */
  icons?: Partial<GlyphMap> | undefined;
  /**
   * A language file, or part of one: built-in text by key, as ICU MessageFormat messages. Unlisted
   * keys keep the outer provider's text, and English below every provider. Compared by its entries,
   * so an object written inline recompiles nothing while they stay the same.
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
  /**
   * The clock components read now and today from. Defaults to the current time. Server renders and
   * hydration never read it, so their output matches (`useNow`).
   */
  getNow?: (() => Date) | undefined;
  /**
   * The IANA time zone days and times are read in, such as `Europe/Paris`. Defaults to the
   * browser's; server renders and hydration use UTC until it is given.
   */
  timeZone?: string | undefined;
  /** The components that use these services. */
  children?: ReactNode;
}

export interface GlyphProps {
  /** The imported icon component to draw. */
  icon: GlyphComponent;
  /** Usually the host component's slot class, e.g. `ui-button__icon`. */
  className?: string | undefined;
}

/**
 * How a persisted value is stored as text and read back. `parse` checks the shape it expects and
 * throws on anything else, so stale or corrupted data falls back to the initial value; build one
 * with `createJsonCodec`, or use `booleanCodec`, `numberCodec`, `keyCodec` or `keyListCodec`.
 */
export interface PersistCodec<T> {
  parse(raw: string): T;
  stringify(value: T): string;
}

/** How `usePersistentState` stores its value. */
export interface PersistentStateOptions<T> {
  /** How the value is written to and read from the adapter, checking its shape as it is read. */
  codec: PersistCodec<T>;
  /**
   * Milliseconds the adapter write waits after the last change, so a burst of changes, such as
   * typing, writes once. The state itself changes at once. Defaults to 0, writing each change.
   */
  writeDelay?: number | undefined;
}

/** The value, its setter, and `flush`, which writes a delayed change to the adapter now. */
export type PersistentState<T> = [T, Dispatch<SetStateAction<T>>, () => void];

/** A change waiting to be written, with the store it belongs to; encoded only when written. */
interface PendingWrite {
  storage: UiStorage;
  key: string;
  encode: () => string;
}

/**
 * Writes changes to the adapter after `writeDelay`, keeping only the last one. The pending write
 * goes out at once when the key or adapter changes, the component unmounts or the page hides.
 */
function useDelayedWrite(owner: { key: string | undefined; storage: UiStorage | undefined }) {
  const pending = useRef<PendingWrite | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const write = pending.current;
    pending.current = null;
    write?.storage.setItem(write.key, write.encode());
  }, []);
  const schedule = useCallback(
    (write: PendingWrite, delay: number) => {
      pending.current = write;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush],
  );
  // Before the next owner's value is read or written, the last owner's change lands.
  useLayoutEffect(() => flush, [flush, owner.key, owner.storage]);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [flush]);
  return useMemo(() => ({ schedule, flush }), [schedule, flush]);
}

/** Client-side navigation for React Aria links, inherited by nested providers. */
interface UiRouter {
  navigate: UiNavigate;
  useHref?: UiHref | undefined;
}

interface UiContextValue {
  glyphs: Partial<GlyphMap>;
  messages: UiMessages;
  locale: string;
  strings: UiStrings;
  renderLink: UiLinkRenderer;
  router: UiRouter;
  storage: UiStorage;
  clock: UiClock;
}

/** The clock and time zone a provider supplies; unset values fall back to the device's. */
export interface UiClock {
  getNow: () => Date;
  timeZone: string | undefined;
}

const renderAnchor: UiLinkRenderer = (props) => <a {...props} />;

/**
 * Loads `href` as a native link would. React Aria only calls it for a same-window, same-origin link
 * without modifier keys or `download`, and opens every other link natively itself.
 */
const navigateNatively: UiNavigate = (href) => window.location.assign(href);

const defaultContext: UiContextValue = {
  glyphs: {},
  messages: en,
  locale: DEFAULT_LOCALE,
  get strings() {
    return getDefaultStrings();
  },
  renderLink: renderAnchor,
  router: { navigate: navigateNatively },
  storage: createMemoryStorage(),
  clock: { getNow: () => new Date(), timeZone: undefined },
};

const UiContext = createContext<UiContextValue>(defaultContext);

const noOption = {};

/** An optional options object, or the one an earlier render passed while its entries are the same. */
function useShallowStableOption<T extends object>(option: T | undefined): T | undefined {
  const stable = useShallowStable<object>(option ?? noOption) as T;
  return option && stable;
}

/**
 * Supplies glyphs, text, locale, link rendering and storage to every component below it.
 * Components work without a provider, using Heroicons, English text and in-memory storage.
 * Nested providers merge over their parent. Changing any option re-renders the components below
 * without remounting them: the locale and router wrappers are always present, and inherit the
 * outer ones while their option is absent.
 */
export function UiProvider({
  icons: iconsProp,
  messages: messagesProp,
  locale,
  renderLink,
  navigate,
  useHref,
  storage,
  getNow,
  timeZone,
  children,
}: UiProviderProps) {
  const parent = useContext(UiContext);
  const icons = useShallowStableOption(iconsProp);
  const messages = useShallowStableOption(messagesProp);
  // The locale React Aria uses below: this provider's, else the outer one's (a parent provider's,
  // a host's I18nProvider or the browser's), so the text formats as the components do.
  const outerLocale = useLocale().locale;
  const resolvedLocale = locale ?? outerLocale;
  const text = useMemo(() => {
    const merged = messages ? { ...parent.messages, ...omitUndefined(messages) } : parent.messages;
    const isSameText = merged === parent.messages && resolvedLocale === parent.locale;
    return {
      messages: merged,
      locale: resolvedLocale,
      strings: isSameText ? parent.strings : compileStrings(merged, resolvedLocale),
    };
  }, [parent.messages, parent.locale, parent.strings, messages, resolvedLocale]);
  const router = useMemo(
    () => (navigate ? { navigate, useHref } : parent.router),
    [navigate, useHref, parent.router],
  );
  const clock = useMemo(
    () =>
      getNow || timeZone
        ? { getNow: getNow ?? parent.clock.getNow, timeZone: timeZone ?? parent.clock.timeZone }
        : parent.clock,
    [getNow, timeZone, parent.clock],
  );
  const value = useMemo<UiContextValue>(
    () => ({
      ...text,
      glyphs: icons ? { ...parent.glyphs, ...omitUndefined(icons) } : parent.glyphs,
      renderLink: renderLink ?? parent.renderLink,
      router,
      storage: storage ?? parent.storage,
      clock,
    }),
    [
      text,
      parent.glyphs,
      parent.renderLink,
      parent.storage,
      icons,
      renderLink,
      router,
      storage,
      clock,
    ],
  );
  // The same wrappers whatever the options, so adding or removing one never remounts the children.
  return (
    <I18nProvider locale={resolvedLocale}>
      <RouterProvider
        navigate={router.navigate}
        {...(router.useHref ? { useHref: router.useHref } : {})}
      >
        <OverlayPresenceScope>
          <UiContext value={value}>{children}</UiContext>
        </OverlayPresenceScope>
      </RouterProvider>
    </I18nProvider>
  );
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

/** The provider's clock and time zone, inherited from outer providers. */
export function useUiClock(): UiClock {
  return useContext(UiContext).clock;
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
 * With `writeDelay`, the adapter write follows the last change of a burst; `flush` writes it now.
 */
export function usePersistentState<T>(
  key: string | undefined,
  initialValue: T | (() => T),
  options: PersistentStateOptions<T>,
): PersistentState<T> {
  const { codec, writeDelay = 0 } = options;
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

  const latest = useLatest({ ...current, codec, writeDelay });
  const delayed = useDelayedWrite(current);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const { key, storage, codec, value, writeDelay } = latest.current;
      const next = typeof action === 'function' ? (action as (previous: T) => T)(value) : action;
      latest.current.value = next;
      if (key !== undefined && storage !== undefined) {
        const write = { storage, key, encode: () => codec.stringify(next) };
        delayed.schedule(write, writeDelay);
        if (writeDelay <= 0) delayed.flush();
      }
      setState({ key, storage, value: next });
    },
    [latest, delayed],
  );

  return [current.value, setValue, delayed.flush];
}
