import { useState } from 'react';
import type { Key, Selection } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Card, CardGrid, CardGridItem } from '../../src/components/card/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection } from './chrome/index.js';

interface Dish {
  id: string;
  name: string;
  price: number;
}

const menu: readonly Dish[] = [
  'Leek soup',
  'Barley salad',
  'Pea risotto',
  'Corn bread',
  'Plum crumble',
  'Rye toast',
  'Fig jam',
  'Oat biscuits',
  'Herb omelette',
  'Carrot cake',
  'Pear tart',
  'Mint tea',
].map((name, at) => ({ id: name.toLowerCase().replace(/ /g, '-'), name, price: 4 + at }));

const pageSize = 4;

/** A grid that asks for more as its end scrolls into view; Deliver page answers each request. */
function PagedGrid() {
  const [loaded, setLoaded] = useState(pageSize);
  const [isLoading, setLoading] = useState(false);
  const [requests, setRequests] = useState(0);
  const [isEmpty, setEmpty] = useState(false);
  const items = isEmpty ? [] : menu.slice(0, loaded);
  const hasMore = !isEmpty && loaded < menu.length;
  return (
    <div data-lab-demo="paged-grid" style={{ width: 520 }}>
      <Switch isSelected={isEmpty} onChange={setEmpty}>
        Filter out every dish
      </Switch>
      <div style={{ height: 240, overflow: 'auto', outline: '1px dotted currentColor' }}>
        <CardGrid
          aria-label="Dishes"
          items={items}
          isLoading={isLoading}
          onLoadMore={
            hasMore
              ? () => {
                  setRequests((count) => count + 1);
                  setLoading(true);
                }
              : undefined
          }
          renderEmptyState={() => (
            <p data-lab-output="empty">No dish matches. Clear the filter to see the menu.</p>
          )}
        >
          {(dish) => (
            <CardGridItem textValue={dish.name}>
              <Card title={dish.name} role="group" density="compact">
                {dish.price} €
              </Card>
            </CardGridItem>
          )}
        </CardGrid>
      </div>
      <Button
        size="sm"
        variant="tertiary"
        isDisabled={!isLoading}
        onPress={() => {
          setLoaded((count) => Math.min(menu.length, count + pageSize));
          setLoading(false);
        }}
      >
        Deliver page
      </Button>
      <p>
        Load requests: <output data-lab-output="requests">{requests}</output>. Loading:{' '}
        <output data-lab-output="loading">{String(isLoading)}</output>. Shown:{' '}
        <output data-lab-output="shown">{items.length}</output>.
      </p>
    </div>
  );
}

/** Stable items whose cards read page state: dependencies redraws them when it changes. */
function DependentGrid() {
  const [showPrices, setShowPrices] = useState(false);
  return (
    <div data-lab-demo="dependent-grid" style={{ width: 520 }}>
      <Switch isSelected={showPrices} onChange={setShowPrices}>
        Show prices
      </Switch>
      <CardGrid
        aria-label="Dishes with prices"
        items={menu.slice(0, 3)}
        dependencies={[showPrices]}
      >
        {(dish) => (
          <CardGridItem textValue={dish.name}>
            <Card title={dish.name} role="group" density="compact">
              {showPrices ? `${dish.price} €` : 'Price hidden'}
            </Card>
          </CardGridItem>
        )}
      </CardGrid>
    </div>
  );
}

const modes = { single: 'Single', multiple: 'Multiple' } as const;
const behaviors = { toggle: 'Toggle', replace: 'Replace' } as const;

/** Selection mode, behaviour and a required selection, with a locked dish that cannot be picked. */
function SelectionGrid() {
  const [mode, setMode] = useState<keyof typeof modes>('multiple');
  const [behavior, setBehavior] = useState<keyof typeof behaviors>('toggle');
  const [isRequired, setRequired] = useState(false);
  const [selected, setSelected] = useState<Selection>(new Set<Key>(['leek-soup']));
  const names = selected === 'all' ? ['all'] : [...selected].map(String).sort();
  return (
    <div data-lab-demo="selection-grid" style={{ width: 520 }}>
      <SegmentedChoice
        aria-label="Selection mode"
        size="sm"
        sizing="content"
        options={Object.entries(modes).map(([value, label]) => ({ value, label }))}
        value={mode}
        onChange={(value) => {
          if (value === 'single' || value === 'multiple') setMode(value);
        }}
      />{' '}
      <SegmentedChoice
        aria-label="Selection behavior"
        size="sm"
        sizing="content"
        options={Object.entries(behaviors).map(([value, label]) => ({ value, label }))}
        value={behavior}
        onChange={(value) => {
          if (value === 'toggle' || value === 'replace') setBehavior(value);
        }}
      />{' '}
      <Switch isSelected={isRequired} onChange={setRequired}>
        Keep one selected
      </Switch>
      <CardGrid
        aria-label="Dishes to order"
        items={menu.slice(0, 4)}
        selectionMode={mode}
        selectionBehavior={behavior}
        disallowEmptySelection={isRequired}
        disabledKeys={['pea-risotto']}
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {(dish) => (
          <CardGridItem textValue={dish.name}>
            {({ isSelected }) => (
              <Card title={dish.name} role="group" density="compact" isSelected={isSelected}>
                {dish.id === 'pea-risotto' ? 'Sold out' : `${dish.price} €`}
              </Card>
            )}
          </CardGridItem>
        )}
      </CardGrid>
      <p>
        Selected: <output data-lab-output="selected">{names.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

export function CardGridDataCases() {
  return (
    <div data-lab-family="card-grid-data-cases">
      <LabSection
        title="Loading more cards"
        description="Scroll to the end of the frame: the grid calls onLoadMore and shows its loading item while isLoading; Deliver page adds four dishes and ends loading, and while one request loads the grid asks for no more. If the new end is still in the frame it asks again. Filter out every dish for the custom empty result from renderEmptyState."
      >
        <PagedGrid />
      </LabSection>
      <LabSection
        title="Redrawing stable items"
        description="The items never change, but each card reads Show prices from the page. dependencies={[showPrices]} tells the grid to redraw its cached cards when it changes."
      >
        <DependentGrid />
      </LabSection>
      <LabSection
        title="Selection options"
        description="Switch between single and multiple selection, toggle (each press adds or removes; checkboxes show) and replace (a press selects only that card; Shift or Ctrl extends), and keep one selected (the last card cannot be deselected). Pea risotto is listed in disabledKeys: it cannot be selected."
      >
        <SelectionGrid />
      </LabSection>
    </div>
  );
}
