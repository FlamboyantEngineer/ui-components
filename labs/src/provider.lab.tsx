import { Glyph, UiProvider, useUiStrings } from '../../src/core/provider.js';
import { glyphNames, type GlyphComponentProps } from '../../src/core/glyphs.js';
import { defaultStrings, type UiStrings } from '../../src/core/strings.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const replacedGlyphs = Object.fromEntries(glyphNames.map((name) => [name, SquareGlyph]));

const replacedStrings: Partial<UiStrings> = {
  close: 'Fermer',
  more: 'Plus',
  loading: 'Chargement',
  itemCount: (count) => `${count} éléments`,
};

const stringNames = Object.keys(defaultStrings) as Array<keyof UiStrings>;

function SquareGlyph(props: GlyphComponentProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function sampleString(strings: UiStrings, name: keyof UiStrings): string {
  if (name === 'shortcutKeyName') return strings.shortcutKeyName('↑');
  const value = strings[name];
  return typeof value === 'function' ? value(3) : value;
}

function StringValue({ name }: { name: keyof UiStrings }) {
  return <code>{sampleString(useUiStrings(), name)}</code>;
}

mountLab(
  <>
    <LabSection
      title="Glyphs"
      description="Every built-in glyph. The replaced column swaps all of them through the provider's icons prop."
    >
      <StateMatrix
        axes={{ glyph: glyphNames, source: ['default', 'replaced'] }}
        render={({ glyph, source }) =>
          source === 'default' ? (
            <Glyph name={glyph} />
          ) : (
            <UiProvider icons={replacedGlyphs}>
              <Glyph name={glyph} />
            </UiProvider>
          )
        }
      />
    </LabSection>
    <LabSection
      title="Strings"
      description="Built-in text. Counted strings are shown for a count of 3 and key names for the up arrow. The replaced column overrides a few keys."
    >
      <StateMatrix
        axes={{ key: stringNames, source: ['default', 'replaced'] }}
        render={({ key, source }) =>
          source === 'default' ? (
            <StringValue name={key} />
          ) : (
            <UiProvider strings={replacedStrings}>
              <StringValue name={key} />
            </UiProvider>
          )
        }
      />
    </LabSection>
  </>,
);
