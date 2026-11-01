import { Badge } from '../../src/components/badge/badge.js';
import { Combobox } from '../../src/components/combobox/combobox.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { Tag, TagGroup } from '../../src/components/tag-group/tag-group.js';
import { TagsInput } from '../../src/components/tags-input/tags-input.js';
import type { ControlSize } from '../../src/core/props.js';
import { LabSection, StateMatrix } from './chrome/index.js';

/** Words with descenders, capitals and accents, which a chip must show whole. */
const words = [
  { id: 'gypsy', label: 'Gypsy' },
  { id: 'jq', label: 'Jüpiter qg' },
  { id: 'egal', label: 'Égal Ångström' },
];
const ids = words.map((word) => word.id);
const chips = ['badge', 'tag-group', 'tags-input', 'combobox', 'select-field'] as const;
const sizes = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly ControlSize[];

/** Badge and TagGroup come in sm, md and lg; xs controls carry sm chips. */
function chipSize(size: ControlSize) {
  return size === 'xs' ? 'sm' : (size as 'sm' | 'md' | 'lg');
}

function ChipSample({ chip, size }: { chip: (typeof chips)[number]; size: ControlSize }) {
  const name = `Words ${chip} ${size}`;
  switch (chip) {
    case 'badge':
      return (
        <span style={{ display: 'flex', gap: 4 }}>
          {words.map((word) => (
            <Badge key={word.id} size={chipSize(size)}>
              {word.label}
            </Badge>
          ))}
        </span>
      );
    case 'tag-group':
      return (
        <TagGroup aria-label={name} size={chipSize(size)} items={words}>
          {(word) => <Tag id={word.id}>{word.label}</Tag>}
        </TagGroup>
      );
    case 'tags-input':
      return (
        <TagsInput
          label={name}
          labelLayout="control-only"
          size={size}
          defaultValue={words.map((word) => word.label)}
        />
      );
    case 'combobox':
      return (
        <Combobox
          aria-label={name}
          size={size}
          selectionMode="multiple"
          defaultItems={words}
          defaultValue={ids}
        />
      );
    case 'select-field':
      return (
        <SelectField
          label={name}
          labelLayout="control-only"
          size={size}
          selectionMode="multiple"
          options={words}
          defaultValue={ids}
        />
      );
  }
}

/** Every chip-like control at every size, with text that reaches below the baseline. */
export function ChipDescenders() {
  return (
    <LabSection
      title="Chips keep whole letters"
      description="Badges, tags and the chips of TagsInput, Combobox and SelectField show descenders (g j p q y), capitals and accents whole at every size, inside chips of the same height as before; long text still ends in an ellipsis."
    >
      <StateMatrix
        axes={{ chip: chips, size: sizes }}
        render={({ chip, size }) => (
          <div style={{ width: 320 }}>
            <ChipSample chip={chip} size={size} />
          </div>
        )}
      />
    </LabSection>
  );
}
