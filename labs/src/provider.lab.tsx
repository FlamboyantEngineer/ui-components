import type { GlyphComponentProps } from '../../src/core/glyphs.js';
import * as languages from '../../src/core/locales/index.js';
import { Glyph, UiProvider, useUiStrings } from '../../src/core/provider.js';
import type { UiStrings } from '../../src/core/strings.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { glyphCatalog, glyphNames } from './glyph-catalog.js';
import { ProviderClock } from './provider-clock-cases.js';
import { PersistenceLifecycle, RoutedLinks } from './provider-host-cases.js';
import { PausedShortcut } from './provider-overlay-cases.js';
import {
  HydratedStorage,
  OptionalOptions,
  StorageSwitch,
  WrappedStorage,
} from './provider-storage-cases.js';
import { IndependentServices } from './provider-subscription-cases.js';

const replacedGlyphs = Object.fromEntries(glyphNames.map((name) => [name, SquareGlyph]));

const languageLocales = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', ja: 'ja-JP' } as const;

const languageNames = Object.keys(languageLocales) as Array<keyof typeof languageLocales>;

// Arguments for strings that are functions; anything not listed is shown for a count of 3.
const sampleArguments: Partial<Record<keyof UiStrings, readonly unknown[]>> = {
  shortcutKeyName: ['↑'],
  shortcutThen: ['G', 'I'],
  stepOfTotal: [3, 5],
  snippetLines: [3, 8],
  constraintLabel: ['minLength'],
  constraintRequiredChoice: ['optional'],
  constraintUnset: ['Minimum'],
  constraintIssue: ['boundsReversed'],
  segmentCount: [{ completed: '2', total: '5', percent: '40%' }],
  segmentProgress: [{ completed: '2', total: '5', percent: '40%', current: 'Review' }],
  heading: [2],
  filterLabel: ['Page Settings'],
  noPropertyMatches: ['zinc'],
  boxSide: ['top'],
  logicalBoxSide: ['inline-start'],
  seriesSummary: [{ low: '2', high: '9', last: '7' }],
  invalidJsonAt: [3, 5],
  jsonTypeMismatch: [['string', 'null']],
  jsonValueMismatch: [['"starter"', '"main"']],
  jsonMissingProperty: ['servings'],
  jsonUnknownProperty: ['size'],
  jsonProblemAt: [3, 5, 'Expected string.'],
  rejectedFileReason: ['Report.pdf', 'A file with this name is already chosen.'],
  nameWithStatus: ['Maria Santos', 'Away'],
  morePeople: [3, ['Jon Berg', 'Lena Ortiz', 'Sam Okafor']],
  goToSlide: [2],
  qrCodeOf: ['https://example.com'],
  emojiCategory: ['smileys'],
  gridSize: [3, 4],
  gridSizeCell: [3, 4],
  moveSelectedTo: ['Chosen'],
  moveAllTo: ['Available'],
  skinToneName: ['medium-light'],
  reactionLabel: ['👍', 3, ['Jon Berg', 'Lena Ortiz', 'Sam Okafor']],
  reactionSummary: [4, ['👍 3, reacted by Jon Berg', '🎉 1'], ['🎉']],
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
  problemSeverityLead: ['warning'],
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
  treeAddedRow: ['Kiwi'],
  treeRemovedRow: ['Pecan'],
  treeChangedRow: ['Pear', 'Pears'],
  treeMovedAwayRow: ['Fig'],
  treeMovedHereRow: ['Fig'],
  importColumnAs: ['City'],
  mappedColumns: [3, 5],
  skippedColumns: [2],
  unmappedRequiredTargets: [['Name', 'Email']],
  duplicateTarget: ['Email', ['Contact']],
  stepLabel: ['2'],
  stepActions: ['2'],
  moveStep: ['2'],
  textDiffSummary: [5, 3],
  textDiffLine: ['unchanged', 4, 6],
  permissionGrant: ['Write recipes', 'Editor', true],
  permissionGroupGrant: ['Photos', 'Editor'],
  upstreamOf: ['Requirement 12'],
  downstreamOf: ['Requirement 12'],
  relatedCount: [2, 'downstream'],
  chartSummary: [{ series: 2, values: 12, low: '3', high: '48' }],
  chartValue: ['Apples', 'March', '42'],
  donutSummary: ['120', 'Apples', '50%'],
  donutSegment: ['Apples', '60', '50%'],
  moveTile: ['Visitors'],
  resizeTile: ['Visitors'],
  tileMoved: ['Visitors', 3, 2],
  formLayoutMoved: ['City', 'Contact', 2],
  fileMoved: ['Report.pdf', 2, 3],
  formLayoutAdded: ['City', 'Contact', 2],
  tileResized: ['Visitors', 4, 2],
  redlineSummary: [{ added: 2, removed: 1, changed: 3, moved: 1 }],
  redlineBlockType: ['heading', 2],
  redlineRow: ['changed', 'Heading 2'],
  redlineTypeChange: ['Paragraph', 'Heading 2'],
  formulaInvalidReference: ['Q0'],
  mergeViewConflictCount: [2, 3],
  mergeViewConflict: [2, 3],
  mergeViewConflictResult: [2],
  mergeViewTake: ['Theirs'],
  mergeViewLine: ['conflict', 4],
  pivotAggregate: ['average'],
  pivotValueLabel: ['Sum', 'Boxes'],
  pivotAggregationOf: ['Boxes'],
  diagramPortLabel: ['Pump', 'outlet'],
  diagramOutgoing: ['Valve, Tank'],
  diagramIncoming: ['Inlet'],
  diagramMoved: ['Pump', 1],
  diagramConnecting: ['Pump, outlet'],
  diagramConnected: ['Pump', 'Valve'],
  diagramRemoved: [2],
  diagramRemoveConnection: ['Pump', 'Valve'],
  feedbackDetails: ['down'],
  chatReasoningComplete: [12],
  chatStepsComplete: [['edited files', 'ran a command'], 40],
  chatStepsAction: ['edit', 2],
  chatPlanProgress: [2, 5],
  chatPlanStepStatus: ['in-progress'],
  chatPlanChange: ['Book the train', 'done'],
  chatPlanChanged: [['Book the train: done', 'Pack: in progress']],
  viewAttachment: ['harbour.jpg'],
  attachmentUploading: ['harbour.jpg'],
  attachmentFailed: ['harbour.jpg'],
  conversationLabel: [
    { title: 'Weekend trip', presence: 'Online', unreadCount: 2, isMuted: false, time: '10:30' },
  ],
  chatMessageLabel: ['Ana Lopez', '20 April 2026, 10:30'],
  chatDelivery: ['read'],
  chatQuoteLabel: ['Ana Lopez', 'Shall we leave at nine?'],
  chatTyping: [['Ana', 'Ben', 'Chloé']],
  chatSeenBy: [['Ana', 'Ben', 'Chloé', 'Dev']],
  questionProgress: [2, 3],
  questionPreview: ['A quiet room'],
  questionAsked: ['Which room should I book?', 2],
  questionChose: [['A quiet room']],
  questionAnsweredText: ['Any room near the station'],
  chatCitationLabel: [1, 'Train timetable'],
  newMessageAnnouncement: ['Ana Lopez', 'See you at nine.'],
  toolCallStatus: ['running'],
  toolCallDuration: [1200, 'short'],
  copyToolCallPart: ['arguments'],
  toolCallApprovalPrompt: ['Delete the draft'],
  toolCallAlwaysAllow: ['this conversation'],
  toolCallDecision: ['denied', 'Keep the draft for now'],
  codeBlockTitle: ['terminal'],
  removedFromMessage: ['Ana Lopez'],
};

