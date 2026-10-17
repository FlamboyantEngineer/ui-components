import { useState } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '../../src/components/breadcrumb/breadcrumb.js';
import { UiProvider } from '../../src/core/provider.js';
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
      description="Labels ellipsize only when the bounded row runs out of width. Focus a crumb and use the arrow keys, Home and End."
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
  </>,
);
