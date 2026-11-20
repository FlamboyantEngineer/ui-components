import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { Message, MessageContent, MessageFooter } from '../../src/components/message/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const reply = 'The lighthouse footpath starts at the west quay.';

mountLab(
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
  </LabSection>,
);
