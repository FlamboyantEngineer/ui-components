import { useState } from 'react';
import { type ChatConversation, ChatList } from '../../src/components/chat-list/chat-list.js';
import { Menu, MenuItem } from '../../src/components/menu/menu.js';
import {
  getNow,
  historyConversations,
  manyConversations,
  minutesAgo,
  rowKinds,
} from './chat-list-samples.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const kinds = ['person', 'group', 'assistant', 'title', 'icon', 'status', 'activity'] as const;
const rowStates = ['read', 'unread', 'muted', 'muted-unread'] as const;
const listStates = ['loading', 'empty', 'custom-empty', 'selected'] as const;

/** A conversation's commands: mark as read and mute. */
function ConversationMenu({
  conversation,
  onChange,
}: {
  conversation: ChatConversation;
  onChange: (change: Partial<ChatConversation>) => void;
}) {
  return (
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
  );
}

/** A conversation's history commands: rename and delete. */
function HistoryMenu({ onDelete }: { onDelete: () => void }) {
  return (
    <Menu onAction={(key) => (key === 'delete' ? onDelete() : undefined)}>
      <MenuItem id="rename">Rename</MenuItem>
      <MenuItem id="delete">Delete</MenuItem>
    </Menu>
  );
}

/** How many conversations each page of the history adds. */
const historyPage = 10;

/** Titles only, a page at a time: open one, start one, delete one or load the next page. */
function HistoryDemo() {
  const [shown, setShown] = useState(historyPage);
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const [added, setAdded] = useState<readonly ChatConversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>('history-1');
  const all = [...added, ...historyConversations].filter((item) => !removed.includes(item.id));
  const remove = (id: string) => setRemoved((list) => [...list, id]);
  const start = () => {
    const id = `started-${added.length + 1}`;
    setAdded((list) => [{ id, title: 'New chat' }, ...list]);
    setSelectedKey(id);
  };
  return (
    <div data-lab-demo="history" style={{ height: 520, width: 300 }}>
      <ChatList
        heading="Recents"
        conversations={all.slice(0, shown)}
        selectedKey={selectedKey}
        onSelectionChange={setSelectedKey}
        onNew={start}
        onLoadMore={shown < all.length ? () => setShown((count) => count + historyPage) : undefined}
        renderContextMenu={(conversation) => (
          <HistoryMenu onDelete={() => remove(conversation.id)} />
        )}
      />
    </div>
  );
}

/** Many conversations to search, open, mark read, mute and start. */
function InboxDemo() {
  const [conversations, setConversations] = useState(manyConversations);
  const [selectedKey, setSelectedId] = useState<string | null>('trip');
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
  const selected = conversations.find((item) => item.id === selectedKey);
  return (
    <div data-lab-demo="inbox">
      <div style={{ height: 420, width: 360 }}>
        <ChatList
          conversations={conversations}
          selectedKey={selectedKey}
          onSelectionChange={open}
          showSearch
          onNew={start}
          getNow={getNow}
          renderContextMenu={(conversation) => (
            <ConversationMenu
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
        showSearch
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
        selectedKey={state === 'selected' ? 'trip' : null}
        showSearch
        onNew={() => {}}
        emptyState={state === 'custom-empty' ? <p>Say hello to your team.</p> : undefined}
        getNow={getNow}
      />
    </div>
  );
}

const fallbacks = ['default', 'fallbackAfterDays 2'] as const;

/** A conversation from four days ago, read with the default fallback or an earlier one. */
function FallbackCell({ fallback }: { fallback: (typeof fallbacks)[number] }) {
  const conversation = { id: 'museum', title: 'Museum visit', time: '2026-04-16T09:00:00' };
  return (
    <div style={{ width: 300 }}>
      <ChatList
        aria-label={`Fallback ${fallback}`}
        conversations={[conversation]}
        getNow={getNow}
        fallbackAfterDays={fallback === 'default' ? undefined : 2}
        timeZone="Europe/Lisbon"
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="History"
      description="An assistant's chat history: a New chat row, the Recents heading and titles only. The first conversation's assistant is working: its dots pulse and its name says Working. Every row but the second carries the history mark, read in its name as Earlier versions. A row's context menu (a secondary click, a long touch, the Context Menu key or Shift+F10) renames or deletes it. While more conversations can load, the last two rows fade above the Load more row, which adds ten at a time."
    >
      <HistoryDemo />
    </LabSection>
    <LabSection
      title="Conversations"
      description="Forty conversations, one-to-one with presence, groups, an assistant, unread and muted, with the search field shown (showSearch). Search narrows them by title and last message; each row's context menu (a secondary click, a long touch, the Context Menu key or Shift+F10) marks it read or mutes it, and focus returns to the row; New chat starts one. Arrow keys move between rows and Enter or Space opens a conversation. The clock is fixed at 20 April 2026, 10:30."
    >
      <InboxDemo />
    </LabSection>
    <LabSection
      title="Rows"
      description="Each kind of conversation, read, unread, muted, and muted with unread messages: a person, a group, an assistant with its own avatar, a title alone, a title with an icon, a title with a status mark and one whose participant is typing."
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
      title="Time options"
      description="A conversation from four days ago reads in days by default and as its date with fallbackAfterDays 2, in the row and in its name; timeZone sets the zone it reads days in."
    >
      <StateMatrix
        axes={{ fallback: fallbacks }}
        render={({ fallback }) => <FallbackCell fallback={fallback} />}
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
