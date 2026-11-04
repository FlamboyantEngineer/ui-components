import { useState } from 'react';
import { Tab, TabList, type TabListProps, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { HelpGlyph, InfoGlyph, SearchGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  DisabledRemovalTabs,
  IconMenuTabs,
  LiveRenameTabs,
  LockingTabs,
  MealTabs,
  RememberedTabs,
  SwitchingTabs,
  TypedKeyTabs,
  VerticalReorderTabs,
} from './tabs-cases.js';
import { TabsCompositionCases } from './tabs-composition-cases.js';
import { InlineActionTabs } from './tabs-inline-actions.js';

const sizes = ['sm', 'md', 'lg'] as const;

const fruit = [
  { id: 'apple', label: 'Apple', text: 'Apples are crisp.' },
  { id: 'banana', label: 'Banana', text: 'Bananas are soft.' },
  { id: 'cherry', label: 'Cherry', text: 'Cherries are small.' },
];

const cities = [
  'Amsterdam canals',
  'Barcelona beaches',
  'Copenhagen bicycles',
  'Dublin harbour',
  'Edinburgh castle',
  'Florence bridges',
  'Geneva lakeside',
  'Helsinki islands',
  'Istanbul markets',
  'Lisbon trams',
];

function MailTabs({
  content,
  state,
  label,
}: {
  content: 'text' | 'icons' | 'counts';
  state: 'default' | 'disabled tab' | 'disabled';
  label: string;
}) {
  const icons = content === 'icons';
  const counts = content === 'counts';
  return (
    <Tabs isDisabled={state === 'disabled'}>
      <TabList aria-label={label}>
        <Tab
          id="inbox"
          {...(icons ? { icon: InfoGlyph } : {})}
          {...(counts ? { count: 15, countMax: 9, countLabel: '15 unread' } : {})}
        >
          Inbox
        </Tab>
        <Tab
          id="search"
          isDisabled={state === 'disabled tab'}
          {...(icons ? { icon: SearchGlyph } : {})}
          {...(counts ? { count: 3, countLabel: '3 saved' } : {})}
        >
          Search
        </Tab>
        <Tab id="help" {...(icons ? { icon: HelpGlyph } : {})}>
          Help
        </Tab>
      </TabList>
      <TabPanel id="inbox">Inbox messages.</TabPanel>
      <TabPanel id="search">Saved searches.</TabPanel>
      <TabPanel id="help">Help topics.</TabPanel>
    </Tabs>
  );
}

function LinkTabs() {
  const [route, setRoute] = useState('#overview');
  return (
    <UiProvider navigate={(href) => setRoute(href)}>
      <Tabs selectedKey={route.slice(1)}>
        <TabList aria-label="Sections">
          <Tab id="overview" href="#overview">
            Overview
          </Tab>
          <Tab id="schedule" href="#schedule">
            Schedule
          </Tab>
          <Tab id="contacts" href="#contacts">
            Contacts
          </Tab>
        </TabList>
        <TabPanel id="overview">The overview section.</TabPanel>
        <TabPanel id="schedule">The schedule section.</TabPanel>
        <TabPanel id="contacts">The contacts section.</TabPanel>
      </Tabs>
      <p data-lab-output="">Navigated to {route}</p>
    </UiProvider>
  );
}

function CityTabs({ label, ...list }: { label: string } & Partial<TabListProps>) {
  return (
    <Tabs>
      <TabList aria-label={label} {...list}>
        {cities.map((city) => (
          <Tab key={city} id={city}>
            {city}
          </Tab>
        ))}
      </TabList>
      {cities.map((city) => (
        <TabPanel key={city} id={city}>
          Notes on {city.toLowerCase()}.
        </TabPanel>
      ))}
    </Tabs>
  );
}

function EditableTabs() {
  const [notes, setNotes] = useState(['Groceries', 'Recipes', 'Travel']);
  const [selected, setSelected] = useState<Key>('Groceries');
  return (
    <div data-lab-demo="editable" style={{ width: 420 }}>
      <Tabs selectedKey={selected} onSelectionChange={setSelected}>
        <TabList
          aria-label="Notes"
          onRemove={(keys) => {
            const remaining = notes.filter((note) => !keys.has(note));
            setNotes(remaining);
            if (keys.has(selected) && remaining[0]) setSelected(remaining[0]);
          }}
          onAdd={() => {
            const name = `Note ${notes.length + 1}`;
            setNotes([...notes, name]);
            setSelected(name);
          }}
        >
          {notes.map((note) => (
            <Tab key={note} id={note}>
              {note}
            </Tab>
          ))}
        </TabList>
        {notes.map((note) => (
          <TabPanel key={note} id={note}>
            The {note.toLowerCase()} note.
          </TabPanel>
        ))}
      </Tabs>
      <p data-lab-output="notes">Notes: {notes.join(', ')}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="Count appearances">
      <Tabs>
        <TabList aria-label="Count appearances">
          <Tab id="quiet-count" count={7}>
            Quiet
          </Tab>
          <Tab id="solid-count" count={128} countVariant="solid">
            Vibrant
          </Tab>
        </TabList>
        <TabPanel id="quiet-count">Quiet list counts</TabPanel>
        <TabPanel id="solid-count">Vibrant count</TabPanel>
      </Tabs>
    </LabSection>
    <LabSection title="Orientation and sizes">
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], size: sizes }}
        render={({ orientation, size }) => (
          <Tabs orientation={orientation} size={size}>
            <TabList aria-label={`Fruit, ${orientation}, ${size}`}>
              {fruit.map((item) => (
                <Tab key={item.id} id={item.id}>
                  {item.label}
                </Tab>
              ))}
            </TabList>
            {fruit.map((item) => (
              <TabPanel key={item.id} id={item.id}>
                {item.text}
              </TabPanel>
            ))}
          </Tabs>
        )}
      />
    </LabSection>
    <LabSection
      title="Content and states"
      description="Hover, press and keyboard focus show on interaction. Arrow keys skip the disabled tab."
    >
      <StateMatrix
        axes={{
          content: ['text', 'icons', 'counts'],
          state: ['default', 'disabled tab', 'disabled'],
        }}
        render={({ content, state }) => (
          <MailTabs content={content} state={state} label={`Mail, ${content}, ${state}`} />
        )}
      />
    </LabSection>
    <LabSection
      title="Overflow"
      description="Ten long tabs in a 360px column. Selecting a tab scrolls it toward the middle of the strip."
    >
      <div data-lab-overflow="" style={{ width: 360 }}>
        <CityTabs label="Cities" />
      </div>
    </LabSection>
    <LabSection
      title="Wheel and trackpad"
      description="A list that scrolls takes the mouse wheel whether or not it draws scroll buttons: the wheel scrolls it sideways, a trackpad swipe scrolls it as is, and at either end it keeps the wheel so the page does not scroll behind it. Scroll buttons only add a paging control. Arrow keys select tabs and scroll the selected one into view. In right-to-left text the wheel scrolls toward the left. A list whose tabs all fit leaves the wheel to the page."
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div data-lab-wheel="ltr" style={{ width: 360 }}>
          <CityTabs label="Places by wheel" />
        </div>
        <UiProvider locale="he-IL">
          <div data-lab-wheel="rtl" dir="rtl" style={{ width: 360 }}>
            <CityTabs label="Places by wheel, right to left" />
          </div>
        </UiProvider>
        <div data-lab-wheel="fits" style={{ width: 360 }}>
          <Tabs>
            <TabList aria-label="Tabs that fit">
              {fruit.map((item) => (
                <Tab key={item.id} id={item.id}>
                  {item.label}
                </Tab>
              ))}
            </TabList>
            {fruit.map((item) => (
              <TabPanel key={item.id} id={item.id}>
                {item.text}
              </TabPanel>
            ))}
          </Tabs>
        </div>
      </div>
    </LabSection>
    <LabSection
      title="Overflow menu"
      description="The same tabs with overflow menu: the selected tab and as many others as fit stay, and a menu after the list holds the rest."
    >
      <div data-lab-overflow="menu" style={{ width: 360 }}>
        <CityTabs label="Destinations with a menu" overflow="menu" />
      </div>
    </LabSection>
    <LabSection
      title="Scroll buttons"
      description="Previous and next buttons appear at an edge that hides tabs and page the list. The wheel scrolls it too."
    >
      <div data-lab-overflow="buttons" style={{ width: 360 }}>
        <CityTabs label="Destinations with scroll buttons" scrollButtons />
      </div>
    </LabSection>
    <LabSection
      title="Removable and added tabs"
      description="Press a tab's close mark, or Delete on a focused tab, to remove it; the add button appends one."
    >
      <EditableTabs />
    </LabSection>
    <LabSection
      title="Disabled close marks"
      description="Summer and Autumn refuse removal. Disabling all tabs also stops Spring's close mark."
    >
      <DisabledRemovalTabs />
    </LabSection>
    <LabSection
      title="Count caps"
      description="Fractional caps round down; invalid caps show the full count."
    >
      <Tabs>
        <TabList aria-label="Count caps">
          <Tab id="fractional" count={5.9} countMax={2.9}>
            Fractional cap
          </Tab>
          <Tab id="invalid" count={5.9} countMax={Number.NaN}>
            Invalid cap
          </Tab>
        </TabList>
        <TabPanel id="fractional">The cap rounds down to 2.</TabPanel>
        <TabPanel id="invalid">An invalid cap shows the full count.</TabPanel>
      </Tabs>
    </LabSection>
    <LabSection
      title="Typed tab IDs"
      description="Numeric, text and whitespace-containing IDs keep separate selection and panel relationships."
    >
      <TypedKeyTabs />
    </LabSection>
    <LabSection
      title="Tab menu icons"
      description="Right-click a tab or press Shift+F10 on it. Rename takes a host icon, Delete draws none, and the host's Copy link and Add a note show with and without an icon, every label in line. Each action still runs."
    >
      <IconMenuTabs />
    </LabSection>
    <LabSection
      title="Rename, reorder and tab menu"
      description="Double-click a tab or press F2 to rename it (names must be unique); drag a tab or press Alt+Arrow to move it; right-click or press Shift+F10 for its menu."
    >
      <MealTabs />
    </LabSection>
    <LabSection
      title="Renaming from another field"
      description="The field renames the selected tab on every keystroke while focus stays in the field. The tab keeps its key, so it stays selected and its panel keeps the draft typed in it; its accessible name follows the new label. Long names make the list scroll; an empty name shows Untitled."
    >
      <LiveRenameTabs />
    </LabSection>
    <LabSection
      title="Tabs that lock while in use"
      description="Press Lock in a second, then rename a tab with F2 and type, or open a tab's menu: when the tabs lock, the edit ends without renaming and the menu closes, so Delete cannot run."
    >
      <LockingTabs />
    </LabSection>
    <LabSection
      title="Renaming while the layout changes"
      description="Press Switch scroll buttons in a second, then rename a tab with F2 and type: the list gains or drops its scroll buttons under the field, which keeps the draft and focus."
    >
      <SwitchingTabs />
    </LabSection>
    <LabSection
      title="Vertical reorder"
      description="Alt+ArrowUp and Alt+ArrowDown move the focused tab of a vertical list."
    >
      <VerticalReorderTabs />
    </LabSection>
    <LabSection
      title="Remembered selection"
      description="The selected tab is stored through the provider's storage and restored when the tabs mount again."
    >
      <RememberedTabs />
    </LabSection>
    <LabSection
      title="Links"
      description="Tabs with an href navigate through the provider's router; the selection follows the route."
    >
      <LinkTabs />
    </LabSection>
    <LabSection
      title="Actions between tabs"
      description="An ordinary action between selectable tabs. Narrow the menu example until its action no longer fits beside the menu: it scrolls instead, and the wheel scrolls it."
    >
      <InlineActionTabs />
      <InlineActionTabs overflow="menu" />
    </LabSection>
    <LabSection
      title="Manual activation"
      description="Arrow keys move focus only; Space or Enter selects the focused tab."
    >
      <Tabs keyboardActivation="manual">
        <TabList aria-label="Fruit, manual">
          {fruit.map((item) => (
            <Tab key={item.id} id={item.id}>
              {item.label}
            </Tab>
          ))}
        </TabList>
        {fruit.map((item) => (
          <TabPanel key={item.id} id={item.id}>
            {item.text}
          </TabPanel>
        ))}
      </Tabs>
    </LabSection>
    <TabsCompositionCases />
  </>,
);
