import { useState } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../../src/components/breadcrumb/breadcrumb.js';
import { UiProvider } from '../../src/core/provider.js';
import type { GlyphComponentProps } from '../../src/core/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;

const trails: Record<string, BreadcrumbItem[]> = {
  'four crumbs': [
    { label: 'Home', href: '#home' },
    { label: 'Recipes', href: '#recipes' },
    { label: 'Desserts', href: '#desserts' },
    { label: 'Lemon tart' },
  ],
  'one crumb': [{ label: 'Home' }],
  'crumb without link': [
    { label: 'Home', href: '#home' },
    { label: 'Archive' },
    { label: 'Winter menu' },
  ],
};

const longTrail: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Seasonal recipes from the coast', href: '#seasonal' },
  { label: 'Tables, figures and captions for the printed edition' },
];

function RoutedTrail() {
  const [route, setRoute] = useState('(none)');
  return (
    <UiProvider
      navigate={(href) => setRoute(href)}
      renderLink={(props) => <a {...props} data-lab-routed="" />}
    >
      <Breadcrumb
        aria-label="Routed trail"
        items={[
          { id: 'home', label: 'Home', href: '/home' },
          { id: 'recipes', label: 'Recipes', href: '/recipes' },
          { id: 'tart', label: 'Lemon tart' },
        ]}
      />
      <p data-lab-output="">Navigated to {route}</p>
    </UiProvider>
  );
}

function ActionTrail() {
  const [action, setAction] = useState('(none)');
  return (
    <>
      <Breadcrumb
        aria-label="Trail with actions"
        items={[
          { id: 'home', label: 'Home' },
          { id: 'recipes', label: 'Recipes' },
          { id: 'tart', label: 'Lemon tart' },
        ]}
        onAction={(id) => setAction(String(id))}
      />
      <p data-lab-output="">Activated {action}</p>
    </>
  );
}

const deepTrail: BreadcrumbItem[] = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'recipes', label: 'Recipes', href: '#recipes' },
  { id: 'desserts', label: 'Desserts', href: '#desserts' },
  { id: 'tarts', label: 'Tarts and pies', href: '#tarts' },
  { id: 'citrus', label: 'Citrus', href: '#citrus' },
  { id: 'lemon', label: 'Lemon tart' },
];
const frames = { wide: 560, medium: 320, narrow: 220 } as const;

function SiblingTrail() {
  const [picked, setPicked] = useState('(none)');
  const labels = { drinks: 'Drinks', menus: 'Menus', cake: 'Lemon cake', pie: 'Key lime pie' };
  const sibling = (id: keyof typeof labels) => ({ id, label: labels[id] });
  return (
    <div data-lab-demo="siblings">
      <Breadcrumb
        aria-label="Trail with nearby places"
        onAction={(id) => setPicked(labels[id as keyof typeof labels] ?? String(id))}
        items={[
          { id: 'home', label: 'Home', href: '#home' },
          {
            id: 'recipes',
            label: 'Recipes',
            href: '#recipes',
            menu: [sibling('drinks'), sibling('menus')],
          },
          {
            id: 'tart',
            label: 'Lemon tart',
            menu: [sibling('cake'), sibling('pie')],
          },
        ]}
      />
      <p data-lab-output="sibling">Picked {picked}</p>
    </div>
  );
}

/** A menu trail that grows past two crumbs and back: its crumbs keep their elements and focus. */
function GrowingTrail() {
  const [isDeeper, setDeeper] = useState(false);
  const items: BreadcrumbItem[] = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'recipes', label: 'Recipes', href: '#recipes' },
    ...(isDeeper ? [{ id: 'tart', label: 'Lemon tart' }] : []),
  ];
  return (
    <div data-lab-trail="growing" style={{ width: 320 }}>
      <Breadcrumb aria-label="Growing trail" items={items} overflow="menu" />
      <label>
        <input
          type="checkbox"
          checked={isDeeper}
          onChange={(event) => setDeeper(event.target.checked)}
        />{' '}
        One level deeper
      </label>
    </div>
  );
}

const separators = {
  'slash glyph': SlashGlyph,
  'dot element': (
    <svg viewBox="0 0 16 16" width="16" height="16">
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  ),
  'none (null)': null,
  'none (false)': false,
} as const;

