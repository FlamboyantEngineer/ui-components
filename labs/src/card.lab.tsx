import { useState } from 'react';
import type { Selection } from '../../src/core/props.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Card, type CardVariant } from '../../src/components/card/card.js';
import type { Density } from '../../src/core/props.js';
import { CardAction, CardGrid, CardGridItem, CardTitle } from '../../src/components/card/index.js';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Slider } from '../../src/components/slider/slider.js';
import { Section } from '../../src/components/section-header/section-header.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  CollapsibleGrid,
  CollapsibleRecords,
  CustomHeaderCard,
  ResizablePane,
} from './card-collapse-cases.js';
import { RowMenu } from './row-menu.js';
import { ShadowRootApp } from './shadow-root-host.js';

const variants: CardVariant[] = ['default', 'panel'];
const densities: Density[] = ['default', 'comfortable', 'compact', 'tight'];
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

/** A card whose title loads after its body: the draft and the nested section's level hold. */
function LateTitleDemo() {
  const [title, setTitle] = useState<'none' | 'title' | 'custom'>('none');
  const next = { none: 'title', title: 'custom', custom: 'none' } as const;
  return (
    <div data-lab-demo="late-title" style={{ width: 320 }}>
      <Button size="sm" onPress={() => setTitle(next[title])}>
        Title: {title}
      </Button>
      <Card
        headingLevel={3}
        title={title === 'title' ? 'Loaded record' : undefined}
        header={title === 'custom' ? <CardTitle>Custom record</CardTitle> : undefined}
      >
        <label>
          Draft <input name="draft" />
        </label>
        <Section title="Notes">Nested below the card title.</Section>
      </Card>
    </div>
  );
}

/** An actionable card holding another one and an editor: each click goes to whoever owns it. */
function NestedActionDemo() {
  const [outer, setOuter] = useState(0);
  const [inner, setInner] = useState(0);
  return (
    <div data-lab-demo="nested-action" style={{ width: 360 }}>
      <Card title="Trip plan" onAction={() => setOuter((count) => count + 1)}>
        <p>Three days on the coast.</p>
        <Card title="Day one" variant="panel" onAction={() => setInner((count) => count + 1)}>
          Ferry to the islands.
        </Card>
        <div contentEditable="plaintext-only" suppressContentEditableWarning data-lab-editor="">
          Packing notes: sunscreen, maps.
        </div>
      </Card>
      <p>
        Trip opened <output data-lab-output="outer">{outer}</output>, day opened{' '}
        <output data-lab-output="inner">{inner}</output>
      </p>
    </div>
  );
}

function GestureDemo() {
  const [opened, setOpened] = useState(0);
  const [level, setLevel] = useState(4);
  return (
    <div data-lab-demo="gestures" style={{ width: 320 }}>
      <Card title="Mixer" onAction={() => setOpened((count) => count + 1)}>
        <Slider label="Volume" value={level} onChange={setLevel} maxValue={10} />
        <NumberField label="Gain" defaultValue={2} showScrubber />
        <p>Press here to open the mixer.</p>
      </Card>
      <p>
        Volume <output data-lab-output="level">{level}</output>, mixer opened{' '}
        <output data-lab-output="mixer">{opened}</output>
      </p>
    </div>
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
              <CardTitle>
                <CardAction>Botanic gardens</CardAction>
              </CardTitle>
            }
          >
            A custom header whose CardAction is the card action.
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
  const [menu, setMenu] = useState('none');
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
              <Card
                title={recipe.name}
                role="group"
                isSelected={isSelected}
                actions={
                  <RowMenu
                    label={`More for ${recipe.name}`}
                    onAction={(key) => setMenu(`${key} ${recipe.id}`)}
                  />
                }
              >
                {recipe.text}
              </Card>
            )}
          </CardGridItem>
        )}
      </CardGrid>
      <p>
        Selected: <output data-lab-output="selected">{names.join(', ') || 'none'}</output>. Opened:{' '}
        <output data-lab-output="opened">{opened}</output>. Menu:{' '}
        <output data-lab-output="menu">{menu}</output>.
      </p>
    </div>
  );
}

function WaterfallDemo() {
  return (
    <div data-lab-demo="waterfall" style={{ width: 520, height: 320 }}>
      <CardGrid
        aria-label="Recipes in a waterfall"
        layout="waterfall"
        minItemSize={{ width: 130, height: 60 }}
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
    </div>
  );
}

