// The Chat lab's surfaces: the chat is inline, so a host places it in a drawer, a popover or a tab.
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import { Drawer, DrawerTrigger } from '../../src/components/drawer/drawer.js';
import { Popover, PopoverTrigger } from '../../src/components/popover/popover.js';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { HelpGlyph } from '../../src/core/glyphs.js';
import { agents } from './chat-agent.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

/** A trip planner whose conversation outlives the surface it is shown in. */
function useSurfaceAssistant() {
  return useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
  });
}

const emptyHint = <p>Ask about trains, weather or where to eat.</p>;

function DrawerDemo() {
  const controller = useSurfaceAssistant();
  return (
    <DrawerTrigger>
      <Button size="sm">Open the trip planner</Button>
      <Drawer title="Trip planner" size="md" showCloseButton data-lab-surface="drawer">
        <div style={{ height: 'calc(100vh - 140px)' }}>
          <Chat
            {...controller.props}
            aria-label="Conversation with the trip planner"
            participants={assistantPeople}
            currentUserId={readerId}
            placeholder="Ask the trip planner…"
            emptyState={emptyHint}
          />
        </div>
      </Drawer>
    </DrawerTrigger>
  );
}

function LauncherDemo() {
  const controller = useSurfaceAssistant();
  return (
    <div
      data-lab-demo="launcher"
      style={{ position: 'relative', height: 120, border: '1px dashed', borderRadius: 8 }}
    >
      <div style={{ position: 'absolute', insetInlineEnd: 16, insetBlockEnd: 16 }}>
        <PopoverTrigger>
          <Button icon={HelpGlyph} label="Chat with the trip planner" variant="primary" />
          <Popover aria-label="Trip planner" placement="top end" data-lab-surface="popover">
            <div style={{ width: 290, height: 460 }}>
              <Chat
                {...controller.props}
                aria-label="Conversation with the trip planner"
                participants={assistantPeople}
                currentUserId={readerId}
                placeholder="Ask the trip planner…"
                emptyState={emptyHint}
                scrollMode="follow"
              />
            </div>
          </Popover>
        </PopoverTrigger>
      </div>
    </div>
  );
}

function TabDemo() {
  const controller = useSurfaceAssistant();
  return (
    <div
      data-lab-demo="tab"
      style={{
        maxWidth: 560,
        border: '1px solid var(--ref-border)',
        borderRadius: 'var(--ref-radius)',
        background: 'var(--ref-surface)',
      }}
    >
      <Tabs defaultSelectedKey="planner">
        <TabList aria-label="Side panel">
          <Tab id="planner">Trip planner</Tab>
          <Tab id="notes">Notes</Tab>
        </TabList>
        <TabPanel id="planner">
          <div style={{ height: 380, padding: '0 8px 8px' }}>
            <Chat
              {...controller.props}
              aria-label="Conversation with the trip planner in a tab"
              participants={assistantPeople}
              currentUserId={readerId}
              placeholder="Ask the trip planner…"
              emptyState={emptyHint}
              presentation="embedded"
            />
          </div>
        </TabPanel>
        <TabPanel id="notes">Notes for the trip.</TabPanel>
      </Tabs>
    </div>
  );
}

export function ChatSurfaceCases() {
  return (
    <LabSection
      title="Surfaces"
      description="Chat is inline: the host places it. Here the same trip planner opens in a side Drawer, and from a floating launcher button as a Popover; each conversation lives in the host's controller, so closing the surface keeps it. The small launcher follows the latest message (scrollMode follow) instead of anchoring your question at the top. In a panel's tab the chat is embedded (presentation embedded): its transcript draws no frame of its own, so the panel's surface shows through."
    >
      <DrawerDemo />
      <LauncherDemo />
      <TabDemo />
    </LabSection>
  );
}