/** A host's own separator glyph: a slash. */
function SlashGlyph(props: GlyphComponentProps) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" {...props}>
      <path d="M11 2 5 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

mountLab(
  <>
    <LabSection title="Trails and sizes">
      <StateMatrix
        axes={{ trail: Object.keys(trails), size: sizes }}
        render={({ trail, size }) => (
          <Breadcrumb
            aria-label={`Trail, ${trail}, ${size}`}
            items={trails[trail] ?? []}
            size={size}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="States and truncation"
      description="Labels ellipsize only when the bounded row runs out of width; rest the pointer on a cut label, or move focus to its crumb, to read it whole. Focus a crumb and use the arrow keys, Home and End."
    >
      <StateMatrix
        axes={{ state: ['default', 'disabled'], width: ['auto', '240px'] }}
        render={({ state, width }) => (
          <div style={{ width: width === 'auto' ? undefined : 240 }}>
            <Breadcrumb
              aria-label={`Long trail, ${state}, ${width}`}
              items={longTrail}
              isDisabled={state === 'disabled'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Routing"
      description="Links render through the provider's link renderer and navigate through its router."
    >
      <RoutedTrail />
    </LabSection>
    <LabSection title="Actions" description="Crumbs without links report their id to onAction.">
      <ActionTrail />
    </LabSection>
    <LabSection
      title="Overflow menu"
      description="Six crumbs in frames of 560, 320 and 220 pixels. The first and current crumbs stay; the middle ones that do not fit move into a menu after the first."
    >
      <StateMatrix
        axes={{ width: ['wide', 'medium', 'narrow'] }}
        render={({ width }) => (
          <div data-lab-frame="" style={{ width: frames[width] }}>
            <Breadcrumb aria-label={`Deep trail, ${width}`} items={deepTrail} overflow="menu" />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Growing trail"
      description="Tick One level deeper to add a third crumb, untick it to go back up. Home keeps its element and focus while the trail starts and stops collapsing."
    >
      <GrowingTrail />
    </LabSection>
    <LabSection
      title="Narrower than the endpoints"
      description="120 pixel frames, narrower than the two endpoints. The first and current crumbs never leave: every middle crumb moves into the menu and the two endpoints ellipsize; rest the pointer on one to read it whole. The current crumb is never in the menu."
    >
      <StateMatrix
        axes={{ state: ['default', 'disabled', 'right to left'] }}
        render={({ state }) => {
          const trail = (
            <div data-lab-frame="" style={{ width: 120 }}>
              <Breadcrumb
                aria-label={`Tiny trail, ${state}`}
                items={deepTrail}
                overflow="menu"
                isDisabled={state === 'disabled'}
              />
            </div>
          );
          return state === 'right to left' ? (
            <UiProvider locale="ar-EG">
              <div dir="rtl">{trail}</div>
            </UiProvider>
          ) : (
            trail
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Custom and suppressed separators"
      description="separator takes an imported glyph component or an element in place of the chevron; null or false draws none. Each trail keeps its navigation landmark and list, short and collapsed into a menu, in both reading directions."
    >
      <StateMatrix
        axes={{
          separator: Object.keys(separators) as (keyof typeof separators)[],
          trail: ['short', 'overflow'],
          direction: ['ltr', 'rtl'],
        }}
        render={({ separator, trail, direction }) => {
          const crumbs = (
            <div data-lab-frame="" style={{ width: trail === 'overflow' ? 220 : 420 }}>
              <Breadcrumb
                aria-label={`Trail, ${separator}, ${trail}, ${direction}`}
                items={trail === 'overflow' ? deepTrail : (trails['four crumbs'] ?? [])}
                overflow={trail === 'overflow' ? 'menu' : 'truncate'}
                separator={separators[separator]}
              />
            </div>
          );
          return direction === 'rtl' ? (
            <UiProvider locale="ar-EG">
              <div dir="rtl">{crumbs}</div>
            </UiProvider>
          ) : (
            crumbs
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Nearby places"
      description="A crumb with a menu offers the places beside it from a button after its link."
    >
      <SiblingTrail />
    </LabSection>
  </>,
);
