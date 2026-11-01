import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { EmojiPicker, EmojiPickerTrigger } from '../../src/components/emoji-picker/emoji-picker.js';
import {
  EmojiPickerBody,
  EmojiPickerSearch,
  EmojiPickerSkinTones,
  useActiveEmoji,
  type CustomEmoji,
  type EmojiSelection,
  type NativeEmoji,
  type SkinTone,
} from '../../src/components/emoji-picker/index.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const loaders = {
  loading: () => new Promise<readonly NativeEmoji[]>(() => {}),
  failed: () => Promise.reject(new Error('The emoji could not be fetched')),
};

function badge(text: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${ground}"/><text x="16" y="21" font-size="13" font-family="sans-serif" text-anchor="middle" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inline images, so the lab makes no network request. */
const customEmoji: CustomEmoji[] = [
  { shortcode: 'ship_it', src: badge('GO', '#15803d'), label: 'Ship it', keywords: ['launch'] },
  { shortcode: 'plus_one', src: badge('+1', '#1d4ed8'), keywords: ['agree'] },
  { shortcode: 'on_it', src: badge('ON', '#b45309'), label: 'On it' },
];

const regionalIndicatorA = 0x1f1e6;

/** Draws a flag as its two-letter region code, as a host might on a system without flag glyphs. */
function regionCode(unicode: string): string | null {
  const points = Array.from(unicode, (point) => point.codePointAt(0) ?? 0);
  const letters = points.map((point) => point - regionalIndicatorA);
  if (letters.length !== 2 || letters.some((letter) => letter < 0 || letter > 25)) return null;
  return String.fromCharCode(...letters.map((letter) => 65 + letter));
}

function describe(selection: EmojiSelection | null): string {
  if (!selection) return 'nothing yet';
  if (selection.kind === 'custom') return `:${selection.emoji.shortcode}:`;
  return `${selection.unicode} ${selection.emoji.label} (${selection.skinTone})`;
}

const fastFood = new Set(['🍔', '🍟', '🌭', '🍕']);

/** A picker in a modal's body: choosing records the emoji and leaves the modal open. */
function PickerInModal() {
  const [chosen, setChosen] = useState('');
  return (
    <ModalTrigger>
      <Button>Choose a status emoji</Button>
      <Modal
        title="Status emoji"
        description={chosen ? `Chosen: ${chosen}` : 'Nothing chosen yet.'}
      >
        <EmojiPicker
          data-lab-picker="modal"
          onSelect={(selection) =>
            setChosen(selection.kind === 'native' ? selection.unicode : selection.emoji.shortcode)
          }
        />
      </Modal>
    </ModalTrigger>
  );
}

function ActiveCaption() {
  const active = useActiveEmoji();
  return <output data-lab-output="active">{describe(active)}</output>;
}

function Reactions() {
  const [choice, setChoice] = useState<EmojiSelection | null>(null);
  const [recent, setRecent] = useState<string[]>(['👍', ':ship_it:', '🎉']);
  const [tone, setTone] = useState<SkinTone>('default');
  const [search, setSearch] = useState('');
  return (
    <div>
      <EmojiPickerTrigger
        data-lab-picker="popover"
        onSelect={setChoice}
        recentEmoji={recent}
        onRecentEmojiChange={setRecent}
        customEmoji={customEmoji}
        skinTone={tone}
        onSkinToneChange={setTone}
        onSearchChange={setSearch}
      >
        <Button data-lab-trigger="">Add reaction</Button>
      </EmojiPickerTrigger>
      <dl>
        <dt>Chosen</dt>
        <dd>
          <output data-lab-output="choice">{describe(choice)}</output>
        </dd>
        <dt>Recently used</dt>
        <dd>
          <output data-lab-output="recent">{recent.join(' ')}</output>
        </dd>
        <dt>Skin tone</dt>
        <dd>
          <output data-lab-output="tone">{tone}</output>
        </dd>
        <dt>Last search</dt>
        <dd>
          <output data-lab-output="search">{search || 'none'}</output>
        </dd>
      </dl>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Loading, a failed load and the loaded picker, with and without the skin tone choice. The loading and failed pickers also offer custom emoji, which wait for the standard ones: Enter in the search chooses nothing while none is shown."
    >
      <StateMatrix
        axes={{ state: ['loading', 'failed', 'loaded'], 'skin tones': ['shown', 'hidden'] }}
        render={({ state, 'skin tones': tones }) => (
          <EmojiPicker
            loadEmoji={state === 'loaded' ? undefined : loaders[state]}
            customEmoji={state === 'loaded' ? undefined : customEmoji}
            hideSkinTones={tones === 'hidden'}
            defaultSkinTone="medium"
            aria-label={`Emoji picker, ${state}`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Popover"
      description="Open the picker, search, move with the arrow keys and press Enter. The recent list, skin tone and search text flow back to the page."
    >
      <Reactions />
    </LabSection>
    <LabSection
      title="Virtualized"
      description="Only the emoji in view of each grid render; the grid scrolls itself, and Home and End still reach every emoji. Down in the search field returns to the first emoji however far the grid scrolled."
    >
      <div data-lab-demo="virtualized">
        <EmojiPicker aria-label="Emoji, virtualized" virtualized />
      </div>
    </LabSection>
    <LabSection
      title="Custom emoji and drawing"
      description="Image emoji under their own tab, and flags drawn as region codes by renderEmoji."
    >
      <EmojiPicker
        data-lab-picker="custom"
        aria-label="Emoji picker with custom emoji"
        customEmoji={customEmoji}
        renderEmoji={(unicode) => {
          const code = regionCode(unicode);
          return code ? <span data-lab-region={code}>{code}</span> : unicode;
        }}
      />
    </LabSection>
    <LabSection
      title="Languages"
      description="Emoji names and search keywords follow the provider's locale; here French and Japanese."
    >
      <StateMatrix
        axes={{ locale: ['fr-FR', 'ja-JP'] }}
        render={({ locale }) => (
          <UiProvider locale={locale}>
            <EmojiPicker data-lab-picker={locale} aria-label={`Emoji picker, ${locale}`} />
          </UiProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Offered emoji"
      description="Three categories in a chosen order, emoji up to Emoji 13 and no fast food."
    >
      <EmojiPicker
        data-lab-picker="offered"
        aria-label="Emoji picker with chosen emoji"
        categories={['food', 'nature', 'smileys']}
        emojiVersion={13}
        filterEmoji={(emoji) => !fastFood.has(emoji.unicode)}
      />
    </LabSection>
    <LabSection
      title="Composed parts"
      description="The skin tones on top, the search field at the bottom and a caption of the active emoji of the page's own."
    >
      <EmojiPicker data-lab-picker="parts" aria-label="Emoji picker with composed parts">
        <EmojiPickerSkinTones />
        <EmojiPickerBody />
        <p>
          Active: <ActiveCaption />
        </p>
        <EmojiPickerSearch />
      </EmojiPicker>
    </LabSection>
    <LabSection
      title="Inside a modal"
      description="A picker in a modal's body: choosing an emoji keeps the modal open."
    >
      <PickerInModal />
    </LabSection>
  </>,
);
