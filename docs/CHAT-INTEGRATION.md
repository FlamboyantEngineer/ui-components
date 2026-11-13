# Embedded Chat

The reference stylesheet supports a bounded flex-column panel containing `LoadingRegion` and `Chat`. Give the host panel a height (or a bounded flex share) and `min-height: 0`; do the same for any intervening host flex items. The region's own content wrapper fills and shrinks automatically. Page placement, sidebar widths and application breakpoints belong to the host. Header titles truncate while actions remain available. Jump to latest is centered. Use `composerEndControls` for trailing controls; start and end follow the document direction, including after wrapping.

```tsx
<LoadingRegion isLoading={isLoading}>
  <Chat
    {...conversation}
    presentation="embedded"
    receivedVariant="plain"
    thinkingUntil="content"
    thinkingIcon={null}
    showHeaderIdentity={false}
    composerEndControls={<ChatModelPicker models={models} />}
    deliveryPresentation="fade"
    placeholder={(hint) => `Write a follow-up · ${hint.text}`}
  />
</LoadingRegion>
```

Omitting `thinkingIcon` uses the default spinner, `null` makes the thinking line text only, and a supplied nonempty node replaces the spinner. Status text, announcements and busy state are independent of that decoration. `ChatHeader.showIdentity` controls the same identity when composing a header separately. Message avatars remain governed by `showAvatars`.

`deliveryPresentation: 'label' | 'fade'` defaults to label. Fade dims the content of a sent message with `delivery: 'sending'` and keeps its Sending label visually hidden for assistive technology. The host owns delivery state; update it to sent, delivered, read or failed when the transport settles. The normal appearance and error/retry controls return on settlement. Composer acceptance progress and message delivery are distinct states.

## Standalone results

Keep significant result labels outside automatic tool groups with an explicit grouping policy. Ordinary tool calls still group consecutively.

```tsx
const result: ChatToolCallPart = {
  type: 'tool-call',
  id: 'check-result',
  name: 'check_items',
  label: '80 new check errors',
  kind: 'command',
  status: 'failed',
  grouping: 'standalone',
  defaultExpanded: false,
  result: numberedLiteralDetails,
};
```

Full Chat renders the row directly and retains the reader's expansion by conversation, message and part ID across polling and virtual unmounts. Set `activityTimePlacement="none"` to omit timestamps on activity-only messages. Separate `ChatParts` compositions can control expansion through `expandedParts` and `onExpandedPartsChange`. Pending questions inside full Chat also retain partial answers, the current step and in-flight submissions. Tool denial forms retain their text and open state without stealing focus on remount. A conversation change starts these choices afresh, even when IDs repeat.

## Immediate replies and hints

```ts
onSendNow?: (
  text: string,
  tokens?: readonly ChatTextToken[],
  replyTo?: string,
) => void | Promise<unknown>;

interface ChatComposerHint {
  action: 'send' | 'queue' | 'steer' | 'save';
  shortcut: string | undefined;
  sendNowShortcut: string | undefined;
  text: string;
}

placeholder?: string | ((hint: ChatComposerHint) => string);
```

An active quote reaches `onSendNow` through both the immediate chord and automatic steering. A synchronous return accepts at once and clears the submitted draft and quote. A returned promise delays acceptance until resolution. A throw or rejection preserves the draft and quote; `onSendError` handles the error. A later draft or conversation is protected from a late settlement.

```tsx
<Chat
  {...conversation}
  onSendNow={(text, tokens, replyTo) => transport.acceptImmediate({ text, tokens, replyTo })}
  placeholder={(hint) => `${emptyDraftLabel} · ${hint.text}`}
/>
```

The hint uses the resolved send options, pending/automatic steering and edit mode, touch-pointer rules, provider messages and platform key names (Command on macOS). Quotes use the same effective mode. The host supplies its own empty-draft wording instead of repeating submission rules.

## Queue ownership

`queue` is separate from `messages`. While pending, admit ordinary submissions directly to the host queue; append them to the transcript only when they are dispatched. `useChatController` already does this without a transient transcript insert. `onQueueChange` receives the full list when it is reordered, edited or a row is deleted. Preserve IDs, tokens, quotes and files when applying it. The handle supports native pointer and keyboard drag/drop. The three-dot menu holds Edit, and Steer sends a queued instruction now. The reference queue adjoins the composer without unrelated page controls. Backend ordering, retries and leases remain transport responsibilities.

## Polling identities

Retain equal immutable JSON messages at the transport boundary before passing them to Chat. The library does not deep-compare arbitrary message values on every render: custom parts, renderer inputs, tool arguments and results may hold non-JSON values with semantics that serialization cannot capture. A public generic JSON cache would misleadingly accept these through `ChatMessageData`, or require a second message schema solely for caching. This adapter therefore remains with the transport owner; application context and other snapshot caches remain there too.

The lab's `retainChatSnapshot` demonstrates stable-ID lookup and complete JSON serialization comparison for its JSON-only fixture, keeping order, edits, removals and streaming changes. Such an adapter requires immutable snapshots and unique IDs. JSON cannot represent functions, React elements, symbols, cycles, BigInt or non-finite numbers; omission of undefined properties and object key ordering must follow the transport's own canonical serialization contract. Never apply JSON equality to arbitrary React values or mutate retained objects. With stable messages, Chat's memoized views avoid historical renders while typing or receiving an unchanged snapshot; its virtual window bounds mounted content, while search still examines full message data.
