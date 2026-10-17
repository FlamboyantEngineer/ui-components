import { useRef, useState } from 'react';
import { Banner, type BannerTone } from '../../src/components/banner/banner.js';
import { Button } from '../../src/components/button/button.js';
import { useEnterExit } from '../../src/utils/use-enter-exit.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const tones: BannerTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const messages: Record<BannerTone, string> = {
  neutral: 'Viewing a copy from Tuesday.',
  info: 'A new version is available.',
  success: 'All changes saved.',
  warning: 'The template changed since this file was created.',
  danger: 'Could not save. Check your connection.',
};

function EnterExitDemo() {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(ref, isOpen);
  return (
    <div data-lab-demo="enter-exit">
      <Button size="sm" onPress={() => setOpen((open) => !open)}>
        {isOpen ? 'Hide notice' : 'Show notice'}
      </Button>
      {isMounted ? (
        <Banner
          ref={ref}
          tone="success"
          description="Report.pdf uploaded."
          isEntering={isEntering}
          isExiting={isExiting}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function LiveDemo() {
  const [tone, setTone] = useState<BannerTone>('info');
  const [dismissed, setDismissed] = useState(0);
  const [visible, setVisible] = useState(true);
  return (
    <div>
      <p>
        {tones.map((next) => (
          <Button
            key={next}
            size="sm"
            isSelected={next === tone}
            data-lab-tone={next}
            onPress={() => setTone(next)}
          >
            {next}
          </Button>
        ))}{' '}
        <Button
          size="sm"
          variant="tertiary"
          data-lab-action="restore"
          onPress={() => setVisible(true)}
        >
          Show again
        </Button>
      </p>
      <Banner
        data-lab-banner="live"
        tone={tone}
        title={tone === 'danger' ? 'Save failed' : undefined}
        description={messages[tone]}
        hidden={!visible}
        actions={
          tone === 'danger' ? (
            <Button size="sm" onPress={() => setTone('success')}>
              Try again
            </Button>
          ) : null
        }
        dismissLabel="Dismiss the save message"
        onDismiss={() => {
          setDismissed((count) => count + 1);
          setVisible(false);
        }}
      />
      <p>
        Dismissed: <output data-lab-output="dismissed">{dismissed}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Tones and content"
      description="Danger banners are assertive alerts; every other tone is a polite status."
    >
      <StateMatrix
        axes={{
          tone: tones,
          content: ['description', 'title and description', 'actions and dismiss'],
        }}
        render={({ tone, content }) => (
          <div style={{ width: 320 }}>
            <Banner
              tone={tone}
              title={content === 'description' ? undefined : 'Heads up'}
              description={messages[tone]}
              actions={
                content === 'actions and dismiss' ? (
                  <Button size="sm" variant="tertiary">
                    Details
                  </Button>
                ) : null
              }
              onDismiss={content === 'actions and dismiss' ? () => {} : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="States and presentation"
      description="Pending replaces the glyph with a spinner; exiting fades before removal; inline banners sit inside text."
    >
      <StateMatrix
        axes={{
          state: ['default', 'pending', 'exiting', 'no icon', 'custom icon'],
          presentation: ['block', 'inline'],
        }}
        render={({ state, presentation }) => {
          const banner = (
            <Banner
              tone="info"
              inline={presentation === 'inline'}
              description="Syncing changes"
              isPending={state === 'pending'}
              isExiting={state === 'exiting'}
              {...(state === 'no icon' ? { icon: null } : {})}
              {...(state === 'custom icon' ? { icon: 'restore' as const } : {})}
            />
          );
          return presentation === 'inline' ? <p>Status: {banner} for Report.pdf</p> : banner;
        }}
      />
    </LabSection>
    <LabSection
      title="Enter and exit"
      description="useEnterExit keeps the banner mounted while its exit transition plays and publishes entering while its enter animation plays; the caller only says whether it is open."
    >
      <EnterExitDemo />
    </LabSection>
    <LabSection
      title="Live updates"
      description="Switch tones on one mounted banner: its role and urgency follow the tone. Dismiss hides it until shown again."
    >
      <LiveDemo />
    </LabSection>
  </>,
);
