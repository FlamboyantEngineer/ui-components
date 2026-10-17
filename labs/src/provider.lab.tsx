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

// Arguments for strings that are functions; anything not listed is shown for a count of 3.
const sampleArguments: Partial<Record<keyof UiStrings, readonly unknown[]>> = {
  shortcutKeyName: ['↑'],
  stepOfTotal: [3, 5],
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
  const value = strings[name];
  if (typeof value !== 'function') return value;
  return (value as (...values: readonly unknown[]) => string)(...(sampleArguments[name] ?? [3]));
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
      description="Built-in text. Strings that take values are shown with sample values (a count of 3, a step of 3 of 5, the up arrow). The replaced column overrides a few keys."
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
