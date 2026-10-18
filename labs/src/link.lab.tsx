import { useState } from 'react';
import { Link } from '../../src/components/link/link.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Desserts'];
const extraFruit = ['Quinces', 'Medlars', 'Persimmons'];

function stateProps(state: string) {
  if (state === 'current') return { href: '#lab-current', 'aria-current': 'page' as const };
  if (state === 'disabled') return { href: '#lab-disabled', isDisabled: true };
  if (state === 'new tab') return { href: 'https://example.com/seasons', isExternal: true };
  if (state === 'no href') return {};
  return { href: '#lab-rest' };
}

function ClientNavigation() {
  const [route, setRoute] = useState('/recipes');
  return (
    <div data-lab-demo="router">
      <UiProvider navigate={setRoute} useHref={(href) => `#${href}`}>
        <ul>
          <li>
            <Link href="/recipes/lemon-tart" isStandalone>
              Lemon tart
            </Link>
          </li>
          <li>
            <Link href="/recipes/plum-crumble" isStandalone>
              Plum crumble
            </Link>
          </li>
        </ul>
      </UiProvider>
      <p>
        Current route: <output data-lab-output="route">{route}</output>
      </p>
    </div>
  );
}

function ShowMore() {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <div data-lab-demo="press">
      <ul>
        <li>Apples</li>
        <li>Pears</li>
        {isExpanded ? extraFruit.map((name) => <li key={name}>{name}</li>) : null}
      </ul>
      <Link isStandalone onPress={() => setExpanded((value) => !value)}>
        {isExpanded ? 'Show fewer fruit' : `Show ${extraFruit.length} more fruit`}
      </Link>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, underline and placement"
      description="Primary and secondary emphasis, the three underline policies, in a sentence and on their own. Hover or tab to a link to see its hover underline."
    >
      <StateMatrix
        axes={{
          placement: ['inline', 'standalone'],
          variant: ['primary', 'secondary'],
          underline: ['always', 'hover', 'none'],
        }}
        render={({ placement, variant, underline }) =>
          placement === 'inline' ? (
            <p>
              Pick a{' '}
              <Link href="#lab-ripe" variant={variant} underline={underline}>
                ripe pear
              </Link>{' '}
              today.
            </p>
          ) : (
            <Link href="#lab-ripe" variant={variant} underline={underline} isStandalone>
              All pears
            </Link>
          )
        }
      />
    </LabSection>
    <LabSection
      title="States"
      description="At rest, the current page, disabled, without an href (a pressable link) and opening a new tab."
    >
      <StateMatrix
        axes={{
          state: ['rest', 'current', 'disabled', 'no href', 'new tab'],
          variant: ['primary', 'secondary'],
        }}
        render={({ state, variant }) => (
          <Link {...stateProps(state)} variant={variant} isStandalone>
            Seasonal fruit
          </Link>
        )}
      />
    </LabSection>
    <LabSection
      title="Running text"
      description="Inline links stay underlined so colour is not the only cue; the external link says it opens a new tab."
    >
      <p data-lab-demo="prose" style={{ maxInlineSize: 520 }}>
        Autumn brings <Link href="#lab-apples">apples</Link>, <Link href="#lab-pears">pears</Link>{' '}
        and quinces. For what is in season near you, read the{' '}
        <Link href="https://example.com/seasons" isExternal>
          seasonal produce guide
        </Link>
        .
      </p>
    </LabSection>
    <LabSection
      title="A list of links"
      description="Standalone links underline on hover; the current category carries aria-current."
    >
      <nav aria-label="Recipe categories" data-lab-demo="nav">
        <ul>
          {categories.map((category) => (
            <li key={category}>
              <Link
                href={`#lab-${category.toLowerCase()}`}
                isStandalone
                variant="secondary"
                aria-current={category === 'Desserts' ? 'page' : undefined}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </LabSection>
    <LabSection
      title="Client-side navigation"
      description="Under a provider with navigate, links change the route without loading a page; useHref maps the route to the anchor's href."
    >
      <ClientNavigation />
    </LabSection>
    <LabSection
      title="Links without an href"
      description="A pressable link runs an action in place; Enter or a click toggles the list."
    >
      <ShowMore />
    </LabSection>
  </>,
);
