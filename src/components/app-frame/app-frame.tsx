'use client';

import { createContext, useContext, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ProjectionContent,
  ProjectionProvider,
  useProjectedContent,
} from '../projection/projection.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** A region around the frame's main content that `AppFrameContent` can fill from anywhere below. */
export type AppFrameRegion =
  'top-bar' | 'navigation' | 'start-panel' | 'end-panel' | 'bottom-panel' | 'status-bar';

/** A part of the band that `AppFrameBandContent` can fill from anywhere below the frame. */
export type AppFrameBandSlot = 'leading' | 'status' | 'tools' | 'actions';

/** The regions a frame names for assistive technology. */
export type AppFrameLabelledRegion = 'main' | 'start-panel' | 'end-panel' | 'bottom-panel';

export interface AppFrameProps extends BaseProps {
  /** The main content. */
  children?: ReactNode;
  /** The bar along the top, such as an `AppFrameBand`: the banner. */
  topBar?: ReactNode;
  /** The side navigation at the inline start, such as a `NavigationRail`. */
  navigation?: ReactNode;
  /** A panel between the navigation and the main content. */
  startPanel?: ReactNode;
  /** A panel at the inline end. */
  endPanel?: ReactNode;
  /** A panel below the main content. */
  bottomPanel?: ReactNode;
  /** The bar along the bottom, such as a `StatusBar`'s items: the content information. */
  statusBar?: ReactNode;
  /** Names for the main region and the panels, replacing the provider's panel names. */
  labels?: Partial<Record<AppFrameLabelledRegion, string>> | undefined;
  /**
   * The frame sits inside a page or another frame instead of being the page: its regions are
   * plain containers rather than landmarks, and the root is a group named by `label`.
   */
  isEmbedded?: boolean | undefined;
  /** Names an embedded frame. */
  label?: string | undefined;
}

export interface AppFrameContentProps {
  /** The region of the nearest `AppFrame` to fill. */
  region: AppFrameRegion;
  /** The content, which replaces the region's own while mounted. */
  children?: ReactNode;
}

type RegionElement = 'header' | 'aside' | 'footer' | 'div';

interface RegionSpec {
  region: AppFrameRegion;
  element: RegionElement;
  panel?: 'start' | 'end' | 'bottom';
}

const hooks = createHooks('app-frame', [
  'skip-link',
  'top-bar',
  'navigation',
  'start-panel',
  'main',
  'bottom-panel',
  'end-panel',
  'status-bar',
]);

const regions: readonly AppFrameRegion[] = [
  'top-bar',
  'navigation',
  'start-panel',
  'end-panel',
  'bottom-panel',
  'status-bar',
];

/** The projection slot of a frame region or of a band slot, private to the frame's provider. */
export function toAppFrameSlot(name: string): string {
  return `ui-app-frame:${name}`;
}

/** The band slots `AppFrameBandContent` fills. */
const appFrameBandSlots: readonly AppFrameBandSlot[] = ['leading', 'status', 'tools', 'actions'];

/** Every slot a frame's projection provider owns; other slots reach the provider above the frame. */
const appFrameSlots = [...regions, ...appFrameBandSlots].map(toAppFrameSlot);
const InsideAppFrameContext = createContext(false);

const leadingRegions: readonly RegionSpec[] = [
  { region: 'top-bar', element: 'header' },
  { region: 'navigation', element: 'div' },
  { region: 'start-panel', element: 'aside', panel: 'start' },
];

const trailingRegions: readonly RegionSpec[] = [
  { region: 'bottom-panel', element: 'aside', panel: 'bottom' },
  { region: 'end-panel', element: 'aside', panel: 'end' },
  { region: 'status-bar', element: 'footer' },
];

type RegionContents = Record<AppFrameRegion, ReactNode>;

type AppFrameLayoutProps = Omit<
  AppFrameProps,
  'topBar' | 'navigation' | 'startPanel' | 'endPanel' | 'bottomPanel' | 'statusBar'
> & { own: RegionContents };

/** Each region's content: what a descendant projects into it, else the frame's own prop. */
function useRegionContents(own: RegionContents): RegionContents {
  return {
    'top-bar': useProjectedContent(toAppFrameSlot('top-bar')) ?? own['top-bar'],
    navigation: useProjectedContent(toAppFrameSlot('navigation')) ?? own.navigation,
    'start-panel': useProjectedContent(toAppFrameSlot('start-panel')) ?? own['start-panel'],
    'end-panel': useProjectedContent(toAppFrameSlot('end-panel')) ?? own['end-panel'],
    'bottom-panel': useProjectedContent(toAppFrameSlot('bottom-panel')) ?? own['bottom-panel'],
    'status-bar': useProjectedContent(toAppFrameSlot('status-bar')) ?? own['status-bar'],
  };
}

