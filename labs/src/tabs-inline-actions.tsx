import { useCallback, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Cluster } from '../../src/components/layout/layout.js';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { InfoGlyph, PlusGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';

export function InlineActionTabs({ overflow = 'scroll' }: { overflow?: 'scroll' | 'menu' }) {
  const [selected, setSelected] = useState<Key>('inbox');
  const [count, setCount] = useState(0);
  const [changed, setChanged] = useState(false);
  const [showAction, setShowAction] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [rtl, setRtl] = useState(false);
  const renderAfterTab = useCallback(
    (key: Key) =>
      showAction && key === (changed ? ' reports ' : 'drafts') ? (
        <Button
          icon={PlusGlyph}
          label="Add item"
          size="sm"
          onPress={() => setCount((value) => value + 1)}
        />
      ) : null,
    [changed, showAction],
  );
  return (
    <div data-lab-demo={`inline-action-${overflow}`}>
      <UiProvider locale={rtl ? 'he-IL' : 'en-US'}>
        <div dir={rtl ? 'rtl' : 'ltr'}>
          <Tabs selectedKey={selected} onSelectionChange={setSelected} isDisabled={disabled}>
            <Cluster wrap="nowrap" space="none" justify="between" fill>
              <TabList
                aria-label={`Mailbox ${overflow}`}
                overflow={overflow}
                renderAfterTab={renderAfterTab}
              >
                <Tab id="inbox">Inbox</Tab>
                {changed ? <Tab id=" reports ">Reports</Tab> : <Tab id="drafts">Drafts</Tab>}
                <Tab id="archive" isDisabled>
                  Archive
                </Tab>
                <Tab id="settings">Settings</Tab>
              </TabList>
              <Cluster role="toolbar" aria-label="Mailbox actions" justify="end" grow="none">
                <Button icon={InfoGlyph} label="Refresh" size="sm" />
              </Cluster>
            </Cluster>
            <TabPanel id="inbox">Inbox messages.</TabPanel>
            {changed ? (
              <TabPanel id=" reports ">Report messages.</TabPanel>
            ) : (
              <TabPanel id="drafts">Draft messages.</TabPanel>
            )}
            <TabPanel id="archive">Archived messages.</TabPanel>
            <TabPanel id="settings">Mailbox settings.</TabPanel>
          </Tabs>
        </div>
      </UiProvider>
      <Cluster>
        <Button
          onPress={() => {
            setSelected('inbox');
            setChanged((value) => !value);
          }}
        >
          Change items
        </Button>
        <Button onPress={() => setShowAction((value) => !value)}>Toggle action</Button>
        <Button onPress={() => setDisabled((value) => !value)}>Toggle disabled</Button>
        <Button onPress={() => setRtl((value) => !value)}>Toggle direction</Button>
      </Cluster>
      <p data-lab-output="selection">
        Selected {String(selected)}; added {count}
      </p>
    </div>
  );
}
