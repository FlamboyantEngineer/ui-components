import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '../../src/components/bubble/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

mountLab(
  <>
    <LabSection title="Bubble surfaces and alignment">
      <StateMatrix
        axes={{
          align: ['start', 'end'],
          variant: ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'],
        }}
        render={({ align, variant }) => (
          <div style={{ inlineSize: '12rem' }}>
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
    </LabSection>
    <LabSection title="Grouped bubbles with reactions">
      <StateMatrix
        axes={{ side: ['bottom', 'top'], align: ['start', 'end'] }}
        render={({ side, align }) => (
          <div style={{ inlineSize: '15rem' }}>
            <BubbleGroup role="group" aria-label={`${side} ${align} reactions`}>
              <Bubble variant="muted">
                <BubbleContent>The ferry leaves at six.</BubbleContent>
              </Bubble>
              <Bubble variant="muted">
                <BubbleContent>Bring a coat for the crossing.</BubbleContent>
                <BubbleReactions side={side} align={align}>
                  <span aria-hidden="true">👍</span> 3
                </BubbleReactions>
              </Bubble>
            </BubbleGroup>
          </div>
        )}
      />
    </LabSection>
  </>,
);
