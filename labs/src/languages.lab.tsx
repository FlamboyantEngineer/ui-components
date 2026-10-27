import { useState } from 'react';
import { AvatarGroup } from '../../src/components/avatar-group/avatar-group.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { LoadMore } from '../../src/components/load-more/load-more.js';
import { Pagination } from '../../src/components/pagination/pagination.js';
import { ReactionBar } from '../../src/components/reaction-bar/reaction-bar.js';
import { RelativeTime } from '../../src/components/relative-time/relative-time.js';
import { SaveStatus } from '../../src/components/save-status/save-status.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { UiProvider, useFormatMessage, useUiStrings } from '../../src/core/provider.js';
import * as languages from '../../src/core/locales/index.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePeople } from './people-samples.js';

type Language = keyof typeof languages;

const languageLocales: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ja: 'ja-JP',
};

// Each language names itself, as a language menu does.
const languageOptions = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
  { id: 'ja', label: '日本語' },
];

const languageNames = Object.keys(languageLocales) as Language[];

// A host's own messages, kept beside the library's in the same ICU format.
const guestMessages: Record<Language, string> = {
  en: '{count, plural, one {# guest} other {# guests}} at the table: {names}',
  fr: '{count, plural, one {# invité} other {# invités}} à table : {names}',
  es: '{count, plural, one {# invitado} other {# invitados}} en la mesa: {names}',
  ja: 'テーブルのゲスト {count} 人: {names}',
};

const guests = ['Ana', 'Ben', 'Chloé'];

const reactions = [
  { emoji: '👍', people: ['Maria Santos', 'Jon Berg', 'Lena Ortiz'], isReacted: true },
  { emoji: '🎉', count: 4, people: ['Sam Okafor'] },
];

const fixedNow = () => new Date('2026-03-12T12:00:00');

/** The text of one language for a message key, the same way components read it. */
function Counted({ count }: { count: number }) {
  const strings = useUiStrings();
  return <>{`${strings.itemCount(count)} · ${strings.questionChose(guests.slice(0, count))}`}</>;
}

function GuestLine({ language }: { language: Language }) {
  const format = useFormatMessage();
  return <>{format(guestMessages[language], { count: guests.length, names: guests })}</>;
}

/** A page of components that follows the language chosen in the menu, without a reload. */
function SwitchingPage() {
  const [language, setLanguage] = useState<Language>('en');
  const locale = languageLocales[language];
  return (
    <div data-lab-demo="switching">
      <SelectField
        label="Language"
        options={languageOptions}
        value={language}
        onChange={(key) => setLanguage(key as Language)}
        data-lab-field="language"
      />
      <UiProvider locale={locale} messages={languages[language]}>
        <div lang={locale} data-lab-output="page">
          <Pagination pageCount={12} defaultPage={4} />
          <p>
            <LoadMore remainingCount={1200} onLoadMore={() => undefined} />{' '}
            <CopyButton value="Sample text" />
          </p>
          <SaveStatus phase="error" onRetry={() => undefined} />
          <AvatarGroup people={samplePeople} maxVisible={3} />
          <ReactionBar reactions={reactions} maxNames={2} />
          <p>
            <RelativeTime value="2026-03-11T09:30:00" getNow={fixedNow} showTooltip={false} />
          </p>
          <p data-lab-output="host">
            <GuestLine language={language} />
          </p>
        </div>
      </UiProvider>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Switching on the fly"
      description="The menu swaps the provider’s messages and locale; every component below rereads its text."
    >
      <SwitchingPage />
    </LabSection>
    <LabSection
      title="Plurals and lists"
      description="Counts pick each language’s plural form, numbers group by locale and lists join with its own words."
    >
      <StateMatrix
        axes={{ count: ['1', '2', '3', '1200'], language: languageNames }}
        render={({ count, language }) => (
          <UiProvider locale={languageLocales[language]} messages={languages[language]}>
            <span lang={languageLocales[language]}>
              <Counted count={Number(count)} />
            </span>
          </UiProvider>
        )}
      />
    </LabSection>
  </>,
);
