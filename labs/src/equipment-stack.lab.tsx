import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import {
  EquipmentStack,
  type EquipmentStackFace,
} from '../../src/components/equipment-stack/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

/** One unit is a tenth of the stack's width. */
const ratio = 10;

const bench: EquipmentStackFace[] = [
  {
    id: 'switch',
    label: 'Network switch',
    units: 1,
    readout: '24 ports',
    status: <Badge tone="success">Online</Badge>,
  },
  { id: 'meter', label: 'Bench meter', units: 2, readout: '12.004 V', status: 'Idle' },
  { id: 'blank', label: 'Position 4', units: 1, isMissing: true },
  {
    id: 'supply',
    label: 'Power supply',
    units: 1.5,
    readout: '3.20 A',
    status: <Badge tone="warning">Warm</Badge>,
  },
  { id: 'shelf', label: 'Cable shelf with a label longer than its face', units: 0.5 },
];

/** A stack taller than its scrolling box: twenty faces of one to three units. */
const tall: EquipmentStackFace[] = Array.from({ length: 20 }, (_, index) => ({
  id: `face-${index + 1}`,
  label: `Face ${index + 1}`,
  units: (index % 3) + 1,
  readout: `${(index + 1) * 10} Hz`,
}));

function Scaled({ width }: { width: number }) {
  return (
    <div style={{ width }}>
      <EquipmentStack
        aria-label={`Bench at ${width}px`}
        faces={bench}
        unitRatio={ratio}
        missingPlaceholder="Empty"
      />
    </div>
  );
}

function Scrolling() {
  return (
    <div
      role="region"
      aria-label="Tall stack"
      tabIndex={0}
      data-lab-scroller=""
      style={{ width: 'min(420px, 100%)', height: 260, overflow: 'auto' }}
    >
      <EquipmentStack aria-label="Twenty faces" faces={tall} unitRatio={ratio} />
    </div>
  );
}

const spare: EquipmentStackFace = {
  id: 'spare',
  label: 'Spare analyser',
  units: 2,
  readout: '−42 dBm',
};

function Changing() {
  const [faces, setFaces] = useState(bench);
  const [reading, setReading] = useState(12.004);
  const shown = faces.map((face) =>
    face.id === 'meter' ? { ...face, readout: `${reading.toFixed(3)} V` } : face,
  );
  return (
    <div data-lab-changing="" style={{ width: 360 }}>
      <div style={{ display: 'flex', gap: 8, marginBlockEnd: 8, flexWrap: 'wrap' }}>
        <Button onPress={() => setFaces((current) => [...current].reverse())}>Reverse</Button>
        <Button
          onPress={() =>
            setFaces((current) =>
              current.some((face) => face.id === spare.id)
                ? current.filter((face) => face.id !== spare.id)
                : [...current.slice(0, 2), spare, ...current.slice(2)],
            )
          }
        >
          Toggle spare
        </Button>
        <Button onPress={() => setReading((value) => value + 0.125)}>New reading</Button>
      </div>
      <EquipmentStack
        aria-label="Changing bench"
        faces={shown}
        unitRatio={ratio}
        missingPlaceholder="Empty"
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Faces to scale"
      description="The same faces at two widths. One unit is a tenth of the width: faces of 0.5, 1, 1.5 and 2 units keep their proportions, and long labels are cut rather than stretching a face."
    >
      <StateMatrix
        axes={{ width: ['240', '420'] }}
        render={({ width }) => <Scaled width={Number(width)} />}
      />
    </LabSection>
    <LabSection
      title="Missing units"
      description="A missing position keeps its height and shows the placeholder in place of its readout and status, or only its label when the stack has no placeholder."
    >
      <StateMatrix
        axes={{ placeholder: ['with', 'without'] }}
        render={({ placeholder }) => (
          <div style={{ width: 320 }}>
            <EquipmentStack
              aria-label={`Placeholder ${placeholder}`}
              faces={[
                { id: 'top', label: 'Top unit', units: 1, readout: '1.000 kΩ' },
                { id: 'gap', label: 'Position 2', units: 2, isMissing: true, readout: 'Unused' },
                { id: 'base', label: 'Base unit', units: 1, status: 'Standby' },
              ]}
              unitRatio={8}
              missingPlaceholder={placeholder === 'with' ? 'Not fitted' : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Scrolling"
      description="Twenty faces in a 260px scrolling box. Faces never shrink to fit the box and keep their order and heights as they scroll."
    >
      <Scrolling />
    </LabSection>
    <LabSection
      title="Changing faces"
      description="Faces keyed by id: reverse them, add or remove a spare face, or update one readout. Each face keeps its element and proportions."
    >
      <Changing />
    </LabSection>
    <LabSection
      title="Empty stack"
      description="A stack with no faces renders an empty, labelled list."
    >
      <div style={{ width: 240 }}>
        <EquipmentStack aria-label="Nothing mounted" faces={[]} unitRatio={ratio} />
      </div>
    </LabSection>
  </>,
);
