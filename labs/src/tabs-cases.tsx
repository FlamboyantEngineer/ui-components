import { useEffect, useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import type { MenuEntry } from '../../src/components/menu/menu.js';
import { Tab, TabList, TabPanel, Tabs, type TabMove } from '../../src/components/tabs/tabs.js';

interface Meal {
  id: string;
  name: string;
}

const MEALS: Meal[] = [
  { id: 'meal-1', name: 'Breakfast' },
  { id: 'meal-2', name: 'Lunch' },
  { id: 'meal-3', name: 'Dinner' },
];

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

function KeyPanels({ items }: { items: readonly { id: Key; label: string }[] }) {
  return (
    <>
      {items.map((item) => (
        <TabPanel key={`${typeof item.id}:${item.id}`} id={item.id}>
          {item.label} panel
        </TabPanel>
      ))}
    </>
  );
}

export function TypedKeyTabs() {
  const [selected, setSelected] = useState<Key>(1);
  const items = [
    { id: 1, label: 'Numeric' },
    { id: '1', label: 'Text' },
    { id: 'a b', label: 'Spaced' },
    { id: 'ab', label: 'Compact' },
  ];
  return (
    <div data-lab-demo="typed-tab-keys">
      <Tabs selectedKey={selected} onSelectionChange={setSelected}>
        <TabList aria-label="Typed tab keys">
          {items.map((item) => (
            <Tab key={`${typeof item.id}:${item.id}`} id={item.id}>
              {item.label}
            </Tab>
          ))}
        </TabList>
        <KeyPanels items={items} />
      </Tabs>
      <p data-lab-output="selected">
        Selected {typeof selected}: {JSON.stringify(selected)}
      </p>
    </div>
  );
}

export function DisabledRemovalTabs() {
  const [isDisabled, setDisabled] = useState(false);
  const [removed, setRemoved] = useState('(none)');
  return (
    <div data-lab-demo="disabled-removal">
      <Button onPress={() => setDisabled(!isDisabled)}>Toggle disabled tabs</Button>
      <Tabs isDisabled={isDisabled} disabledKeys={['summer']}>
        <TabList
          aria-label="Removable seasons"
          onRemove={(keys) => setRemoved([...keys].join(', '))}
        >
          <Tab id="spring">Spring</Tab>
          <Tab id="summer">Summer</Tab>
          <Tab id="autumn" isDisabled>
            Autumn
          </Tab>
        </TabList>
        <TabPanel id="spring">Spring details.</TabPanel>
        <TabPanel id="summer">Summer details.</TabPanel>
        <TabPanel id="autumn">Autumn details.</TabPanel>
      </Tabs>
      <p data-lab-output="removed">Remove requested: {removed}</p>
    </div>
  );
}

/** The tabs in their new order after `move`, as an owner applies a reported move. */
function applyMove(meals: readonly Meal[], move: TabMove): Meal[] {
  const moving = meals.find((meal) => meal.id === move.key);
  const rest = meals.filter((meal) => meal.id !== move.key);
  const index = rest.findIndex((meal) => meal.id === move.targetKey);
  if (!moving || index < 0) return [...meals];
  const at = move.position === 'before' ? index : index + 1;
  return [...rest.slice(0, at), moving, ...rest.slice(at)];
}

/** The tabs with a copy of `key` after it. */
function duplicate(meals: readonly Meal[], key: Key, id: string): Meal[] {
  const index = meals.findIndex((meal) => meal.id === key);
  const source = meals[index];
  if (!source) return [...meals];
  return [
    ...meals.slice(0, index + 1),
    { id, name: `${source.name} copy` },
    ...meals.slice(index + 1),
  ];
}

/** Keeps the last tab: its menu's Delete is unavailable. */
function keepLastTab(count: number) {
  return (_key: Key, standard: readonly MenuEntry[]) =>
    count > 1
      ? standard
      : standard.map((entry) => (entry.id === 'delete' ? { ...entry, isDisabled: true } : entry));
}

/**
 * Tabs the reader renames (double click, F2 or the menu), reorders (drag or Alt+Arrow), duplicates,
 * deletes and adds; names must be unique.
 */
export function MealTabs() {
  const [meals, setMeals] = useState(MEALS);
  const [selected, setSelected] = useState<Key>('meal-1');
  const [nextId, setNextId] = useState(4);
  const takeId = () => {
    setNextId(nextId + 1);
    return `meal-${nextId}`;
  };
  const remove = (keys: Set<Key>) => {
    const remaining = meals.filter((meal) => !keys.has(meal.id));
    if (remaining.length === 0) return;
    setMeals(remaining);
    if (keys.has(selected) && remaining[0]) setSelected(remaining[0].id);
  };
  return (
    <div data-lab-demo="meals" style={{ width: 480 }}>
      <Tabs selectedKey={selected} onSelectionChange={setSelected}>
        <TabList
          aria-label="Meals"
          onRename={(key, name) =>
            setMeals(meals.map((meal) => (meal.id === key ? { ...meal, name } : meal)))
          }
          validateName={(key, name) =>
            meals.some((meal) => meal.id !== key && meal.name.toLowerCase() === name.toLowerCase())
              ? `There is already a ${name} tab.`
              : null
          }
          onReorder={(move) => setMeals(applyMove(meals, move))}
          onDuplicate={(key) => setMeals(duplicate(meals, key, takeId()))}
          onRemove={remove}
          onAdd={() => {
            const id = takeId();
            setMeals([...meals, { id, name: `Meal ${meals.length + 1}` }]);
            setSelected(id);
          }}
          getMenuItems={keepLastTab(meals.length)}
        >
          {meals.map((meal) => (
            <Tab key={meal.id} id={meal.id}>
              {meal.name}
            </Tab>
          ))}
        </TabList>
        {meals.map((meal) => (
          <TabPanel key={meal.id} id={meal.id}>
            Recipes for {meal.name.toLowerCase()}.
          </TabPanel>
        ))}
      </Tabs>
      <p data-lab-output="meals">Tabs: {meals.map((meal) => meal.name).join(', ')}</p>
    </div>
  );
}

/** Vertical tabs that reorder with Alt+ArrowUp and Alt+ArrowDown. */
export function VerticalReorderTabs() {
  const [seasons, setSeasons] = useState(SEASONS.map((name) => ({ id: name, name })));
  return (
    <div data-lab-demo="seasons">
      <Tabs orientation="vertical">
        <TabList aria-label="Seasons" onReorder={(move) => setSeasons(applyMove(seasons, move))}>
          {seasons.map((season) => (
            <Tab key={season.id} id={season.id}>
              {season.name}
            </Tab>
          ))}
        </TabList>
        {seasons.map((season) => (
          <TabPanel key={season.id} id={season.id}>
            Produce in {season.name.toLowerCase()}.
          </TabPanel>
        ))}
      </Tabs>
      <p data-lab-output="seasons">Order: {seasons.map((season) => season.name).join(', ')}</p>
    </div>
  );
}

/** Tabs that remember their selection through the provider's storage, across a remount. */
export function RememberedTabs() {
  const [mount, setMount] = useState(0);
  return (
    <div data-lab-demo="remembered">
      <Tabs key={mount} persistKey="lab-tabs-remembered" defaultSelectedKey="Summer">
        <TabList aria-label="Remembered seasons">
          {SEASONS.map((name) => (
            <Tab key={name} id={name}>
              {name}
            </Tab>
          ))}
        </TabList>
        {SEASONS.map((name) => (
          <TabPanel key={name} id={name}>
            Remembered: {name}.
          </TabPanel>
        ))}
      </Tabs>
      <Button variant="secondary" size="sm" onPress={() => setMount(mount + 1)}>
        Remount
      </Button>
    </div>
  );
}

/** Renameable tabs with a menu that lock themselves a second after Lock is pressed. */
export function LockingTabs() {
  const [names, setNames] = useState(['Soup', 'Salad', 'Stew']);
  const [isLocked, setLocked] = useState(false);
  const [isLocking, setLocking] = useState(false);
  const [last, setLast] = useState('none');
  useEffect(() => {
    if (!isLocking) return undefined;
    // Lab-only stand-in for the host locking the tabs while the reader edits one.
    const timer = setTimeout(() => {
      setLocking(false);
      setLocked(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLocking]);
  return (
    <div data-lab-demo="locking" style={{ width: 420 }}>
      <p>
        <Button onPress={() => setLocking(true)} isDisabled={isLocked || isLocking}>
          Lock in a second
        </Button>{' '}
        <Button onPress={() => setLocked(false)} isDisabled={!isLocked}>
          Unlock
        </Button>
      </p>
      <Tabs isDisabled={isLocked}>
        <TabList
          aria-label="Courses"
          onRename={(key, name) => {
            setLast(`renamed ${String(key)}`);
            setNames((current) => current.map((item) => (item === key ? name : item)));
          }}
          onRemove={(keys) => {
            setLast(`deleted ${[...keys].join(', ')}`);
            setNames((current) => current.filter((item) => !keys.has(item)));
          }}
          getMenuItems={(_key, standard) => standard}
        >
          {names.map((name) => (
            <Tab key={name} id={name}>
              {name}
            </Tab>
          ))}
        </TabList>
        {names.map((name) => (
          <TabPanel key={name} id={name}>
            The {name.toLowerCase()} course.
          </TabPanel>
        ))}
      </Tabs>
      <p data-lab-output="locking">Last change: {last}</p>
    </div>
  );
}