/** An uncontrolled selectable grid whose layout and virtualization the host switches. */
function SwitchingDemo() {
  const [mode, setMode] = useState<'grid' | 'virtual grid' | 'waterfall'>('grid');
  return (
    <div data-lab-demo="switching" style={{ width: 520 }}>
      <p>
        {(['grid', 'virtual grid', 'waterfall'] as const).map((next) => (
          <button
            key={next}
            type="button"
            aria-pressed={mode === next}
            onClick={() => setMode(next)}
          >
            Show as {next}
          </button>
        ))}
      </p>
      <div style={{ height: 280 }}>
        <CardGrid
          aria-label="Recipes to switch"
          items={recipes}
          selectionMode="multiple"
          defaultSelectedKeys={['salad']}
          layout={mode === 'waterfall' ? 'waterfall' : 'grid'}
          virtualized={mode === 'virtual grid'}
          minItemSize={{ width: 150, height: 60 }}
        >
          {(recipe) => (
            <CardGridItem textValue={recipe.name}>
              {({ isSelected }) => (
                <Card title={recipe.name} role="group" density="compact" isSelected={isSelected}>
                  {recipe.text}
                </Card>
              )}
            </CardGridItem>
          )}
        </CardGrid>
      </div>
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
      description="A title, a description and actions compose the header; custom header content replaces them, and a CardTitle in it becomes the card title."
    >
      <StateMatrix
        axes={{ header: ['title', 'description', 'actions', 'custom', 'slotted title', 'none'] }}
        render={({ header }) => (
          <div style={{ width: 240 }}>
            {header === 'slotted title' ? (
              <Card
                header={
                  <>
                    <CardTitle>Seed swap</CardTitle>
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
      title="Title that arrives late"
      description="Type a draft, then cycle the title from none to a title to a custom header: the draft stays, and the Notes heading sits one level below whichever title the card has."
    >
      <LateTitleDemo />
    </LabSection>
    <LabSection
      title="Nested cards and editors"
      description="A click on the inner card opens only the day; a click in the editable packing notes opens nothing; a click elsewhere on the trip opens the trip."
    >
      <NestedActionDemo />
    </LabSection>
    <LabSection
      title="Sliders and scrubbing in an actionable card"
      description="Dragging the slider or scrubbing the gain moves them and never opens the card, even when the drag is released elsewhere on it; a press on the text opens the card."
    >
      <GestureDemo />
    </LabSection>
    <LabSection
      title="Card grid"
      description="Arrow keys move between cards in two dimensions; Space or the checkbox selects; Enter opens a card. Each card's menu returns focus to its button as it closes."
    >
      <GridDemo />
    </LabSection>
    <LabSection
      title="Waterfall"
      description="The waterfall layout: cards of different heights in columns, only those in view rendered, in a 320px tall frame."
    >
      <WaterfallDemo />
    </LabSection>
    <LabSection
      title="Switching layouts"
      description="An uncontrolled selection that survives switching between the grid, the virtual grid and the waterfall: clear Green salad, select Tomato soup, then switch. The focused card keeps focus when the switch comes from the host rather than from these buttons."
    >
      <SwitchingDemo />
    </LabSection>
    <LabSection
      title="Collapsible records"
      description="Collapse a record and expand it again: its notes keep what you typed. The button above collapses row 4 from outside."
    >
      <CollapsibleRecords />
    </LabSection>
    <LabSection title="Custom header with the built-in toggle">
      <CustomHeaderCard />
    </LabSection>
    <LabSection
      title="Adaptive cards in a resizable pane"
      description="Narrow the pane with the slider or its grip: the cards turn compact, then show a few characters and a More button that holds the rest."
    >
      <ResizablePane />
    </LabSection>
    <LabSection title="Collapsible cards in a selectable grid">
      <CollapsibleGrid />
    </LabSection>
    <LabSection
      title="Inside a shadow root"
      description="A compact card inside an open shadow root, as a web component holds it, with a button outside that shares the More button's id pattern. Open More, focus Water and press Escape: focus returns to this card's More button."
    >
      <ShadowRootApp demo="shadow-card">
        <div style={{ width: 260 }}>
          <Card
            title="Pear row"
            description="Eight pear trees"
            meta="Updated Tuesday"
            actions={<Button size="sm">Water</Button>}
            presentationSteps={{ compact: { width: 320 } }}
          >
            Picked on Thursday
          </Card>
        </div>
      </ShadowRootApp>
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the loading skeleton fades toward the left, the end side."
    >
      <div dir="rtl" style={{ width: 220 }} data-lab-demo="rtl">
        <Card title="Lighthouse" isLoading footer="Updated today">
          Open on weekends from April to October.
        </Card>
      </div>
    </LabSection>
  </>,
);
