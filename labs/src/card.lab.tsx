import { useState } from 'react';
import {
  Heading,
  Link as AriaLink,
  Size,
  Virtualizer,
  WaterfallLayout,
  type Selection,
} from '../../src/primitives/index.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Card, type CardDensity, type CardVariant } from '../../src/components/card/card.js';
import { CardGrid, CardGridItem } from '../../src/components/card/index.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants: CardVariant[] = ['default', 'panel'];
const densities: CardDensity[] = ['default', 'comfortable', 'compact', 'tight'];
const states = ['resting', 'selected', 'interactive', 'flush'] as const;

function SelectableCards() {
  const [selected, setSelected] = useState('Lisbon');
  return (
    <div role="group" aria-label="Destination" data-lab-demo="select">
      {['Lisbon', 'Oslo', 'Nairobi'].map((city) => (
        <div key={city} style={{ width: 220 }}>
          <Card title={city} headingLevel={2} isSelected={city === selected} interactive fullWidth>
            <Button size="sm" isSelected={city === selected} onPress={() => setSelected(city)}>
              Choose {city}
            </Button>
          </Card>
        </div>
      ))}
    </div>
  );
}

const recipes = [
  { id: 'soup', name: 'Tomato soup', text: 'Simmer for twenty minutes.' },
  { id: 'salad', name: 'Green salad', text: 'Toss with lemon and oil, then season to taste.' },
  { id: 'stew', name: 'Bean stew', text: 'Soak the beans overnight. Cook slowly for two hours.' },
  { id: 'bread', name: 'Flat bread', text: 'Knead, rest and bake.' },
  {
    id: 'curry',
    name: 'Lentil curry',
    text: 'Fry the spices, add lentils and coconut milk, and cook until thick. Serve with rice.',
  },
  { id: 'tart', name: 'Apple tart', text: 'Slice thinly and bake until golden.' },
];

function Cover({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 240 90" role="img" aria-label={label}>
      <rect width="240" height="90" fill="#9ec5e8" />
      <circle cx="190" cy="30" r="14" fill="#f7d774" />
      <path d="M0 70 Q60 40 120 70 T240 70 V90 H0 Z" fill="#4f7cac" />
    </svg>
  );
}

function ActionDemo() {
  const [opened, setOpened] = useState(0);
  const [shared, setShared] = useState(0);
  return (
    <div data-lab-demo="action">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 240 }}>
          <Card
            title="Harbour walk"
            description="Two hours along the water"
            href="#harbour"
            media={<Cover label="Boats at dawn" />}
            footer={
              <Button size="sm" variant="tertiary" onPress={() => setShared((count) => count + 1)}>
                Share
              </Button>
            }
          >
            Start at the old pier and follow the lighthouse path.
          </Card>
        </div>
        <div style={{ width: 240 }}>
          <Card
            title="Market tour"
            description="Saturday mornings"
            onAction={() => setOpened((count) => count + 1)}
          >
            Fresh bread, cheese and fruit from the valley.
          </Card>
        </div>
        <div style={{ width: 240 }}>
          <Card
            href="#gardens"
            header={
              <Heading slot="title" level={3}>
                <AriaLink slot="action">Botanic gardens</AriaLink>
              </Heading>
            }
          >
            A custom header whose slotted link is the card action.
          </Card>
        </div>
      </div>
      <p>
        Market tour opened: <output data-lab-output="opened">{opened}</output>. Shared:{' '}
        <output data-lab-output="shared">{shared}</output>.
      </p>
    </div>
  );
}

function GridDemo() {
  const [selected, setSelected] = useState<Selection>(new Set(['salad']));
  const [opened, setOpened] = useState('none');
  const names = selected === 'all' ? ['all'] : [...selected].map(String).sort();
  return (
    <div data-lab-demo="grid" style={{ width: 640 }}>
      <CardGrid
        aria-label="Recipes"
        items={recipes}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        onAction={(key) => setOpened(String(key))}
      >
        {(recipe) => (
          <CardGridItem textValue={recipe.name}>
            {({ isSelected }) => (
              <Card title={recipe.name} role="group" isSelected={isSelected}>
                {recipe.text}
              </Card>
            )}
          </CardGridItem>
        )}
      </CardGrid>
      <p>
        Selected: <output data-lab-output="selected">{names.join(', ') || 'none'}</output>. Opened:{' '}
        <output data-lab-output="opened">{opened}</output>.
      </p>
    </div>
  );
}

