import { MoreGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { ChatList, type ChatConversation } from '../../src/components/chat-list/chat-list.js';
import { Button } from '../../src/components/button/button.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import { getNow, manyConversations, minutesAgo, rowKinds } from './chat-list-samples.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const kinds = ['person', 'group', 'assistant'] as const;
const rowStates = ['read', 'unread', 'muted', 'muted-unread'] as const;
const listStates = ['loading', 'empty', 'custom-empty', 'selected'] as const;

/** A conversation's own menu, drawn in its row: mark as read and mute. */
function RowMenu({
  conversation,
  onChange,
}: {
  conversation: ChatConversation;
  onChange: (change: Partial<ChatConversation>) => void;
}) {
  return (
    <MenuTrigger>
      <Button icon={MoreGlyph} label={`More for ${conversation.title}`} size="sm" />
      <MenuPopover>
        <Menu
          onAction={(key) =>
            onChange(key === 'read' ? { unreadCount: 0 } : { isMuted: !conversation.isMuted })
          }
        >
          <MenuItem id="read" isDisabled={!conversation.unreadCount}>
            Mark as read
          </MenuItem>
          <MenuItem id="mute">{conversation.isMuted ? 'Unmute' : 'Mute'}</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

/** Many conversations to search, open, mark read, mute and start. */
function InboxDemo() {
  const [conversations, setConversations] = useState(manyConversations);
  const [selectedId, setSelectedId] = useState<string | null>('trip');
  const update = (id: string, change: Partial<ChatConversation>) =>
    setConversations((list) =>
      list.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );
  const open = (id: string) => {
    setSelectedId(id);
    update(id, { unreadCount: 0 });
  };
  const start = () => {
    const id = `new-${conversations.length}`;
    setConversations((list) => [{ id, title: 'New conversation', time: minutesAgo(0) }, ...list]);
    setSelectedId(id);
  };
  const selected = conversations.find((item) => item.id === selectedId);
  return (
    <div data-lab-demo="inbox">
      <div style={{ height: 420, width: 360 }}>
        <ChatList
          conversations={conversations}
          selectedId={selectedId}
          onSelectionChange={open}
          onNew={start}
          getNow={getNow}
          renderActions={(conversation) => (
            <RowMenu
              conversation={conversation}
              onChange={(change) => update(conversation.id, change)}
            />
          )}
        />
      </div>
      <output data-lab-log="inbox">Open: {selected?.title ?? 'none'}</output>
    </div>
  );
}

/** A host that searches itself: the list reports the text and shows what the host found. */
function HostSearchDemo() {
  const [query, setQuery] = useState('');
  const found = manyConversations.filter((item) =>
    item.title.toLowerCase().startsWith(query.toLowerCase()),
  );
  return (
    <div style={{ height: 260, width: 360 }} data-lab-demo="host-search">
      <ChatList
        aria-label="Conversations found by the host"
        conversations={found}
        onSearchChange={setQuery}
        getNow={getNow}
      />
    </div>
  );
}

function RowCell({
  kind,
  state,
}: {
  kind: (typeof kinds)[number];
  state: (typeof rowStates)[number];
}) {
  const conversation = {
    ...rowKinds[kind],
    unreadCount: state === 'unread' || state === 'muted-unread' ? 3 : 0,
    isMuted: state.startsWith('muted'),
  };
  return (
    <div style={{ width: 300 }}>
      <ChatList aria-label={`${kind} ${state}`} conversations={[conversation]} getNow={getNow} />
    </div>
  );
}

function StateCell({ state }: { state: (typeof listStates)[number] }) {
  const conversations =
    state === 'empty' || state === 'custom-empty' ? [] : manyConversations.slice(0, 3);
  return (
    <div style={{ height: 240, width: 300 }}>
      <ChatList
        aria-label={`Conversations ${state}`}
        conversations={conversations}
        isLoading={state === 'loading'}
        selectedId={state === 'selected' ? 'trip' : null}
        onNew={() => {}}
        emptyState={state === 'custom-empty' ? <p>Say hello to your team.</p> : undefined}
        getNow={getNow}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Conversations"
      description="Forty conversations, one-to-one with presence, groups, an assistant, unread and muted. Search narrows them by title and last message; each row's menu marks it read or mutes it; New chat starts one. Arrow keys move between rows, Left and Right into a row's menu, Enter or Space opens a conversation. The clock is fixed at 20 April 2026, 10:30."
    >
      <InboxDemo />
    </LabSection>
    <LabSection
      title="Rows"
      description="Each kind of conversation, read, unread, muted, and muted with unread messages."
    >
      <StateMatrix
        axes={{ kind: kinds, state: rowStates }}
        render={({ kind, state }) => <RowCell kind={kind} state={state} />}
      />
    </LabSection>
    <LabSection
      title="States"
      description="Loading, empty, a host's empty state and a selected conversation."
    >
      <StateMatrix
        axes={{ state: listStates }}
        render={({ state }) => <StateCell state={state} />}
      />
    </LabSection>
    <LabSection
      title="Host search"
      description="The host searches itself: here it keeps titles that start with the search text."
    >
      <HostSearchDemo />
    </LabSection>
  </>,
);
