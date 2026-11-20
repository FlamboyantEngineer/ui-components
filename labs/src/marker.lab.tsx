import { Icon } from '../../src/components/icon/icon.js';
import { Marker, MarkerContent, MarkerIcon } from '../../src/components/marker/index.js';
import { ClockGlyph } from '../../src/core/glyphs.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

mountLab(
  <LabSection title="Marker variants">
    <StateMatrix
      axes={{
        content: ['text', 'icon and link'],
        variant: ['default', 'separator', 'border'],
      }}
      render={({ content, variant }) => (
        <div style={{ inlineSize: '16rem' }}>
          <Marker variant={variant} role="group" aria-label={`${variant} ${content} marker`}>
            {content === 'text' ? null : (
              <MarkerIcon>
                <Icon icon={ClockGlyph} size="inherit" />
              </MarkerIcon>
            )}
            <MarkerContent>
              {content === 'text' ? 'Yesterday' : <a href="#stopped">Reply stopped</a>}
            </MarkerContent>
          </Marker>
        </div>
      )}
    />
  </LabSection>,
);
