import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Modal } from '../modal/modal.js';
import { parseEmojiData, type CustomEmoji, type NativeEmoji } from './emoji-catalog.js';
import { EmojiPickerBody } from './emoji-picker-body.js';
import { useActiveEmoji } from './emoji-picker-context.js';
import { EmojiPickerPreview, EmojiPickerSearch } from './emoji-picker-parts.js';
import { EmojiPicker, EmojiPickerTrigger } from './emoji-picker.js';
import { EmojiPickerSkinTones } from './skin-tone-picker.js';

const fixture = parseEmojiData(
  [
    'smileys',
    '😀||grinning face|grinning|happy,smile',
    '😂||face with tears of joy|joy|laugh',
    '🙂||slightly smiling face|slightly_smiling_face|smile',
    'people',
    '👋|1|waving hand|wave|hello,bye',
    '👍|1|thumbs up|thumbsup,+1|ok',
    'food',
    '🍎||red apple|apple|fruit',
    '🍌||banana|banana|fruit',
  ].join('\n'),
);
const loadFixture = () => Promise.resolve(fixture);
const parrot: CustomEmoji = { shortcode: 'party_parrot', src: '/parrot.gif', keywords: ['bird'] };
const otter: CustomEmoji = { shortcode: 'otter', src: '/otter.png', label: 'Happy otter' };

function cells(grid: HTMLElement): string[] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-label') ?? '');
}

async function renderPicker(props: Parameters<typeof EmojiPicker>[0] = {}) {
  const view = render(<EmojiPicker loadEmoji={loadFixture} {...props} />);
  await screen.findByRole('grid');
  return view;
}

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when the tab changes.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

