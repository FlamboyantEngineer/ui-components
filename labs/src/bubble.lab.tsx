import { Bubble, BubbleContent } from '../../src/components/bubble/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

mountLab(
  <LabSection title="Bubble surfaces and alignment">
    <StateMatrix
      axes={{
        align: ['start', 'end'],
        variant: ['default', 'muted', 'outline', 'ghost'],
      }}
      render={({ align, variant }) => (
        <div style={{ inlineSize: '15rem' }}>
          <Bubble
            aria-label={`${align} ${variant} bubble`}
            role="group"
            align={align}
            variant={variant}
          >
            <BubbleContent>Take the ferry at six.</BubbleContent>
          </Bubble>
        </div>
      )}
    />
  </LabSection>,
);
