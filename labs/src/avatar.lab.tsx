import { AvatarPresenceCases } from './avatar-presence-cases.js';
import { useState, type ReactNode } from 'react';
import {
  Avatar,
  type AvatarLoadingStatus,
  type AvatarSize,
} from '../../src/components/avatar/avatar.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { brokenPicture, otherPicture, samplePicture } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg', 'fill'] as const;
const variants = ['filled', 'outlined'] as const;
const slots = ['0', '1', '2', '3', '4', '5', '6', '7'] as const;
const shapes = ['circle', 'rounded', 'square'] as const;
const pictures = { none: undefined, working: samplePicture, broken: brokenPicture } as const;

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

/** A picture whose responsive candidate fails, then is replaced by a working one. */
function ResponsiveCandidate() {
  const [candidate, setCandidate] = useState<'broken' | 'working'>('broken');
  return (
    <div>
      <Avatar
        name="Priya Nair"
        size="lg"
        src={brokenPicture}
        imageProps={{ srcSet: `${candidate === 'broken' ? brokenPicture : samplePicture} 1x` }}
        data-lab-avatar="candidate"
      />
      <p>
        <Button
          size="sm"
          onPress={() => setCandidate('working')}
          isDisabled={candidate === 'working'}
        >
          Offer a working candidate
        </Button>
      </p>
    </div>
  );
}

function LoadingStatus() {
  const [picture, setPicture] = useState<keyof typeof pictures>('none');
  const [log, setLog] = useState<AvatarLoadingStatus[]>([]);
  return (
    <div>
      <Avatar
        name="Lena Ortiz"
        size="lg"
        src={pictures[picture]}
        data-lab-avatar="status"
        onLoadingStatusChange={(status) => setLog((entries) => [...entries, status])}
      />
      <p>
        {(['working', 'broken', 'none'] as const).map((choice) => (
          <Button
            key={choice}
            size="sm"
            isDisabled={picture === choice}
            onPress={() => setPicture(choice)}
          >
            {choice === 'none' ? 'Remove the picture' : `Load a ${choice} picture`}
          </Button>
        ))}
      </p>
      <p>
        Statuses: <output data-lab-output="status">{log.join(', ')}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <div data-lab-family="avatar-main">
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
        title="Shapes"
        description="Circles for people; rounded and square corners for bots, organisations and groups."
      >
        <StateMatrix
          axes={{ shape: shapes, content: ['picture', 'initials', 'group'], variant: variants }}
          render={({ shape, content, variant }) => (
            <Avatar
              name={content === 'group' ? 'Design team' : 'Build bot'}
              kind={content === 'group' ? 'group' : 'person'}
              src={content === 'picture' ? samplePicture : undefined}
              shape={shape}
              variant={variant}
              size="lg"
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Picture attributes"
        description="A picture with a 2x source, lazy loading, no referrer and an anonymous cross-origin request."
      >
        <Avatar
          name="Jon Berg"
          size="lg"
          src={samplePicture}
          imageProps={{
            srcSet: `${samplePicture} 1x, ${otherPicture} 2x`,
            sizes: '40px',
            loading: 'lazy',
            referrerPolicy: 'no-referrer',
            crossOrigin: 'anonymous',
          }}
          data-lab-avatar="attributes"
        />
      </LabSection>
      <LabSection
        title="Loading status"
        description="Each status the avatar reports, in order: idle without a picture, loading, then loaded or error."
      >
        <LoadingStatus />
      </LabSection>
      <LabSection
        title="Picture fallback"
        description="Break the picture: the initials replace it. Restore it: the new address is tried again."
      >
        <PictureFallback />
      </LabSection>
      <LabSection
        title="Responsive candidate"
        description="The only srcset candidate fails, so the initials show. Offering a working candidate, with the same src, tries the picture again."
      >
        <ResponsiveCandidate />
      </LabSection>
    </div>
    <AvatarPresenceCases />
  </>,
);