interface FrameRegionProps {
  spec: RegionSpec;
  content: ReactNode;
  isEmbedded: boolean;
  labels: AppFrameProps['labels'];
}

/** One region around the main content: a landmark element on a page, a plain `<div>` embedded. */
function FrameRegion({ spec, content, isEmbedded, labels }: FrameRegionProps) {
  const strings = useUiStrings();
  if (isEmptyNode(content)) return null;
  const Element = isEmbedded ? 'div' : spec.element;
  const label =
    spec.panel && !isEmbedded
      ? (labels?.[spec.region as AppFrameLabelledRegion] ?? strings.appFramePanel(spec.panel))
      : undefined;
  return (
    <Element {...hooks.slot(spec.region)} aria-label={label}>
      {content}
    </Element>
  );
}

/** The frame's regions, inside its projection provider so they render what descendants project. */
function AppFrameLayout({
  children,
  className,
  labels,
  isEmbedded = false,
  label,
  own,
  ...rest
}: AppFrameLayoutProps) {
  const strings = useUiStrings();
  const contents = useRegionContents(own);
  const mainId = `${useId()}-main`;
  // Typed as the narrower of the two elements the main region may be, so it fits both.
  const mainRef = useRef<HTMLDivElement>(null);
  const Main = isEmbedded ? 'div' : 'main';
  // Focus moves without touching the address, which a hash router may own.
  const skipToMain = (event: MouseEvent) => {
    event.preventDefault();
    mainRef.current?.focus();
  };
  const renderRegion = (spec: RegionSpec) => (
    <FrameRegion
      key={spec.region}
      spec={spec}
      content={contents[spec.region]}
      isEmbedded={isEmbedded}
      labels={labels}
    />
  );
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { embedded: isEmbedded } })}
      role={isEmbedded ? 'group' : undefined}
      aria-label={isEmbedded ? label : undefined}
    >
      <VisuallyHidden elementType="span" isFocusable>
        <a {...hooks.slot('skip-link')} href={`#${mainId}`} onClick={skipToMain}>
          {strings.skipToMainContent}
        </a>
      </VisuallyHidden>
      {leadingRegions.map(renderRegion)}
      <Main
        {...hooks.slot('main')}
        ref={mainRef}
        id={mainId}
        tabIndex={-1}
        aria-label={isEmbedded ? undefined : labels?.main}
      >
        {children}
      </Main>
      {trailingRegions.map(renderRegion)}
    </div>
  );
}

/**
 * The frame of an application: a top bar, side navigation, panels around the main content and a
 * status bar, each a landmark, with a skip link to the main content. Descendants fill its regions
 * through `AppFrameContent` and its band through `AppFrameBandContent`.
 */
export function AppFrame({
  topBar,
  navigation,
  startPanel,
  endPanel,
  bottomPanel,
  statusBar,
  ...rest
}: AppFrameProps) {
  const own: RegionContents = {
    'top-bar': topBar,
    navigation,
    'start-panel': startPanel,
    'end-panel': endPanel,
    'bottom-panel': bottomPanel,
    'status-bar': statusBar,
  };
  return (
    <ProjectionProvider slots={appFrameSlots}>
      <InsideAppFrameContext value>
        <AppFrameLayout {...rest} own={own} />
      </InsideAppFrameContext>
    </ProjectionProvider>
  );
}

/**
 * Whether an `AppFrame` is above, so frame content projects into it. Without one, frame content
 * renders in place, even below a projection provider of the host's own.
 */
export function useIsInsideAppFrame(): boolean {
  return useContext(InsideAppFrameContext);
}

/**
 * Fills a region of the nearest `AppFrame` from anywhere below it, in place of the region's own.
 * Without a frame above, it renders its children in place.
 */
export function AppFrameContent({ region, children }: AppFrameContentProps) {
  const slot = toAppFrameSlot(region);
  if (!useIsInsideAppFrame()) return <>{children}</>;
  return <ProjectionContent slot={slot}>{children}</ProjectionContent>;
}
