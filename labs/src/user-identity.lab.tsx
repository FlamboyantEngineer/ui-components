import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { brokenPicture, samplePicture } from './people-samples.js';

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
  </>,
);
