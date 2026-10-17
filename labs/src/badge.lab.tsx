import { useState } from 'react';
import { Badge, type BadgeTone } from '../../src/components/badge/badge.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const tones: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const sizes = ['sm', 'md', 'lg'] as const;
const labels: Record<BadgeTone, string> = {
  neutral: 'Draft',
  info: 'In review',
  success: 'Approved',
  warning: 'Due soon',
  danger: 'Overdue',
};

function OverlayDemo() {
  const [unread, setUnread] = useState(12);
  return (
    <div>
      <span
        data-lab-overlay-host="messages"
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <IconButton
          icon="info"
          label={`Messages, ${unread} unread`}
          variant="secondary"
          onPress={() => setUnread((value) => value + 1)}
        />
        <Badge count={unread} max={9} tone="danger" size="sm" placement="overlay" aria-hidden />
      </span>{' '}
      <span
        data-lab-overlay-host="mentions"
        style={{ position: 'relative', display: 'inline-flex' }}
      >
        <IconButton icon="more" label="Mentions, 3 new" variant="secondary" />
        <Badge count={3} tone="info" size="sm" placement="overlay" aria-hidden />
      </span>
      <p>
        Press the first button to add a message. Unread: <output>{unread}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, tones and sizes"
      description="Subtle pills, solid tokens and status dots in every tone and size."
    >
      <StateMatrix
        axes={{ variant: ['subtle', 'solid', 'status'], tone: tones, size: sizes }}
        render={({ variant, tone, size }) => (
          <Badge variant={variant} tone={tone} size={size}>
            {labels[tone]}
          </Badge>
        )}
      />
    </LabSection>
    <LabSection
      title="Counts"
      description="Exact, capped, partial and labelled counts. Capped counts keep the full value for assistive technology."
    >
      <StateMatrix
        axes={{ count: ['exact', 'capped', 'more', 'zero', 'labelled'], size: sizes }}
        render={({ count, size }) =>
          count === 'exact' ? (
            <Badge count={7} size={size} />
          ) : count === 'capped' ? (
            <Badge count={12} max={9} size={size} tone="danger" />
          ) : count === 'more' ? (
            <Badge count={20} more size={size} tone="info" />
          ) : count === 'zero' ? (
            <Badge count={0} size={size} />
          ) : (
            <Badge count={120} size={size} aria-label="120 matching files" />
          )
        }
      />
      <StateMatrix
        axes={{ tone: tones, size: sizes }}
        render={({ tone, size }) => <Badge count={128} max={99} tone={tone} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Options"
      description="Bare badges drop the pill; quiet statuses keep their text without a live region; a muted dot softens only the dot."
    >
      <StateMatrix
        axes={{ option: ['default', 'bare', 'quiet status', 'muted dot'], tone: tones }}
        render={({ option, tone }) => (
          <Badge
            variant={option === 'default' || option === 'bare' ? 'subtle' : 'status'}
            tone={tone}
            bare={option === 'bare'}
            announce={option === 'quiet status' || option === 'muted dot' ? false : undefined}
            mutedDot={option === 'muted dot'}
          >
            {labels[tone]}
          </Badge>
        )}
      />
    </LabSection>
    <LabSection
      title="Overlay counts"
      description="Counts pinned to the upper trailing corner of a positioned host, without resizing it."
    >
      <OverlayDemo />
    </LabSection>
  </>,
);
