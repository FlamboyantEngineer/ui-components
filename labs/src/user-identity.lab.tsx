import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { brokenPicture, samplePicture } from './people-samples.js';
import { badges } from './avatar-badge-cases.js';
import {
  badgePlacements,
  identityOptionProps,
  identityOptions,
  identityShapes,
} from './identity-options.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;

function PictureFallback() {
  const [broken, setBroken] = useState(false);
  return (
    <div>
      <UserIdentity
        name="Jon Berg"
        description="jon@example.com"
        src={broken ? brokenPicture : samplePicture}
        data-lab-identity="fallback"
      />
      <p>
        <Button size="sm" onPress={() => setBroken((value) => !value)}>
          {broken ? 'Restore the picture' : 'Break the picture'}
        </Button>
      </p>
    </div>
  );
}

/**
 * A name the reader edits: the identity with a stable colour key keeps its colour slot, the one
 * coloured by its name changes with it. Breaking the picture keeps the chosen shape, initials
 * and colour slot on the fallback.
 */
function StableIdentity() {
  const [name, setName] = useState('Maria Santos');
  const [broken, setBroken] = useState(false);
  return (
    <div data-lab-demo="stable-identity">
      <label>
        Display name <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <UserIdentity name={name} colorKey="person-42" description="Keyed colour" />
      <UserIdentity name={name} description="Colour from the name" />
      <UserIdentity
        name={name}
        description="Picture with options"
        src={broken ? brokenPicture : samplePicture}
        shape="square"
        initials="MF"
        colorIndex={4}
        colorCount={6}
        data-lab-identity="options-fallback"
      />
      <p>
        <Button size="sm" onPress={() => setBroken((value) => !value)}>
          {broken ? 'Restore the optioned picture' : 'Break the optioned picture'}
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Kinds, content and sizes"
      description="People with initials or a picture and a group, with and without a secondary line or a suffix."
    >
      <StateMatrix
        axes={{
          kind: ['initials', 'picture', 'group'],
          content: ['name only', 'secondary line', 'suffix'],
          size: sizes,
        }}
        render={({ kind, content, size }) => (
          <UserIdentity
            name={kind === 'group' ? 'Design team' : 'Maria Santos'}
            kind={kind === 'group' ? 'group' : 'person'}
            src={kind === 'picture' ? samplePicture : undefined}
            size={size}
            description={
              content === 'secondary line'
                ? kind === 'group'
                  ? '12 members'
                  : 'maria@example.com'
                : undefined
            }
            nameSuffix={content === 'suffix' ? <em>(new)</em> : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Truncation"
      description="In a 160px column the name and the secondary line ellipsize independently; the full text stays in the DOM."
    >
      <StateMatrix
        axes={{ text: ['short', 'long'], size: ['sm', 'md'] }}
        render={({ text, size }) => (
          <div data-lab-column="160" style={{ width: 160 }}>
            <UserIdentity
              size={size}
              name={text === 'long' ? 'Maria Fernanda Santos de Oliveira' : 'Maria Santos'}
              description={
                text === 'long' ? 'maria.fernanda.santos@example.com' : 'maria@example.com'
              }
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Presence"
      description="A status badge on the avatar's corner, named by the status label and read after the name."
    >
      <StateMatrix
        axes={{ status: ['active', 'away', 'busy', 'idle'], size: sizes }}
        render={({ status, size }) => (
          <UserIdentity
            name="Lena Ortiz"
            description="Research"
            status={status}
            statusLabel={status.charAt(0).toUpperCase() + status.slice(1)}
            size={size}
          />
        )}
      />
    </LabSection>
    <LabSection title="Picture fallback" description="Break the picture: the initials replace it.">
      <PictureFallback />
    </LabSection>
    <LabSection
      title="Avatar options"
      description="Each shape against initials given by the caller (MF), a stable colour key, an explicit colour slot in a six-colour palette, and a picture with a sharper candidate for dense screens, loaded lazily."
    >
      <StateMatrix
        axes={{ option: identityOptions, shape: identityShapes }}
        render={({ option, shape }) => (
          <UserIdentity
            name="Maria Santos"
            description={option}
            shape={shape}
            {...identityOptionProps(option)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Stable colour and fallback"
      description="Edit the name: the keyed identity keeps its colour while the other follows the name. Break the picture: the fallback keeps the square shape, the MF initials and colour slot 4."
    >
      <StableIdentity />
    </LabSection>
    <LabSection
      title="Corner badges"
      description="A flag in each logical corner, labelled (its words follow the name) or decorative (no badgeLabel), with and without a busy status: a badge asked into the status corner moves aside to top-end."
    >
      <StateMatrix
        axes={{
          badge: ['labelled', 'decorative'],
          status: ['none', 'busy'],
          placement: badgePlacements,
        }}
        render={({ badge, status, placement }) => (
          <UserIdentity
            name="Maria Santos"
            description="Lisbon office"
            status={status === 'none' ? undefined : status}
            badge={badges.flag.badge}
            badgeLabel={badge === 'labelled' ? badges.flag.badgeLabel : undefined}
            badgePlacement={placement}
          />
        )}
      />
    </LabSection>
  </>,
);
