import { useState } from 'react';
import { Link } from '../../src/components/link/link.js';
import { Button } from '../../src/components/button/button.js';
import {
  HoverCard,
  HoverCardTrigger,
  type HoverCardProps,
  type HoverCardTriggerProps,
} from '../../src/components/hover-card/hover-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface City {
  name: string;
  country: string;
  note: string;
}

const cities: City[] = [
  { name: 'Lisbon', country: 'Portugal', note: 'Hills, trams and the Tagus estuary.' },
  { name: 'Oslo', country: 'Norway', note: 'A fjord city ringed by forest.' },
  { name: 'Kyoto', country: 'Japan', note: 'Temples, gardens and wooden townhouses.' },
];

const placements = ['top', 'bottom', 'start', 'end'] as const;
const arrows = ['no arrow', 'arrow'] as const;
const delays = ['no delay', 'default delay', 'long delay'] as const;

/** The content of a city's card. */
function CityCard({ city, onSave }: { city: City; onSave?: () => void }) {
  return (
    <>
      <p>
        <strong>{city.name}</strong>, {city.country}
      </p>
      <p>{city.note}</p>
      <Button size="sm" onPress={onSave}>
        Save {city.name}
      </Button>
    </>
  );
}

/** A button that previews a city in a hover card. */
function CityPreview({
  city,
  triggerProps = {},
  ...props
}: Omit<HoverCardProps, 'children'> & {
  city: City;
  triggerProps?: Partial<HoverCardTriggerProps>;
}) {
  return (
    <HoverCardTrigger {...triggerProps}>
      <Button size="sm" data-lab-trigger={props['data-lab-card']}>
        {city.name}
      </Button>
      <HoverCard aria-label={`About ${city.name}`} {...props}>
        <CityCard city={city} />
      </HoverCard>
    </HoverCardTrigger>
  );
}

function delayProps(delay: (typeof delays)[number]): Partial<HoverCardTriggerProps> {
  if (delay === 'no delay') return { delay: 0, closeDelay: 0 };
  if (delay === 'long delay') return { delay: 1500, closeDelay: 800 };
  return {};
}

/** Links in running text, each previewing its city; saving reports the city. */
function LinksInText() {
  const [saved, setSaved] = useState('none');
  return (
    <div>
      <p data-lab-text="">
        This autumn: three days in{' '}
        {cities.map((city, index) => (
          <span key={city.name}>
            {index === 0 ? null : index === cities.length - 1 ? ' and ' : ', '}
            <HoverCardTrigger>
              <Link href={`#${city.name.toLowerCase()}`} data-lab-link={city.name}>
                {city.name}
              </Link>
              <HoverCard aria-label={`About ${city.name}`} showArrow data-lab-card={city.name}>
                <CityCard city={city} onSave={() => setSaved(city.name)} />
              </HoverCard>
            </HoverCardTrigger>
          </span>
        ))}
        .
      </p>
      <p>
        Saved: <output data-lab-output="saved">{saved}</output>
      </p>
    </div>
  );
}

/** A card the page opens and closes, beside a trigger that never opens one. */
function ControlledAndDisabled() {
  const [isOpen, setOpen] = useState(false);
  const [isLocked, setLocked] = useState(false);
  const [first, second] = cities as [City, City];
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button size="sm" data-lab-toggle="" onPress={() => setOpen(!isOpen)}>
        {isOpen ? 'Hide the card' : 'Show the card'}
      </Button>
      <Button size="sm" data-lab-lock="" onPress={() => setLocked(!isLocked)}>
        {isLocked ? 'Unlock the card' : 'Lock the card'}
      </Button>
      <CityPreview
        city={first}
        data-lab-card="controlled"
        triggerProps={{ isOpen, onOpenChange: setOpen, isDisabled: isLocked }}
      />
      <output data-lab-output="controlled">{isOpen ? 'open' : 'closed'}</output>
      <CityPreview city={second} data-lab-card="disabled" triggerProps={{ isDisabled: true }} />
    </div>
  );
}

/** A trigger with a hint of its own still opens the card, on hover and on keyboard focus. */
function HintedTrigger() {
  const city = cities[2] as City;
  return (
    <div data-lab-demo="hinted-trigger">
      <HoverCardTrigger>
        <Button size="sm" tooltip="Open the city page" shortcut="Mod+K">
          {city.name}
        </Button>
        <HoverCard aria-label={`About ${city.name}`}>
          <p>{city.note}</p>
          <Button size="sm" tooltip="Keep it in your list">
            Save {city.name}
          </Button>
        </HoverCard>
      </HoverCardTrigger>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Placements and arrow"
      description="Rest the pointer on a button or focus it with the keyboard: its card opens on that side after the delay, with or without an arrow, and closes once the pointer and focus leave both."
    >
      <StateMatrix
        axes={{ placement: placements, arrow: arrows }}
        render={({ placement, arrow }) => (
          <div style={{ padding: 24 }}>
            <CityPreview
              city={cities[0] as City}
              placement={placement}
              showArrow={arrow === 'arrow'}
              data-lab-card={`${placement}-${arrow}`}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Links in text"
      description="Cards hold interactive content: move the pointer into a card, or press Tab from its link, to reach the Save button. Right after one card closes, the next link opens its card at once."
    >
      <LinksInText />
    </LabSection>
    <LabSection
      title="Delays"
      description="No delay, the default 600 milliseconds to open and 200 to close, and a long delay."
    >
      <StateMatrix
        axes={{ delay: delays }}
        render={({ delay }) => (
          <CityPreview
            city={cities[1] as City}
            data-lab-card={delay}
            triggerProps={delayProps(delay)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Controlled and disabled"
      description="The page shows and hides the first card; the second trigger is disabled and opens nothing."
    >
      <ControlledAndDisabled />
    </LabSection>
    <LabSection
      title="A trigger with its own hint"
      description="The Kyoto button has a tooltip and a shortcut of its own; inside the hover card trigger they yield, so the card opens on hover and focus. The card's Save button keeps its own tooltip, which opens on focus and hover while the card stays open."
    >
      <HintedTrigger />
    </LabSection>
  </>,
);
