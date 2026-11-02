import { InfoGlyph, MoreGlyph } from '../../src/core/glyphs.js';
import { IconLabel } from '../../src/components/icon-label/icon-label.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const longText = 'A considerably longer label that wraps or truncates in a narrow column';

const syncStates = ['Synced 2 minutes ago', 'Syncing…', 'Sync failed, retrying'];
const liveModes = { off: undefined, polite: 'polite', assertive: 'assertive' } as const;

/** A status label the reader changes, announced or not by its live mode. */
function LiveStatus({ mode }: { mode: keyof typeof liveModes }) {
  const [step, setStep] = useState(0);
  return (
    <div data-lab-live={mode}>
      <IconLabel
        icon={InfoGlyph}
        label={syncStates[step % syncStates.length]}
        live={liveModes[mode]}
      />{' '}
      <Button size="sm" onPress={() => setStep((value) => value + 1)}>
        {`Change the ${mode} status`}
      </Button>
    </div>
  );
}

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
    <LabSection
      title="Collapsible"
      description="A collapsible label in columns of each width, alone and in a row beside other content: its text hides when its own room is under 8rem."
    >
      <StateMatrix
        axes={{ placement: ['alone', 'in a row'], room: ['96px', '160px', '320px'] }}
        render={({ placement, room }) => (
          <div style={{ width: room, display: placement === 'in a row' ? 'flex' : 'block' }}>
            <IconLabel icon={InfoGlyph} label="Collapsible settings" collapsible />
            {placement === 'in a row' ? <span aria-hidden>⋯</span> : null}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Live announcements"
      description="Press a button (with the pointer, or Tab to it and press Enter) to change the status beside it. With a screen reader running, the off label stays quiet, polite waits for a pause and assertive interrupts; the label's aria-live carries the mode."
    >
      <StateMatrix
        axes={{ live: ['off', 'polite', 'assertive'] as const }}
        render={({ live }) => <LiveStatus mode={live} />}
      />
    </LabSection>
  </>,
);
