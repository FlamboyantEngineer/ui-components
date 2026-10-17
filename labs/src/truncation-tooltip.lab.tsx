import { TruncationTooltip } from '../../src/components/truncation-tooltip/truncation-tooltip.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const longText = 'Quarterly report for the northern region, final edition.pdf';
const shortText = 'Report.pdf';

mountLab(
  <>
    <LabSection
      title="Cut and whole text"
      description="Each in a 160px column. Rest the pointer on cut text to see it whole; whole text shows nothing."
    >
      <StateMatrix
        axes={{ text: ['cut', 'whole'], holder: ['plain', 'link'] }}
        render={({ text, holder }) => {
          const label = (
            <TruncationTooltip data-lab-text={text}>
              {text === 'cut' ? longText : shortText}
            </TruncationTooltip>
          );
          return (
            <div style={{ width: 160 }}>
              {holder === 'link' ? <a href={`#${text}`}>{label}</a> : label}
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Placement"
      description="A tooltip that prefers the side below the text, in a 160px column."
    >
      <div style={{ width: 160 }}>
        <TruncationTooltip placement="bottom" data-lab-text="below">
          {longText}
        </TruncationTooltip>
      </div>
    </LabSection>
    <LabSection
      title="Show more and less"
      description="Expandable text in a 200px column: Show more reveals cut text whole in place, Show less cuts it again. Text that fits draws no control."
    >
      <StateMatrix
        axes={{ expandable: ['cut', 'whole'] }}
        render={({ expandable }) => (
          <div style={{ width: 200 }}>
            <TruncationTooltip expandable data-lab-text={`expandable ${expandable}`}>
              {expandable === 'cut'
                ? 'Simmer the tomatoes with garlic and basil for twenty minutes, then season to taste.'
                : shortText}
            </TruncationTooltip>
          </div>
        )}
      />
    </LabSection>
  </>,
);
