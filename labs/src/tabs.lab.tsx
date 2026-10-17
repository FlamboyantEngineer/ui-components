import { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
          {...(icons ? { icon: 'info' as const } : {})}
          {...(counts ? { count: 15, countMax: 9, countLabel: '15 unread' } : {})}
        >
          Inbox
        </Tab>
        <Tab
          id="search"
          isDisabled={state === 'disabled tab'}
          {...(icons ? { icon: 'search' as const } : {})}
          {...(counts ? { count: 3, countLabel: '3 saved' } : {})}
        >
          Search
        </Tab>
        <Tab id="help" {...(icons ? { icon: 'help' as const } : {})}>
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

mountLab(
  <>
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
        <Tabs>
          <TabList aria-label="Cities">
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
      </div>
    </LabSection>
    <LabSection
      title="Links"
      description="Tabs with an href navigate through the provider's router; the selection follows the route."
    >
      <LinkTabs />
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
  </>,
);
