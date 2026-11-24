import { useState } from 'react';
import { Bubble, BubbleContent } from '../../src/components/bubble/index.js';
import { Button } from '../../src/components/button/index.js';
import {
  type ChatController,
  ChatParts,
  isAwaitingReader,
  useChatController,
} from '../../src/components/chat/index.js';
import { CopyButton } from '../../src/components/copy-button/index.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../../src/components/empty-state/index.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../../src/components/input-group/index.js';
import { Cluster, Stack } from '../../src/components/layout/index.js';
import { Message, MessageContent, MessageFooter } from '../../src/components/message/index.js';
import { usePromptSubmission } from '../../src/components/message-composer/index.js';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../src/components/message-scroller/index.js';
import { SendGlyph, StopGlyph } from '../../src/core/glyphs.js';
import { recipeHistory, recipeOlder, recipeReply } from './assistant-chat-data.js';

function AssistantThread({
  messages,
  props,
  label,
}: Pick<ChatController, 'messages' | 'props'> & { label: string }) {
  return (
    <MessageScroller>
      <MessageScrollerViewport aria-label={label}>
        {messages.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Start a conversation</EmptyTitle>
              <EmptyDescription>Ask for a weekend itinerary.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        <MessageScrollerContent>
          {messages.map(({ id, authorId, parts, status }) => {
            const sent = authorId === 'reader';
            const streaming = status === 'streaming';
            const text = parts
              .flatMap((part) => (part.type === 'text' ? [part.text] : []))
              .join('\n');
            return (
              <MessageScrollerItem
                key={id}
                messageId={id}
                scrollAnchor={sent}
                isStreaming={streaming}
                aria-busy={parts.some(isAwaitingReader) ? false : undefined}
              >
                <Message align={sent ? 'end' : 'start'} aria-label={sent ? 'You' : 'Assistant'}>
                  <MessageContent>
                    {sent ? (
                      <Bubble align="end" variant="muted">
                        <BubbleContent>{text}</BubbleContent>
                      </Bubble>
                    ) : (
                      <ChatParts
                        messageId={id}
                        parts={parts}
                        isStreaming={streaming}
                        onApprove={props.onApprove}
                        onDeny={props.onDeny}
                      />
                    )}
                  </MessageContent>
                  {!sent && !streaming && text ? (
                    <MessageFooter>
                      <CopyButton value={text} label="Copy reply" variant="ghost" size="sm" />
                    </MessageFooter>
                  ) : null}
                </Message>
              </MessageScrollerItem>
            );
          })}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

function AssistantPrompt({
  send,
  stop,
  isPending,
}: Pick<ChatController, 'send' | 'stop' | 'isPending'>) {
  const [draft, setDraft] = useState('');
  const prompt = usePromptSubmission({
    value: draft,
    onChange: setDraft,
    onSubmit: send,
    isPending,
  });
  return (
    <form onSubmit={prompt.onSubmit}>
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          placeholder="Ask for a weekend itinerary"
          value={draft}
          onChange={prompt.onChange}
          onKeyDown={prompt.onKeyDown}
        />
        <InputGroupAddon align="block-end">
          <Cluster grow justify="end">
            {isPending ? (
              <InputGroupButton icon={StopGlyph} label="Stop reply" size="sm" onPress={stop} />
            ) : (
              <InputGroupButton
                icon={SendGlyph}
                label="Send message"
                size="sm"
                type="submit"
                variant="primary"
                isDisabled={!prompt.canSubmit}
              />
            )}
          </Cluster>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export function AssistantChatCase({ hasHistory = false }: { hasHistory?: boolean }) {
  const controller = useChatController({
    currentUserId: 'reader',
    assistantId: 'guide',
    initialMessages: hasHistory ? recipeHistory : undefined,
    send: recipeReply,
  });
  const [conversation, setConversation] = useState(0);
  const [loadedOlder, setLoadedOlder] = useState(false);
  return (
    <div style={{ height: 430 }}>
      <Stack fill space="sm">
        <Cluster justify="end">
          {hasHistory ? (
            <Button
              size="sm"
              isDisabled={loadedOlder}
              onPress={() => {
                controller.updateMessages((messages) => [...recipeOlder, ...messages]);
                setLoadedOlder(true);
              }}
            >
              Load older messages
            </Button>
          ) : null}
          <Button
            size="sm"
            onPress={() => {
              controller.resetConversation(hasHistory ? recipeHistory : []);
              setConversation((current) => current + 1);
              setLoadedOlder(false);
            }}
          >
            New conversation
          </Button>
        </Cluster>
        <Stack grow space="none">
          <MessageScrollerProvider key={conversation} autoScroll>
            <AssistantThread
              messages={controller.messages}
              props={controller.props}
              label={hasHistory ? 'Conversation history' : 'Conversation'}
            />
          </MessageScrollerProvider>
        </Stack>
        <AssistantPrompt key={conversation} {...controller} />
      </Stack>
    </div>
  );
}