// The bundled sets are large modules, so loading them is slow on a busy machine.
describe('EmojiPicker', { timeout: 15_000 }, () => {
  it('UIC-EMOJI-PICKER-1.1 shows the loading state until the emoji load, and a failure', async () => {
    let resolve: (emoji: readonly NativeEmoji[]) => void = () => {};
    const pending = new Promise<readonly NativeEmoji[]>((done) => (resolve = done));
    const loadEmoji = () => pending;
    const { container, unmount } = render(<EmojiPicker loadEmoji={loadEmoji} />);
    const root = container.querySelector('.ui-emoji-picker') as HTMLElement;
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expectHooksMatchSpec(container, 'EMOJI-PICKER', { slots: ['message', 'search'] });
    await act(async () => resolve(fixture));
    expect(root).not.toHaveAttribute('data-loading');
    expect(screen.getByRole('grid')).toBeInTheDocument();
    unmount();

    const failing = () => Promise.reject(new Error('offline'));
    const view = render(<EmojiPicker loadEmoji={failing} />);
    expect(await screen.findByText('Emoji could not be loaded.')).toHaveClass(
      'ui-emoji-picker__message',
    );
    expect(view.container.querySelector('.ui-emoji-picker')).not.toHaveAttribute('data-loading');
  });

  it('UIC-EMOJI-PICKER-1.1 loads once although the host passes a new loader on each render', async () => {
    const load = vi.fn(loadFixture);
    function Host() {
      const [recent, setRecent] = useState<string[]>([]);
      return (
        <EmojiPicker
          loadEmoji={() => load()}
          recentEmoji={recent}
          onRecentEmojiChange={setRecent}
        />
      );
    }
    const { container } = render(<Host />);
    const grid = await screen.findByRole('grid', { name: 'Smileys & Emotion' });
    await userEvent.click(within(grid).getByRole('row', { name: 'grinning face' }));
    expect(await screen.findByRole('grid', { name: 'Recently used' })).toBeInTheDocument();
    expect(container.querySelector('.ui-emoji-picker')).not.toHaveAttribute('data-loading');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('UIC-EMOJI-PICKER-1.1 loads the bundled set by default', async () => {
    render(<EmojiPicker />);
    const grid = await screen.findByRole(
      'grid',
      { name: 'Smileys & Emotion' },
      { timeout: 10_000 },
    );
    expect(cells(grid)[0]).toBe('grinning face');
  });

  it('UIC-EMOJI-PICKER-1.2 shows recent, custom and standard category tabs in order', async () => {
    const { container } = await renderPicker({ recentEmoji: ['🍎'], customEmoji: [parrot] });
    const tabs = within(screen.getByRole('tablist', { name: 'Emoji categories' })).getAllByRole(
      'tab',
    );
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      '🕘Recently used',
      '✨Custom',
      '😀Smileys & Emotion',
      '👋People & Body',
      '🍔Food & Drink',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(container.querySelector('.ui-emoji-picker__categories')).toHaveClass('ui-tabs');
    expect(cells(screen.getByRole('grid', { name: 'Recently used' }))).toEqual(['red apple']);
    await userEvent.click(tabs[3] as HTMLElement);
    expect(cells(screen.getByRole('grid', { name: 'People & Body' }))).toEqual([
      'waving hand',
      'thumbs up',
    ]);
    expectHooksMatchSpec(container, 'EMOJI-PICKER', {
      slots: ['categories', 'section', 'label', 'grid', 'cell'],
    });
  });

  it('UIC-EMOJI-PICKER-1.3 draws named cells in the skin tone, by renderEmoji and as images', async () => {
    const { container, rerender } = await renderPicker({
      recentEmoji: ['👋', ':otter:'],
      customEmoji: [otter],
      defaultSkinTone: 'dark',
    });
    const grid = screen.getByRole('grid', { name: 'Recently used' });
    expect(grid).toHaveAttribute('data-layout', 'grid');
    expect(within(grid).getByRole('row', { name: 'waving hand' })).toHaveTextContent('👋🏿');
    const image = within(grid).getByRole('row', { name: 'Happy otter' }).querySelector('img');
    expect(image).toHaveClass('ui-emoji-picker__image');
    expect(image).toHaveAttribute('src', '/otter.png');
    expect(image).toHaveAttribute('alt', '');
    expectHooksMatchSpec(container, 'EMOJI-PICKER', { slots: ['image'] });

    rerender(
      <EmojiPicker
        loadEmoji={loadFixture}
        recentEmoji={['👋']}
        defaultSkinTone="dark"
        renderEmoji={(unicode) => <b data-glyph-text={unicode}>{unicode.length}</b>}
      />,
    );
    const drawn = screen.getByRole('row', { name: 'waving hand' }).querySelector('b');
    expect(drawn?.dataset.glyphText).toBe('👋🏿');
  });

  it('UIC-EMOJI-PICKER-1.6 renders only the emoji in view of a virtualized grid and reaches the last', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(304);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(160);
    const user = userEvent.setup();
    const many: CustomEmoji[] = Array.from({ length: 400 }, (_, index) => ({
      shortcode: `sticker_${index}`,
      src: `/sticker-${index}.png`,
    }));
    const { container } = render(
      <EmojiPicker loadEmoji={loadFixture} customEmoji={many} virtualized />,
    );
    const grid = await screen.findByRole('grid', { name: 'Custom' });
    expect(grid).toHaveAttribute('data-virtualized', 'true');
    expect(container.querySelector('.ui-emoji-picker__section')).toHaveAttribute(
      'data-virtualized',
      'true',
    );
    expect(within(grid).getAllByRole('row').length).toBeLessThan(120);
    const first = within(grid).getByRole('row', { name: ':sticker_0:' });
    expect(first.parentElement?.style.position).toBe('absolute');
    await user.click(first);
    await user.keyboard('{End}');
    await waitFor(() =>
      expect(within(grid).getByRole('row', { name: ':sticker_399:' })).toHaveFocus(),
    );
    expectHooksMatchSpec(container, 'EMOJI-PICKER');
  });

  it('UIC-EMOJI-PICKER-1.3 moves through the grid from the keyboard without leaking keys', async () => {
    const outerKeys: string[] = [];
    render(
      <div onKeyDown={(event) => outerKeys.push(event.key)}>
        <EmojiPicker loadEmoji={loadFixture} />
      </div>,
    );
    const grid = await screen.findByRole('grid', { name: 'Smileys & Emotion' });
    await userEvent.click(within(grid).getByRole('row', { name: 'face with tears of joy' }));
    const row = (name: string) => within(grid).getByRole('row', { name });
    await userEvent.keyboard('{ArrowRight}');
    expect(row('slightly smiling face')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(row('grinning face')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{End}');
    expect(row('slightly smiling face')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}g');
    expect(row('grinning face')).toHaveFocus();
    expect(outerKeys).toEqual([]);
  });

  it('UIC-EMOJI-PICKER-1.4 reports the selection in the skin tone and the updated recent list', async () => {
    const onSelect = vi.fn();
    const onRecentEmojiChange = vi.fn();
    const recent = Array.from({ length: 24 }, (_, index) => `:custom_${index}:`);
    await renderPicker({ onSelect, onRecentEmojiChange, recentEmoji: recent, skinTone: 'medium' });
    await userEvent.click(screen.getByRole('tab', { name: 'People & Body' }));
    await userEvent.click(screen.getByRole('row', { name: 'waving hand' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'native',
      emoji: fixture[3],
      unicode: '👋🏽',
      hexcode: '1F44B-1F3FD',
      skinTone: 'medium',
    });
    expect(onRecentEmojiChange).toHaveBeenCalledWith(['👋', ...recent.slice(0, 23)]);

    await userEvent.click(screen.getByRole('tab', { name: 'Food & Drink' }));
    screen.getByRole('row', { name: 'banana' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ unicode: '🍌', skinTone: 'default' }),
    );
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('UIC-EMOJI-PICKER-1.4 leaves an overlay around a standalone picker open on a choice', async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Modal isOpen onOpenChange={onOpenChange} title="Reactions">
        <EmojiPicker loadEmoji={loadFixture} onSelect={onSelect} />
      </Modal>,
    );
    await screen.findByRole('grid');
    await userEvent.click(screen.getByRole('row', { name: 'grinning face' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Reactions' })).toBeInTheDocument();
  });

  it('UIC-EMOJI-PICKER-1.4 reports one recent key per emoji, whatever tone the list held', async () => {
    const onRecentEmojiChange = vi.fn();
    await renderPicker({ recentEmoji: ['👋🏽', '😀'], onRecentEmojiChange });
    const grid = screen.getByRole('grid', { name: 'Recently used' });
    await userEvent.click(within(grid).getByRole('row', { name: 'waving hand' }));
    expect(onRecentEmojiChange).toHaveBeenCalledWith(['👋', '😀']);
  });

  it('UIC-EMOJI-PICKER-2.2 shows an emoji named twice in the recent list once', async () => {
    await renderPicker({ recentEmoji: ['👋', '👋🏽', '😀', '😀'] });
    expect(cells(screen.getByRole('grid', { name: 'Recently used' }))).toEqual([
      'waving hand',
      'grinning face',
    ]);
  });

  it('UIC-EMOJI-PICKER-1.5 previews the hovered or focused emoji', async () => {
    const { container } = await renderPicker({ recentEmoji: [':otter:'], customEmoji: [otter] });
    const preview = container.querySelector('.ui-emoji-picker__preview') as HTMLElement;
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(preview).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('tab', { name: 'Smileys & Emotion' }));
    await userEvent.hover(screen.getByRole('row', { name: 'grinning face' }));
    expect(preview.querySelector('.ui-emoji-picker__preview-emoji')).toHaveTextContent('😀');
    expect(preview.querySelector('.ui-emoji-picker__preview-label')).toHaveTextContent(
      'grinning face',
    );
    await userEvent.click(screen.getByRole('row', { name: 'grinning face' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(preview.querySelector('.ui-emoji-picker__preview-label')).toHaveTextContent(
      'face with tears of joy',
    );
    expectHooksMatchSpec(container, 'EMOJI-PICKER', {
      slots: ['footer', 'preview', 'preview-emoji', 'preview-label'],
    });
  });

  it('UIC-EMOJI-PICKER-1.5 redraws only the preview, not the grid, on hover', async () => {
    const many = parseEmojiData(
      [
        'smileys',
        ...Array.from(
          { length: 40 },
          (_, index) => `${String.fromCodePoint(0x1f600 + index)}||face ${index}|face_${index}|`,
        ),
      ].join('\n'),
    );
    const renderEmoji = vi.fn((unicode: string) => unicode);
    render(<EmojiPicker loadEmoji={() => Promise.resolve(many)} renderEmoji={renderEmoji} />);
    const grid = await screen.findByRole('grid', { name: 'Smileys & Emotion' });
    const rows = within(grid).getAllByRole('row');
    expect(rows).toHaveLength(40);
    renderEmoji.mockClear();
    for (const row of rows.slice(0, 3)) await userEvent.hover(row);
    expect(screen.getByText('face 2')).toHaveClass('ui-emoji-picker__preview-label');
    expect(renderEmoji.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('UIC-EMOJI-PICKER-2.1 searches standard and custom emoji and reports the query', async () => {
    const onSearchChange = vi.fn();
    const { container } = await renderPicker({ customEmoji: [parrot], onSearchChange });
    const search = screen.getByRole('searchbox', { name: 'Search emoji' });
    expect(search).toHaveAttribute('placeholder', 'Search emoji');
    expect(search).toHaveClass('ui-emoji-picker__search-input');
    await userEvent.type(search, 'smil');
    expect(onSearchChange).toHaveBeenLastCalledWith('smil');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    const results = screen.getByRole('grid', { name: 'Search results' });
    expect(cells(results)).toEqual(['slightly smiling face', 'grinning face']);

    await userEvent.clear(search);
    await userEvent.type(search, ':bird:');
    expect(cells(screen.getByRole('grid', { name: 'Search results' }))).toEqual([':party_parrot:']);
    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(container.querySelector('.ui-emoji-picker__message')).toHaveTextContent('No results');
    await userEvent.click(container.querySelector('.ui-emoji-picker__search-clear') as Element);
    expect(search).toHaveValue('');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'EMOJI-PICKER', {
      slots: ['search', 'search-input', 'search-clear'],
    });
  });

  it('UIC-EMOJI-PICKER-2.1 moves down into the grid, chooses on Enter and clears on Escape', async () => {
    const onSelect = vi.fn();
    await renderPicker({ onSelect });
    const search = screen.getByRole('searchbox');
    await userEvent.type(search, 'fruit');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('row', { name: 'banana' })).toHaveFocus();
    await userEvent.click(search);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unicode: '🍌' }));
    await userEvent.keyboard('{Escape}');
    expect(search).toHaveValue('');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ unicode: '😀' }));
  });

  it('UIC-EMOJI-PICKER-2.2 UIC-EMOJI-PICKER-2.3 fills the recent and custom tabs from data', async () => {
    await renderPicker({
      recentEmoji: ['👍🏾', ':missing:', ':party_parrot:'],
      customEmoji: [parrot, otter],
    });
    expect(cells(screen.getByRole('grid', { name: 'Recently used' }))).toEqual([
      'thumbs up',
      ':party_parrot:',
    ]);
    await userEvent.click(screen.getByRole('tab', { name: 'Custom' }));
    expect(cells(screen.getByRole('grid', { name: 'Custom' }))).toEqual([
      ':party_parrot:',
      'Happy otter',
    ]);
  });

  it('UIC-EMOJI-PICKER-2.4 chooses a skin tone, controlled or not, and can hide the choice', async () => {
    const onSkinToneChange = vi.fn();
    const { container, rerender } = await renderPicker({
      recentEmoji: ['👋'],
      onSkinToneChange,
    });
    const group = screen.getByRole('radiogroup', { name: 'Skin tone' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Default',
      'Light',
      'Medium-light',
      'Medium',
      'Medium-dark',
      'Dark',
    ]);
    expect(radios[0]).toBeChecked();
    expect(group.querySelectorAll('.ui-emoji-picker__skin-tone')[2]).toHaveTextContent('✋🏼');
    await userEvent.click(radios[1] as HTMLElement);
    expect(onSkinToneChange).toHaveBeenCalledWith('light');
    expect(screen.getByRole('row', { name: 'waving hand' })).toHaveTextContent('👋🏻');
    expectHooksMatchSpec(container, 'EMOJI-PICKER', { slots: ['skin-tones', 'skin-tone'] });

    rerender(<EmojiPicker loadEmoji={loadFixture} recentEmoji={['👋']} skinTone="medium-dark" />);
    expect(screen.getByRole('row', { name: 'waving hand' })).toHaveTextContent('👋🏾');
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(screen.getByRole('row', { name: 'waving hand' })).toHaveTextContent('👋🏾');

    rerender(<EmojiPicker loadEmoji={loadFixture} hideSkinTones />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('UIC-EMOJI-PICKER-3.1 opens in a popover, closes on a choice, Escape or an outside press', async () => {
    const onSelect = vi.fn();
    render(
      <>
        <EmojiPickerTrigger loadEmoji={loadFixture} onSelect={onSelect} data-testid="picker">
          <Button>React</Button>
        </EmojiPickerTrigger>
        <button type="button">Outside</button>
      </>,
    );
    const button = screen.getByRole('button', { name: 'React' });
    await userEvent.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Emoji picker' });
    expect(dialog).toHaveAttribute('data-testid', 'picker');
    const popover = dialog.closest<HTMLElement>('.ui-emoji-picker__popover');
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover?.style.zIndex).toBe('130');
    await screen.findByRole('grid');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expectHooksMatchSpec(document.body, 'EMOJI-PICKER', { slots: ['popover'] });

    await userEvent.click(screen.getByRole('row', { name: 'grinning face' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(button).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    await screen.findByRole('grid');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(button).toHaveFocus());

    await userEvent.click(button);
    await screen.findByRole('grid');
    await userEvent.click(screen.getByRole('button', { name: 'Outside', hidden: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-EMOJI-PICKER-3.2 is a dialog named by its label and focuses search on request', async () => {
    const { rerender } = await renderPicker();
    expect(screen.getByRole('dialog', { name: 'Emoji picker' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
    rerender(
      <UiProvider messages={{ emojiPicker: 'Emoji' }}>
        <EmojiPicker loadEmoji={loadFixture} />
      </UiProvider>,
    );
    expect(screen.getByRole('dialog', { name: 'Emoji' })).toBeInTheDocument();
    rerender(<EmojiPicker loadEmoji={loadFixture} aria-label="Add reaction" autoFocus />);
    expect(screen.getByRole('dialog', { name: 'Add reaction' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="picker-title">React to the message</h2>
        <p id="picker-help">Pick one emoji.</p>
        <EmojiPicker
          loadEmoji={loadFixture}
          aria-labelledby="picker-title"
          aria-describedby="picker-help"
        />
      </>,
    );
    const dialog = screen.getByRole('dialog', { name: 'React to the message' });
    expect(dialog).toHaveAccessibleDescription('Pick one emoji.');
  });

  it('UIC-EMOJI-PICKER-3.2 focuses the search field on mount with autoFocus', async () => {
    await renderPicker({ autoFocus: true });
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('UIC-EMOJI-PICKER-3.3 appends the caller class and forwards id and data attributes', async () => {
    const { container } = await renderPicker({
      className: 'caller',
      id: 'picker-1',
      'data-testid': 'probe',
    });
    const root = container.querySelector('.ui-emoji-picker') as HTMLElement;
    expect(root).toHaveClass('ui-emoji-picker', 'caller');
    expect(root).toHaveAttribute('id', 'picker-1');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'EMOJI-PICKER');
  });

  it('UIC-EMOJI-PICKER-4.4 loads the bundled set in the language of the provider locale', async () => {
    render(
      <UiProvider locale="fr-FR">
        <EmojiPicker />
      </UiProvider>,
    );
    const grid = await screen.findByRole(
      'grid',
      { name: 'Smileys & Emotion' },
      { timeout: 10_000 },
    );
    expect(cells(grid)[0]).toBe('visage rieur');
    await userEvent.type(screen.getByRole('searchbox'), 'pomme');
    expect(cells(screen.getByRole('grid', { name: 'Search results' }))).toContain('pomme rouge');
  });

  it('UIC-EMOJI-PICKER-5.3 offers the chosen categories in the chosen order', async () => {
    await renderPicker({ categories: ['food', 'smileys'], recentEmoji: ['👋', '🍎'] });
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      '🕘Recently used',
      '🍔Food & Drink',
      '😀Smileys & Emotion',
    ]);
    expect(cells(screen.getByRole('grid', { name: 'Recently used' }))).toEqual(['red apple']);
    await userEvent.type(screen.getByRole('searchbox'), 'wave');
    expect(screen.getByRole('status')).toHaveTextContent('No results');
  });

  it('UIC-EMOJI-PICKER-5.4 leaves filtered emoji out of the categories, search and recent emoji', async () => {
    const filterEmoji = (emoji: NativeEmoji) => !emoji.keywords.includes('fruit');
    await renderPicker({ filterEmoji, recentEmoji: ['🍎', '😀'], customEmoji: [parrot] });
    expect(cells(screen.getByRole('grid', { name: 'Recently used' }))).toEqual(['grinning face']);
    expect(screen.queryByRole('tab', { name: 'Food & Drink' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    const results = cells(screen.getByRole('grid', { name: 'Search results' }));
    expect(results).toContain(':party_parrot:');
    expect(results).not.toContain('banana');
  });

  it('UIC-EMOJI-PICKER-6.1 lays out the parts the caller composes', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <EmojiPicker loadEmoji={loadFixture} onSelect={onSelect} recentEmoji={['🍎']}>
        <EmojiPickerSkinTones className="tones" data-part="tones" />
        <EmojiPickerBody className="body" id="body-1" />
        <EmojiPickerSearch className="search" data-part="search" />
        <EmojiPickerPreview className="preview" data-part="preview" />
      </EmojiPicker>,
    );
    await screen.findByRole('grid');
    const root = container.querySelector('.ui-emoji-picker') as HTMLElement;
    const parts = Array.from(root.querySelectorAll(':scope > [class*="ui-emoji-picker__"]'));
    expect(parts[0]).toHaveClass('ui-emoji-picker__skin-tones', 'tones');
    expect(parts[0]).toHaveAttribute('data-part', 'tones');
    expect(parts[1]).toHaveClass('ui-emoji-picker__categories', 'body');
    expect(parts[1]).toHaveAttribute('id', 'body-1');
    expect(parts[2]).toHaveClass('ui-emoji-picker__search', 'search');
    expect(parts[3]).toHaveClass('ui-emoji-picker__preview', 'preview');
    expect(root.querySelector('.ui-emoji-picker__footer')).toBeNull();
    expectHooksMatchSpec(container, 'EMOJI-PICKER', {
      slots: ['skin-tones', 'categories', 'search', 'preview'],
      callerAttributes: ['data-part'],
    });

    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    expect(container.querySelector('.ui-emoji-picker__section')).toHaveClass('body');
    const rows = within(screen.getByRole('grid', { name: 'Search results' })).getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    await userEvent.keyboard('{ArrowDown}');
    expect(rows[0]).toHaveFocus();
    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.keyboard('{Backspace}ban{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unicode: '🍌' }));
  });

  it('UIC-EMOJI-PICKER-6.1 puts the caller class on the message part while loading', () => {
    const { container } = render(
      <EmojiPicker loadEmoji={() => new Promise<readonly NativeEmoji[]>(() => {})}>
        <EmojiPickerBody className="body" />
      </EmojiPicker>,
    );
    expect(container.querySelector('.ui-emoji-picker__message')).toHaveClass('body');
    expect(() => render(<EmojiPickerSearch />)).toThrow('inside an EmojiPicker');
  });

  it('UIC-EMOJI-PICKER-6.2 reports the active emoji to a part of the caller', async () => {
    function Active() {
      const active = useActiveEmoji();
      if (!active) return <output>none</output>;
      return (
        <output>
          {active.kind === 'native'
            ? `${active.unicode} ${active.emoji.label}`
            : active.emoji.shortcode}
        </output>
      );
    }
    render(
      <EmojiPicker loadEmoji={loadFixture} recentEmoji={['👋']} skinTone="dark">
        <EmojiPickerBody />
        <Active />
      </EmojiPicker>,
    );
    await screen.findByRole('grid');
    expect(screen.getByText('none')).toBeInTheDocument();
    await userEvent.hover(screen.getByRole('row', { name: 'waving hand' }));
    expect(screen.getByText('👋🏿 waving hand')).toBeInTheDocument();
  });
});
