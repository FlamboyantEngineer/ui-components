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
  shortcutSequence: [['G', 'I']],
  stepOfTotal: [3, 5],
  filterLabel: ['Page Settings'],
  noPropertyMatches: ['zinc'],
  boxSide: ['top'],
  invalidJsonAt: [3, 5],
  jsonTypeMismatch: [['string', 'null']],
  jsonValueMismatch: [['"starter"', '"main"']],
  jsonMissingProperty: ['servings'],
  jsonUnknownProperty: ['size'],
  jsonProblemAt: [3, 5, 'Expected string.'],
  rejectedFileReason: ['Report.pdf', 'A file with this name is already chosen.'],
  nameWithStatus: ['Maria Santos', 'Away'],
  morePeople: [3, ['Jon Berg', 'Lena Ortiz', 'Sam Okafor']],
  emojiCategory: ['smileys'],
  skinToneName: ['medium-light'],
  reactionLabel: ['👍', 3, ['Jon Berg', 'Lena Ortiz', 'Sam Okafor']],
  timelineDates: [{ start: 'Mar 2, 2026', end: 'Mar 13, 2026' }],
  timelineMilestone: ['Mar 20, 2026'],
  timelineProgress: ['40%'],
  timelineDependsOn: [['Survey', 'Budget']],
  timelineKeyboardHint: ['bar'],
  timelineQuarter: [2],
  removeFilter: ['Status is Open'],
  filterOperator: ['any-of'],
  filterRange: ['2', '5'],
  downloadFile: ['Report.pdf'],
  mediaStage: ['Harbour.jpg'],
  problemCount: [2, 1],
  problemSeverity: ['warning'],
  viewActions: ['Quick meals'],
  deleteViewTitle: ['Quick meals'],
  sortDirectionName: ['descending'],
  showProperty: ['Cuisine'],
  densityName: ['compact'],
  editValue: ['Title'],
  copyIdentifier: ['REQ-12'],
  stateTrigger: ['Status', 'In review'],
  transitionTo: ['Approved'],
  groupHeading: ['Colour', 'Red'],
  cardCount: [6, 5],
  moveColumn: ['In progress'],
  previousRange: ['month'],
  nextRange: ['week'],
  calendarEvent: ['Design review', '10:00 AM – 11:00 AM'],
  importColumnAs: ['City'],
  mappedColumns: [3, 5],
  skippedColumns: [2],
  unmappedRequiredTargets: [['Name', 'Email']],
  duplicateTarget: ['Email', ['Contact']],
  stepLabel: ['2'],
  stepActions: ['2'],
  moveStep: ['2'],
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
