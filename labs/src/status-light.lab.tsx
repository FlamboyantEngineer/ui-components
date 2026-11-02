import { useState } from 'react';
import { Banner } from '../../src/components/banner/banner.js';
import { Button } from '../../src/components/button/button.js';
import { InlineError } from '../../src/components/inline-error/inline-error.js';
import { StatusLight } from '../../src/components/status-light/status-light.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const toneLabels = {
  neutral: 'Unknown',
  info: 'Scheduled',
  success: 'Running',
  warning: 'Degraded',
  danger: 'Stopped',
} as const;

const services = [
  { name: 'Recipe search', tone: 'success', label: 'Running' },
  { name: 'Image upload', tone: 'warning', label: 'Slow responses' },
  { name: 'Weekly digest', tone: 'info', label: 'Sending', isPending: true },
  { name: 'Old archive', tone: 'danger', label: 'Stopped' },
] as const;

function Deployment() {
  const [isDeploying, setDeploying] = useState(false);
  return (
    <div data-lab-demo="deployment">
      <p>
        <Button size="sm" onPress={() => setDeploying(!isDeploying)}>
          {isDeploying ? 'Finish deployment' : 'Start deployment'}
        </Button>
      </p>
      <StatusLight tone={isDeploying ? 'info' : 'success'} isPending={isDeploying}>
        {isDeploying ? 'Deploying' : 'Live'}
      </StatusLight>
      {/* One pending flag drives every feedback primitive the same way. */}
      <Banner
        tone="info"
        isPending={isDeploying}
        title={isDeploying ? 'Deployment running' : 'Deployment finished'}
      />
      <InlineError tone="success" isPending={isDeploying}>
        {isDeploying ? 'Checking the release' : 'The release passed its checks'}
      </InlineError>
    </div>
  );
}

mountLab(
  <>
    <LabSection title="Tones and sizes" description="Every tone at each size, with its label.">
      <StateMatrix
        axes={{
          tone: ['neutral', 'info', 'success', 'warning', 'danger'],
          size: ['sm', 'md', 'lg'],
        }}
        render={({ tone, size }) => (
          <StatusLight tone={tone} size={size}>
            {toneLabels[tone]}
          </StatusLight>
        )}
      />
    </LabSection>
    <LabSection
      title="Presence"
      description="Each presence state with its default label, a custom label, and only the dot named by aria-label."
    >
      <StateMatrix
        axes={{
          status: ['active', 'away', 'busy', 'idle'],
          label: ['default', 'custom', 'dot only'],
        }}
        render={({ status, label }) =>
          label === 'dot only' ? (
            <StatusLight status={status} aria-label={`Jon Berg is ${status}`} />
          ) : (
            <StatusLight status={status}>
              {label === 'custom' ? `Jon Berg, ${status}` : null}
            </StatusLight>
          )
        }
      />
    </LabSection>
    <LabSection
      title="Pending"
      description="A status still in progress pulses its dot; the label says so."
    >
      <StateMatrix
        axes={{ pending: ['still', 'pending'] }}
        render={({ pending }) => (
          <StatusLight tone="info" isPending={pending === 'pending'}>
            {pending === 'pending' ? 'Deploying' : 'Scheduled'}
          </StatusLight>
        )}
      />
      <Deployment />
    </LabSection>
    <LabSection
      title="Services"
      description="Status lights in a list of services, beside their names."
    >
      <ul data-lab-demo="services">
        {services.map((service) => (
          <li key={service.name}>
            {service.name}:{' '}
            <StatusLight
              tone={service.tone}
              size="sm"
              isPending={'isPending' in service ? service.isPending : false}
            >
              {service.label}
            </StatusLight>
          </li>
        ))}
      </ul>
    </LabSection>
  </>,
);
