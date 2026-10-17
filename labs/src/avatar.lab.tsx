import { useState, type ReactNode } from 'react';
import { Avatar, type AvatarSize } from '../../src/components/avatar/avatar.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { brokenPicture, samplePicture } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg', 'fill'] as const;
const variants = ['filled', 'outlined'] as const;
const slots = ['0', '1', '2', '3', '4', '5', '6', '7'] as const;

/** A `fill` avatar takes the box its container gives it; the lab gives it 48 pixels. */
function Box({ size, children }: { size: AvatarSize; children: ReactNode }) {
  return size === 'fill' ? (
    <div data-lab-box="48" style={{ width: 48, height: 48 }}>
      {children}
    </div>
  ) : (
    children
  );
}

function PictureFallback() {
  const [broken, setBroken] = useState(false);
  return (
    <div>
      <Avatar
        name="Jon Berg"
        size="lg"
        src={broken ? brokenPicture : samplePicture}
        data-lab-avatar="fallback"
      />
      <p>
        <Button size="sm" onPress={() => setBroken(true)} isDisabled={broken}>
          Break the picture
        </Button>{' '}
        <Button size="sm" onPress={() => setBroken(false)} isDisabled={!broken}>
          Restore the picture
        </Button>
      </p>
      <p>
        Picture address: <output data-lab-output="picture">{broken ? 'broken' : 'working'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Content, variant and size"
      description="A picture, initials and a group glyph in each variant and size. The fill size takes a 48px box."
    >
      <StateMatrix
        axes={{ content: ['picture', 'initials', 'group'], variant: variants, size: sizes }}
        render={({ content, variant, size }) => (
          <Box size={size}>
            <Avatar
              name={content === 'group' ? 'Design team' : 'Maria Santos'}
              kind={content === 'group' ? 'group' : 'person'}
              src={content === 'picture' ? samplePicture : undefined}
              variant={variant}
              size={size}
            />
          </Box>
        )}
      />
    </LabSection>
    <LabSection
      title="Colour slots"
      description="Each of the eight slots the reference sheet defines, set with an explicit colour index."
    >
      <StateMatrix
        axes={{ variant: variants, slot: slots }}
        render={({ variant, slot }) => (
          <Avatar name="Lena Ortiz" colorIndex={Number(slot)} variant={variant} />
        )}
      />
    </LabSection>
    <LabSection
      title="Initials and naming"
      description="Initials derived from names, explicit initials, a blank name, and a decorative avatar."
    >
      <StateMatrix
        axes={{
          name: ['Maria Santos', 'jon de berg', 'Plato', 'Émilie Durand', '👋🏽 Team', '(blank)'],
          source: ['derived', 'explicit initials', 'decorative'],
        }}
        render={({ name, source }) => (
          <Avatar
            name={name === '(blank)' ? '' : name}
            initials={source === 'explicit initials' ? 'AI' : undefined}
            decorative={source === 'decorative'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Picture fallback"
      description="Break the picture: the initials replace it. Restore it: the new address is tried again."
    >
      <PictureFallback />
    </LabSection>
  </>,
);
