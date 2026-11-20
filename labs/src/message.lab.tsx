import { Avatar } from '../../src/components/avatar/index.js';
import { Bubble, BubbleContent } from '../../src/components/bubble/index.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '../../src/components/message/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const reply = 'The lighthouse footpath starts at the west quay.';

mountLab(
  <>
    <LabSection title="Message alignment and streaming">
      <StateMatrix
        axes={{ align: ['start', 'end'], state: ['complete', 'streaming'] }}
        render={({ align, state }) => (
          <Message
            aria-label={`${align} ${state} message`}
            align={align}
            isStreaming={state === 'streaming'}
          >
            <MessageContent>{reply}</MessageContent>
            <MessageFooter>
              {state === 'complete' ? <CopyButton label="Copy reply" value={reply} /> : 'Writing…'}
            </MessageFooter>
          </Message>
        )}
      />
    </LabSection>
    <LabSection title="Groups with avatars and headers">
      <StateMatrix
        axes={{ align: ['start', 'end'], avatar: ['with avatar', 'without avatar'] }}
        render={({ align, avatar }) => (
          <div style={{ inlineSize: '22rem' }}>
            <MessageGroup role="group" aria-label={`${align} turn ${avatar}`}>
              <Message aria-label={`${align} first message ${avatar}`} align={align}>
                {avatar === 'with avatar' ? (
                  <MessageAvatar>
                    <Avatar name="Rosa Vidal" size="sm" />
                  </MessageAvatar>
                ) : null}
                <MessageContent>
                  <MessageHeader>
                    <span>Rosa Vidal</span>
                    <time dateTime="2026-11-20T09:30">9:30</time>
                  </MessageHeader>
                  <Bubble align={align} variant="muted">
                    <BubbleContent>Is the ferry still running?</BubbleContent>
                  </Bubble>
                  <Bubble align={align} variant="muted">
                    <BubbleContent>I land at six.</BubbleContent>
                  </Bubble>
                  <MessageFooter>Read</MessageFooter>
                </MessageContent>
              </Message>
            </MessageGroup>
          </div>
        )}
      />
    </LabSection>
  </>,
);
