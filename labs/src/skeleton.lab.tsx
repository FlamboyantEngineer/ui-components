import { useState, type CSSProperties } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { Button } from '../../src/components/button/button.js';
import { Skeleton, SkeletonText } from '../../src/components/skeleton/skeleton.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width });
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };

function Profile({ isLoading }: { isLoading: boolean }) {
  return (
    <div style={row}>
      <Skeleton shape="circle" isLoading={isLoading}>
        <Avatar name="Maria Santos" size="lg" />
      </Skeleton>
      <div>
        <Skeleton shape="text" isLoading={isLoading}>
          <strong>Maria Santos</strong>
        </Skeleton>
        <Skeleton shape="text" isLoading={isLoading}>
          <span>Gardener in Porto</span>
        </Skeleton>
      </div>
    </div>
  );
}

function LoadingProfile() {
  const [isLoading, setLoading] = useState(true);
  return (
    <div style={column(320)} data-lab-demo="profile">
      <p>
        <Button size="sm" onPress={() => setLoading(!isLoading)}>
          {isLoading ? 'Finish loading' : 'Load again'}
        </Button>
      </p>
      <Profile isLoading={isLoading} />
      <Skeleton isLoading={isLoading}>
        <p>
          <label>
            Note <input defaultValue="Waters the roses on Mondays" />
          </label>
        </p>
      </Skeleton>
      <p>
        State: <output data-lab-output="state">{isLoading ? 'loading' : 'loaded'}</output>
      </p>
    </div>
  );
}

function Article() {
  return (
    <section aria-label="Recipe" aria-busy="true" style={column(320)} data-lab-demo="article">
      <Skeleton />
      <Skeleton shape="text" />
      <SkeletonText lines={4} />
    </section>
  );
}

mountLab(
  <>
    <LabSection
      title="Shapes"
      description="A text line, a rectangle and a circle, animated or still, each in a 200px column."
    >
      <StateMatrix
        axes={{ shape: ['text', 'rectangle', 'circle'], animation: ['animated', 'still'] }}
        render={({ shape, animation }) => (
          <div style={column(200)}>
            <Skeleton shape={shape} animated={animation === 'animated'} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Text lines"
      description="Paragraph placeholders of one, three and five lines, animated or still; the last of several lines is shorter."
    >
      <StateMatrix
        axes={{ animation: ['animated', 'still'], lines: ['1', '3', '5'] }}
        render={({ animation, lines }) => (
          <div style={column(200)}>
            <SkeletonText lines={Number(lines)} animated={animation === 'animated'} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Wrapped content"
      description="Real content keeps its layout under the placeholder while loading and shows once loaded, in each shape."
    >
      <StateMatrix
        axes={{ shape: ['text', 'rectangle', 'circle'], state: ['loading', 'loaded'] }}
        render={({ shape, state }) => (
          <Skeleton shape={shape} isLoading={state === 'loading'}>
            {shape === 'circle' ? <Avatar name="Jon Berg" /> : <span>Fresh basil, 2 bunches</span>}
          </Skeleton>
        )}
      />
    </LabSection>
    <LabSection
      title="Loading a profile"
      description="Placeholders around a profile and a field, revealed without losing the field's text; the field takes no focus while loading."
    >
      <LoadingProfile />
    </LabSection>
    <LabSection
      title="Placeholder article"
      description="Blocks and text lines inside a region that states its own busy status."
    >
      <Article />
    </LabSection>
  </>,
);
