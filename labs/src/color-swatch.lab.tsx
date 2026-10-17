import { ColorSwatch } from '../../src/components/color-swatch/color-swatch.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const colours = ['#336699', '#cc3300', '#2e8b57', 'rgba(0, 0, 0, 0.5)', 'empty'] as const;

mountLab(
  <>
    <LabSection
      title="Colours and sizes"
      description="Opaque, translucent and empty swatches in every size."
    >
      <StateMatrix
        axes={{ colour: colours, size: sizes }}
        render={({ colour, size }) => (
          <ColorSwatch color={colour === 'empty' ? null : colour} size={size} />
        )}
      />
    </LabSection>
    <LabSection title="Names" description="A colour's own name, a given name and an added label.">
      <p>
        <ColorSwatch color="#336699" data-lab-swatch="named" /> Named by its colour
      </p>
      <p>
        <ColorSwatch color="#cc3300" colorName="Signal red" data-lab-swatch="given" /> A given name
      </p>
      <p>
        <ColorSwatch color="#2e8b57" aria-label="Approved" data-lab-swatch="label" /> An added label
      </p>
    </LabSection>
  </>,
);