const stringNames = Object.keys(languages.en) as Array<keyof UiStrings>;

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
            <Glyph icon={glyphCatalog[glyph]} />
          ) : (
            <UiProvider icons={replacedGlyphs}>
              <Glyph icon={glyphCatalog[glyph]} />
            </UiProvider>
          )
        }
      />
    </LabSection>
    <LabSection
      title="Strings"
      description="Built-in text in each shipped language file. Text that takes values is shown with sample values (a count of 3, a step of 3 of 5, the up arrow). The Languages lab switches a page of components between them."
    >
      <StateMatrix
        axes={{ key: stringNames, language: languageNames }}
        render={({ key, language }) => (
          <UiProvider locale={languageLocales[language]} messages={languages[language]}>
            <StringValue name={key} />
          </UiProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Overlay presence"
      description="Press N anywhere to add a note. The shortcut reads the provider's overlay presence and pauses while the menu, its submenu, the select or the calendar is open; the tooltip does not pause it."
    >
      <PausedShortcut />
    </LabSection>
    <LabSection
      title="Storage"
      description="Switch adapters and keys without remounting the counter. Each stored value stays with its own adapter and key."
    >
      <StorageSwitch />
    </LabSection>
    <LabSection
      title="Storage after server rendering"
      description="The zoom was rendered on a server with empty storage and hydrated over a store holding 150. Hydration matches the server's 100, with no mismatch, then the stored 150 replaces it; pressing Zoom stores the new value."
    >
      <HydratedStorage />
    </LabSection>
    <LabSection
      title="Storage wrapped anew"
      description="The provider gets a new adapter over the same storage on every render. Type, then rerender the provider within 300ms: the note keeps your text."
    >
      <WrappedStorage />
    </LabSection>
    <LabSection
      title="Options that come and go"
      description="Type a draft, then turn the French locale or client routing on and off: the draft and its focus stay, the locale follows, and the link routes through navigate only while routing is on."
    >
      <OptionalOptions />
    </LabSection>
    <LabSection
      title="Delayed persistence"
      description="The draft persists through usePersistentState with the chosen writeDelay, over a store whose writes the log lists. Type: the value in memory changes at once and the store only after the delay; Flush writes now. Switch the key or unmount the draft while a write waits: the waiting write goes to the key it was made for. Corrupt the stored value (it becomes 42, not text), then unmount and mount the draft: the codec refuses it and the draft falls back to empty."
    >
      <PersistenceLifecycle />
    </LabSection>
    <LabSection
      title="Link renderer and href mapping"
      description="The outer provider gives React Aria links a router (navigate, and useHref mapping /garden to the native #/app/garden) and draws every library link with its renderLink, a router link marked data-lab-link-renderer=outer that routes list-row links itself. The inner provider replaces only renderLink (inner) and keeps the outer router and href mapping. Each press lists the href it routed and what routed it."
    >
      <RoutedLinks />
    </LabSection>
    <LabSection
      title="Clock and time zone"
      description="A provider with a fixed clock at 23:30 UTC on October 31. Switch its time zone: today, the relative words, the field and the day headings all follow it."
    >
      <ProviderClock />
    </LabSection>
    <LabSection
      title="Independent services"
      description="Each row is a memoized component reading one provider service, with the number of times it has rendered. Switch one service: only the row reading it renders again."
    >
      <IndependentServices />
    </LabSection>
  </>,
);
