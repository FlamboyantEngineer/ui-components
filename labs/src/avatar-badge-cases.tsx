import { useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { StarGlyph } from '../../src/core/glyphs.js';
import { Glyph } from '../../src/core/provider.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const placements = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

/** A lab-only flag the host would supply: three vertical bands. */
const flag = (
  <svg viewBox="0 0 3 2" preserveAspectRatio="none">
    <rect width="1" height="2" fill="#0055a4" />
    <rect x="1" width="1" height="2" fill="#ffffff" />
    <rect x="2" width="1" height="2" fill="#ef4135" />
  </svg>
);

export const badges = {
  flag: { badge: flag, badgeLabel: 'France' },
  glyph: { badge: <Glyph icon={StarGlyph} />, badgeLabel: 'Team lead' },
  text: { badge: '2', badgeLabel: 'Second shift' },
} as const;

/** An avatar with a flag that opens a person card, counting its presses. */
function BadgeTrigger() {
  const [presses, setPresses] = useState(0);
  return (
    <div>
      <Avatar
        name="Lena Ortiz"
        status="active"
        {...badges.flag}
        size="lg"
        data-lab-avatar="badge-trigger"
        card={<UserCard name="Lena Ortiz" description="Field team" {...badges.flag} />}
        onPress={() => setPresses((count) => count + 1)}
      />
      <p>
        Presses: <output data-lab-output="badge-presses">{presses}</output>
      </p>
    </div>
  );
}

/** Corner badges on avatars, beside a status, on a card trigger and in identity rows. */
export function AvatarBadgeCases() {
  return (
    <div data-lab-family="avatar-badge">
      <LabSection
        title="Corner badge: corners and sizes"
        description="A host-supplied flag on each corner at every size, outside the clipped picture. The avatar's name ends with the badge's words (Maria Santos, France)."
      >
        <StateMatrix
          axes={{ placement: placements, size: sizes }}
          render={({ placement, size }) => (
            <Avatar name="Maria Santos" size={size} badgePlacement={placement} {...badges.flag} />
          )}
        />
      </LabSection>
      <LabSection
        title="Corner badge: content, shape and variant"
        description="A flag, a glyph and text as badges on a picture, initials and a group glyph, in each shape and variant. The badge keeps a circle whatever the avatar's corners."
      >
        <StateMatrix
          axes={{
            badge: Object.keys(badges) as Array<keyof typeof badges>,
            content: ['picture', 'initials', 'group'],
            shape: ['circle', 'rounded', 'square'],
            variant: ['filled', 'outlined'],
          }}
          render={({ badge, content, shape, variant }) => (
            <Avatar
              name={content === 'group' ? 'Design team' : 'Jon Berg'}
              kind={content === 'group' ? 'group' : 'person'}
              src={content === 'picture' ? samplePicture : undefined}
              shape={shape}
              variant={variant}
              size="lg"
              {...badges[badge]}
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Corner badge beside a status"
        description="The status indicator keeps the bottom end: a badge asked for there moves to the top end, and any other corner stays."
      >
        <StateMatrix
          axes={{ status: ['active', 'away', 'busy', 'idle'], placement: placements }}
          render={({ status, placement }) => (
            <Avatar
              name="Maria Santos"
              status={status}
              badgePlacement={placement}
              size="lg"
              {...badges.flag}
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Corner badge on a card trigger"
        description="Press the avatar, or Tab to it and press Enter: the person card opens. The badge adds no stop in the tab order and does not move with the press, and the card's identity row shows the same flag."
      >
        <BadgeTrigger />
      </LabSection>
      <LabSection
        title="Corner badge in identity rows"
        description="An identity row's avatar is decorative, so the badge's words follow the name, the secondary line and the status."
      >
        <StateMatrix
          axes={{ status: ['none', 'busy'], size: sizes }}
          render={({ status, size }) => (
            <UserIdentity
              name="Maria Santos"
              description="Lisbon office"
              size={size}
              status={status === 'none' ? undefined : status}
              {...badges.flag}
            />
          )}
        />
      </LabSection>
    </div>
  );
}
