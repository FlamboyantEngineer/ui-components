import { InfoGlyph, MoreGlyph } from '../../src/core/glyphs.js';
import { IconLabel } from '../../src/components/icon-label/icon-label.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const longText = 'A considerably longer label that wraps or truncates in a narrow column';

mountLab(
  <>
    <LabSection title="Sizes" description="Icon box and gap for each size.">
      <StateMatrix
        axes={{ icon: ['glyph', 'custom node'], size: sizes }}
        render={({ icon, size }) => (
          <IconLabel
            size={size}
            label="Settings"
            icon={
              icon === 'glyph' ? (
                MoreGlyph
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>
              )
            }
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Options"
      description="Each option in a 180px column. Hide label keeps only the icon; hidden removes the whole label; live announces changes."
    >
      <StateMatrix
        axes={{
          option: ['default', 'truncate', 'grow', 'hide label', 'collapsible', 'live', 'hidden'],
          size: sizes,
        }}
        render={({ option, size }) => (
          <div data-lab-column="180" style={{ width: 180 }}>
            <IconLabel
              icon={InfoGlyph}
              size={size}
              label={longText}
              truncate={option === 'truncate'}
              grow={option === 'grow'}
              hideLabel={option === 'hide label'}
              collapsible={option === 'collapsible'}
              live={option === 'live' ? 'polite' : undefined}
              hidden={option === 'hidden'}
            />
          </div>
        )}
      />
    </LabSection>
  </>,
);
