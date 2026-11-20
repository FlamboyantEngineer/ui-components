import { useState } from 'react';
import { Bubble, BubbleContent } from '../../src/components/bubble/index.js';
import { Button } from '../../src/components/button/button.js';
import { Message, MessageContent, MessageFooter } from '../../src/components/message/index.js';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  type MessageScrollerDefaultScrollPosition,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../src/components/message-scroller/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const earlier = [
  'The morning ferry stops at the west quay.',
  'The path to the lighthouse is steep and takes an hour.',
  'The bakery has benches at the back.',
  'The north beach is sheltered from the wind.',
  'The last ferry leaves at six.',
  'A shorter walk follows the harbour wall.',
];
const paragraph =
  'Start at the harbour and take the footpath past the bakery. Follow the stone wall up to the meadow and continue toward the lighthouse. Come back along the lower path for views of the bay.';

function ConversationCase() {
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [stage, setStage] = useState(0);
  const history = hasOlderMessages ? ['The east quay is closed today.', ...earlier] : earlier;
  return (
    <>
      <div>
        <Button isDisabled={hasOlderMessages} onPress={() => setHasOlderMessages(true)}>
          Prepend history
        </Button>{' '}
        <Button isDisabled={stage !== 0} onPress={() => setStage(1)}>
          Add prompt
        </Button>{' '}
        <Button isDisabled={stage === 0 || stage >= 3} onPress={() => setStage(stage + 1)}>
          Grow reply
        </Button>{' '}
        <Button isDisabled={stage === 0 || stage === 4} onPress={() => setStage(4)}>
          Complete reply
        </Button>
      </div>
      <div style={{ height: 240, maxWidth: 560 }}>
        <MessageScrollerProvider autoScroll>
          <MessageScroller>
            <MessageScrollerViewport aria-label="Island conversation">
              <MessageScrollerContent>
                {history.map((entry) => (
                  <MessageScrollerItem key={entry} messageId={entry}>
                    <Message>
                      <MessageContent>{entry}</MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
                {stage > 0 ? (
                  <>
                    <MessageScrollerItem messageId="prompt" scrollAnchor>
                      <Message aria-label="Prompt" align="end">
                        <MessageContent>
                          <Bubble align="end" variant="muted">
                            <BubbleContent>What is the best route to the lighthouse?</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                    <MessageScrollerItem messageId="reply" isStreaming={stage < 4}>
                      <Message aria-label="Reply">
                        <MessageContent>
                          {Array.from({ length: stage === 1 ? 1 : stage * 3 }, (_, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </MessageContent>
                        {stage === 4 ? <MessageFooter>Route ready</MessageFooter> : null}
                      </Message>
                    </MessageScrollerItem>
                  </>
                ) : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="start">Jump to first</MessageScrollerButton>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
    </>
  );
}

function OpeningCase({
  position,
  autoScroll,
}: {
  position: MessageScrollerDefaultScrollPosition;
  autoScroll: boolean;
}) {
  return (
    <div style={{ height: 144, width: 220 }}>
      <MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition={position}>
        <MessageScroller>
          <MessageScrollerViewport
            aria-label={`Opens at ${position}, following ${autoScroll ? 'on' : 'off'}`}
          >
            <MessageScrollerContent>
              {earlier.map((entry, index) => (
                <MessageScrollerItem key={entry} messageId={entry} scrollAnchor={index === 3}>
                  <Message>
                    <MessageContent>{entry}</MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="Prompt, streamed reply and history">
      <ConversationCase />
    </LabSection>
    <LabSection title="Opening position and following">
      <StateMatrix
        axes={{ position: ['start', 'end', 'last-anchor'], following: ['on', 'off'] }}
        render={({ position, following }) => (
          <OpeningCase position={position} autoScroll={following === 'on'} />
        )}
      />
    </LabSection>
  </>,
);
