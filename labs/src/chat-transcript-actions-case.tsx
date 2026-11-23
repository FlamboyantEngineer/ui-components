import { ChatMessageActions } from '../../src/components/chat/index.js';
import { ChatMessage, ChatTranscript } from '../../src/components/chat-transcript/index.js';
import { at, getNow, helper, maria } from './chat-transcript-message-samples.js';
import { LabSection } from './chrome/index.js';

const question =
  'Could you plan a quiet two-day walk along the coast for the first weekend of May, with a night in a small guesthouse, a lunch stop near the lighthouse and a ferry back that leaves after four?';

/**
 * A long sent message in a transcript as wide as the page, so the sent bubble reaches its widest and
 * the body around it is wider still: the actions sit at the bubble's top corner all the same.
 */
export function ChatTranscriptActionsCase() {
  return (
    <LabSection
      title="Actions on a long message"
      description="Hover or tab into the long sent message: its Copy and Reply bar sits at the bubble's upper-left corner, not at the edge of the wider row around it. The reply's bar sits at its bubble's upper-right corner."
    >
      <div style={{ height: 360 }} data-lab-demo="long-actions">
        <ChatTranscript aria-label="A long sent message with its actions">
          <ChatMessage
            id="long-actions-ask"
            origin="sent"
            author={maria}
            time={at(20, 9, 50)}
            getNow={getNow}
            actions={<ChatMessageActions copyText={question} onReply={() => {}} />}
          >
            {question}
          </ChatMessage>
          <ChatMessage
            id="long-actions-reply"
            origin="received"
            author={helper}
            time={at(20, 9, 51)}
            getNow={getNow}
            actions={<ChatMessageActions copyText="Here is a plan." onReply={() => {}} />}
          >
            Here is a plan: walk to the lighthouse on Saturday and take the 16:30 ferry back on
            Sunday.
          </ChatMessage>
        </ChatTranscript>
      </div>
    </LabSection>
  );
}
