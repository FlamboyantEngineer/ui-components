import { CommentThread, CommentThreadReply } from '../../src/components/comment-thread/index.js';
import { LabSection } from './chrome/index.js';
import { ZoneComparison, getNearMidnightNow, nearMidnightInstant } from './time-zone-samples.js';

/** One reply read in the provider's zone beside the same reply with its own zone. */
function ZonedReplies() {
  return (
    <div data-lab-demo="reply-zones">
      <ZoneComparison>
        {({ timeZone }) => (
          <CommentThread isReadOnly>
            <CommentThreadReply
              author={{ name: 'Jon Berg', colorKey: 'jon' }}
              time={nearMidnightInstant}
              text="Inherits the provider's zone."
              getNow={getNearMidnightNow}
              data-lab-zone-reply="inherited"
            />
            <CommentThreadReply
              author={{ name: 'Lena Ortiz', colorKey: 'lena' }}
              time={nearMidnightInstant}
              text="Reads in its own zone."
              getNow={getNearMidnightNow}
              timeZone={timeZone}
              data-lab-zone-reply="override"
            />
          </CommentThread>
        )}
      </ZoneComparison>
    </div>
  );
}

export function CommentThreadZoneCases() {
  return (
    <LabSection
      title="Reply time zones"
      description="The clock is fixed at 20 April 2026, 23:30 UTC, and both replies were posted at 22:00 UTC on the 19th. The first reads in the provider's zone; the second takes the override as its own timeZone."
    >
      <ZonedReplies />
    </LabSection>
  );
}