function WaterfallDemo() {
  return (
    <div data-lab-demo="waterfall" style={{ width: 520, height: 320 }}>
      <Virtualizer
        layout={WaterfallLayout}
        layoutOptions={{ minItemSize: new Size(150, 60), minSpace: new Size(12, 12) }}
      >
        <CardGrid
          aria-label="Recipes in a waterfall"
          items={[...recipes, ...recipes.map((recipe) => ({ ...recipe, id: `${recipe.id}-2` }))]}
        >
          {(recipe) => (
            <CardGridItem textValue={recipe.name}>
              <Card title={recipe.name} role="group" density="compact">
                {recipe.text}
              </Card>
            </CardGridItem>
          )}
        </CardGrid>
      </Virtualizer>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, densities and states"
      description="Every surface and density, resting, selected, interactive (hover it) and flush."
    >
      <StateMatrix
        axes={{ variant: variants, density: densities, state: states }}
        render={({ variant, density, state }) => (
          <div style={{ width: 200 }}>
            <Card
              variant={variant}
              density={density}
              isSelected={state === 'selected'}
              interactive={state === 'interactive'}
              flush={state === 'flush'}
              title={`${variant}, ${density}, ${state}`}
              footer="Updated today"
            >
              Three cities, two rivers.
            </Card>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Header composition"
      description="A title, a description and actions compose the header; custom header content replaces them, and a React Aria Heading with the title slot in it becomes the card title."
    >
      <StateMatrix
        axes={{ header: ['title', 'description', 'actions', 'custom', 'slotted title', 'none'] }}
        render={({ header }) => (
          <div style={{ width: 240 }}>
            {header === 'slotted title' ? (
              <Card
                header={
                  <>
                    <Heading slot="title">Seed swap</Heading>
                    <Badge size="sm">New</Badge>
                  </>
                }
              >
                The slotted heading names the card.
              </Card>
            ) : header === 'custom' ? (
              <Card header={<strong>Custom header</strong>} aria-label="Custom header card">
                Body text.
              </Card>
            ) : header === 'none' ? (
              <Card aria-label="Card without header">Body text with no header.</Card>
            ) : (
              <Card
                title={`Notifications (${header})`}
                description={header === 'title' ? undefined : 'Choose what reaches your inbox.'}
                actions={
                  header === 'actions' ? (
                    <Button size="sm" variant="tertiary">
                      Reset
                    </Button>
                  ) : undefined
                }
              >
                Body text.
              </Card>
            )}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Fill"
      description="A filled card in a 160px tall frame: the body grows to the card's height and owns its interior."
    >
      <div data-lab-fill-frame="true" style={{ width: 280, height: 160 }}>
        <Card title="Preview" fill variant="panel">
          <div data-lab-canvas="true">Canvas</div>
        </Card>
      </div>
    </LabSection>
    <LabSection
      title="Selection"
      description="The control inside each card exposes the choice; the card draws the selected edge. These cards fill their frame's width and use level 2 headings."
    >
      <SelectableCards />
    </LabSection>
    <LabSection
      title="Media and loading"
      description="A cover image before the header, and the decorative skeleton that replaces the body while loading."
    >
      <StateMatrix
        axes={{ media: ['none', 'cover'], content: ['loaded', 'loading'] }}
        render={({ media, content }) => (
          <div style={{ width: 220 }}>
            <Card
              title={`Lighthouse (${media}, ${content})`}
              media={media === 'cover' ? <Cover label="A lighthouse by the sea" /> : undefined}
              isLoading={content === 'loading'}
              footer="Updated today"
            >
              Open on weekends from April to October.
            </Card>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Whole-card action"
      description="Each card is a link or a press target whose title is the action: click anywhere on it. The Share button inside keeps its own behaviour."
    >
      <ActionDemo />
    </LabSection>
    <LabSection
      title="Card grid"
      description="Arrow keys move between cards in two dimensions; Space or the checkbox selects; Enter opens a card."
    >
      <GridDemo />
    </LabSection>
    <LabSection
      title="Waterfall"
      description="The grid inside a React Aria Virtualizer with WaterfallLayout: cards of different heights in columns, in a 320px tall frame."
    >
      <WaterfallDemo />
    </LabSection>
  </>,
);
