import { glyphNames } from '../../src/core/glyphs.js';
import { Icon } from '../../src/components/icon/icon.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;

mountLab(
  <>
    <LabSection title="Glyphs by size" description="Every built-in glyph in every box size.">
      <StateMatrix
        axes={{ glyph: glyphNames, size: sizes }}
        render={({ glyph, size }) => <Icon glyph={glyph} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Sources and accessibility"
      description="Decorative and labelled icons, and an icon drawn from a custom node."
    >
      <StateMatrix
        axes={{ source: ['glyph', 'custom node'], naming: ['decorative', 'labelled'], size: sizes }}
        render={({ source, naming, size }) => (
          <Icon
            size={size}
            {...(source === 'glyph' ? { glyph: 'info' as const } : {})}
            {...(naming === 'labelled' ? { label: 'Information' } : {})}
          >
            {source === 'custom node' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="8" />
              </svg>
            ) : null}
          </Icon>
        )}
      />
    </LabSection>
  </>,
);
