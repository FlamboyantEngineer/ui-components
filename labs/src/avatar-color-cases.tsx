import { useState } from 'react';
import { Avatar, resolveAvatarColor } from '../../src/components/avatar/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

const counts = ['4', '8', '12'] as const;
const indexes = ['none', '2', '11', '-1'] as const;

/** A renamable person with a stable key, coloured three ways under a chosen palette size. */
function StableColours() {
  const [name, setName] = useState('Lena Ortiz');
  const [count, setCount] = useState<(typeof counts)[number]>('8');
  const [index, setIndex] = useState<(typeof indexes)[number]>('none');
  const colorCount = Number(count);
  const colorIndex = index === 'none' ? undefined : Number(index);
  const rows = [
    { id: 'name', label: 'From the name', identity: { name } },
    { id: 'key', label: 'From colorKey "person-42"', identity: { name, colorKey: 'person-42' } },
    {
      id: 'index',
      label: 'colorIndex over colorKey',
      identity: { name, colorKey: 'person-42', colorIndex },
    },
  ];
  return (
    <div data-lab-demo="avatar-colours">
      <div role="group" aria-label="Avatar colour inputs">
        <TextField label="Display name" value={name} onChange={setName} />
        <SegmentedChoice
          aria-label="Palette size"
          sizing="content"
          options={counts.map((value) => ({ value, label: value }))}
          value={count}
          onChange={(value) => setCount((value as (typeof counts)[number] | null) ?? '8')}
        />
        <SegmentedChoice
          aria-label="Colour index"
          sizing="content"
          options={indexes.map((value) => ({ value, label: value }))}
          value={index}
          onChange={(value) => setIndex((value as (typeof indexes)[number] | null) ?? 'none')}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Colour</th>
            <th scope="col">Avatar</th>
            <th scope="col">resolveAvatarColor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-lab-colour={row.id}>
              <td>{row.label}</td>
              <td>
                <Avatar {...row.identity} colorCount={colorCount} />
              </td>
              <td data-lab-output="slot">{String(resolveAvatarColor(row.identity, colorCount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AvatarColorCases() {
  return (
    <LabSection
      title="Stable colours and palette size"
      description="Rename the person: the name-derived colour changes, the colour from the stable colorKey does not. colorCount spreads derived colours over 4, 8 or 12 slots; an explicit colorIndex wins over the key and wraps into the palette (11 and -1). resolveAvatarColor gives a host the same slot the avatar publishes in data-color."
    >
      <StableColours />
    </LabSection>
  );
}
