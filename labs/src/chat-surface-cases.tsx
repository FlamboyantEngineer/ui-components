// The Chat lab's surfaces: the chat is inline, so a host places it in a drawer or a popover.

import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import { Drawer, DrawerTrigger } from '../../src/components/drawer/drawer.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { Popover, PopoverTrigger } from '../../src/components/popover/popover.js';
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
          <IconButton icon="help" label="Chat with the trip planner" variant="primary" />
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

export function ChatSurfaceCases() {
  return (
    <LabSection
      title="Surfaces"
      description="Chat is inline: the host places it. Here the same trip planner opens in a side Drawer, and from a floating launcher button as a Popover; each conversation lives in the host's controller, so closing the surface keeps it. The small launcher follows the latest message (scrollMode follow) instead of anchoring your question at the top."
    >
      <DrawerDemo />
      <LauncherDemo />
    </LabSection>
  );
}
