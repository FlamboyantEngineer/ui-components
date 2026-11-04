import { type JSX, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Link, type LinkProps, type LinkRenderState } from '../../src/components/link/link.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

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
  const [options, setOptions] = useState('none');
  return (
    <div data-lab-demo="router">
      <UiProvider
        navigate={(href, routerOptions) => {
          setRoute(href);
          setOptions(routerOptions === undefined ? 'none' : JSON.stringify(routerOptions));
        }}
        useHref={(href) => `#${href}`}
      >
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
          <li>
            <Link
              href="/recipes/pear-tart"
              routerOptions={{ scroll: false, replace: true }}
              isStandalone
            >
              Pear tart, replacing the route
            </Link>
          </li>
        </ul>
      </UiProvider>
      <p>
        Current route: <output data-lab-output="route">{route}</output>
      </p>
      <p>
        Router options: <output data-lab-output="router-options">{options}</output>
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

/** The state a swapped link was given, named in words. */
function describeState(state: LinkRenderState): string {
  const parts = [
    state.isHovered ? 'hovered' : null,
    state.isPressed ? 'pressed' : null,
    state.isFocusVisible ? 'focus visible' : null,
    state.isDisabled ? 'disabled' : null,
    state.isCurrent ? 'current' : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'idle';
}

/**
 * A host's own element: an anchor when the link navigates, a span otherwise, with a marker and the
 * received state beside the text.
 */
const swappedLink: NonNullable<LinkProps['render']> = ({ children, ...props }, state) => {
  const content = (
    <>
      {children}
      <span aria-hidden="true" data-lab-output="link-state">
        {` [${describeState(state)}]`}
      </span>
    </>
  );
  if (typeof props.href === 'string' && props['aria-disabled'] === undefined) {
    return (
      <a {...props} data-lab-swapped="">
        {content}
      </a>
    );
  }
  const { href: _href, target: _target, rel: _rel, ...spanProps } = props;
  return (
    <span {...(spanProps as JSX.IntrinsicElements['span'])} data-lab-swapped="">
      {content}
    </span>
  );
};

/** Swapped links whose press and hover callbacks write to a log. */
function SwappedLinks() {
  const [log, setLog] = useState<string[]>([]);
  const [route, setRoute] = useState('/recipes');
  const logged = (name: string) => {
    const add = (entry: string) => setLog((current) => [...current, `${name}: ${entry}`]);
    return {
      onPress: () => add('press'),
      onPressStart: () => add('pressStart'),
      onPressEnd: () => add('pressEnd'),
      onPressChange: (isPressed: boolean) => add(`pressChange ${String(isPressed)}`),
      onHoverStart: () => add('hoverStart'),
      onHoverEnd: () => add('hoverEnd'),
      onHoverChange: (isHovering: boolean) => add(`hoverChange ${String(isHovering)}`),
    };
  };
  return (
    <div data-lab-demo="render">
      <UiProvider navigate={setRoute} useHref={(href) => `#${href}`}>
        <ul>
          <li>
            <Link href="/recipes/apple-pie" render={swappedLink} {...logged('Navigation')}>
              Apple pie
            </Link>
          </li>
          <li>
            <Link render={swappedLink} {...logged('Press only')}>
              Show the method
            </Link>
          </li>
          <li>
            <Link href="/recipes/fig-roll" isDisabled render={swappedLink} {...logged('Disabled')}>
              Fig roll
            </Link>
          </li>
        </ul>
      </UiProvider>
      <p>
        Current route: <output data-lab-output="route">{route}</output>
      </p>
      <Button size="sm" variant="ghost" onPress={() => setLog([])}>
        Clear log
      </Button>
      <ol aria-label="Link events" data-lab-output="events">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
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
      description="Inline links stay underlined so colour is not the only cue; the external link says it opens a new tab, and its caller rel (nofollow) keeps noopener and noreferrer."
    >
      <p data-lab-demo="prose" style={{ maxInlineSize: 520 }}>
        Autumn brings <Link href="#lab-apples">apples</Link>, <Link href="#lab-pears">pears</Link>{' '}
        and quinces. For what is in season near you, read the{' '}
        <Link href="https://example.com/seasons" isExternal rel="nofollow">
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
      description="Under a provider with navigate, links change the route without loading a page; useHref maps the route to the anchor's href. The pear tart link passes routerOptions, which navigate receives with the href."
    >
      <ClientNavigation />
    </LabSection>
    <LabSection
      title="Swapped element and events"
      description="render swaps each link for the host's own anchor or span, with a marker and the state it received in brackets: hover, press or tab to them. The navigation link still navigates through the provider; the press-only and disabled links are spans. Their press and hover callbacks write to the log; the disabled link writes nothing."
    >
      <SwappedLinks />
    </LabSection>
    <LabSection
      title="Links without an href"
      description="A pressable link runs an action in place; Enter or a click toggles the list."
    >
      <ShowMore />
    </LabSection>
  </>,
);
