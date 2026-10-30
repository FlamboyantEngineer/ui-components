import { glyphCatalog, glyphNames } from './glyph-catalog.js';
import { Icon } from '../../src/components/icon/icon.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;

mountLab(
  <>
    <LabSection title="Glyphs by size" description="Every built-in glyph in every box size.">
      <StateMatrix
        axes={{ glyph: glyphNames, size: sizes }}
        render={({ glyph, size }) => <Icon icon={glyphCatalog[glyph]} size={size} />}
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
            {...(source === 'glyph' ? { icon: glyphCatalog.info } : {})}
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
    <LabSection
      title="Inherited size"
      description="Icons sized inherit in text of three font sizes: each box follows the font."
    >
      <StateMatrix
        axes={{ fontSize: ['12', '16', '24'], glyph: ['info', 'check'] as const }}
        render={({ fontSize, glyph }) => (
          <span style={{ fontSize: Number(fontSize) }}>
            <Icon icon={glyphCatalog[glyph]} size="inherit" /> Ripe pears
          </span>
        )}
      />
    </LabSection>
  </>,
);
