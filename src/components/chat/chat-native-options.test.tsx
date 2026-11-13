import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { article, assistantPeople, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { ChatProps } from './chat.js';

installEditorDom();
const platformChoice = vi.hoisted(() => ({ value: 'windows' as 'mac' | 'windows' }));
vi.mock(import('../shortcut/shortcut-format.js'), async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getShortcutPlatform: () => platformChoice.value,
    formatAriaKeyShortcuts: (chord: Parameters<typeof original.formatAriaKeyShortcuts>[0]) =>
      original.formatAriaKeyShortcuts(chord, platformChoice.value),
  };
});
afterEach(() => vi.restoreAllMocks());

const box = () => screen.getByRole('textbox', { name: 'Message' });

describe('Chat native presentation and hints', () => {
  it('UIC-CHAT-4.2 UIC-CHAT-5.2 hides decorative identity and spinner without losing text, busy state or search', () => {
    const props: Partial<ChatProps> = {
      participants: assistantPeople,
      title: 'Notes',
      showSearch: true,
      messages: [
        message('thinking', 'helper', {
          parts: [],
          status: 'streaming',
          statusText: 'Checking items',
        }),
      ],
      thinkingUntil: 'content',
      thinkingIcon: null,
      showHeaderIdentity: false,
    };
    const { container, rerenderWith } = renderChat(props);
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search this conversation' })).toBeInTheDocument();
    expect(article('thinking')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-chat-status-line__text')).toHaveTextContent(
      'Checking items',
    );
    expect(container.querySelector('.ui-chat-status-line__spinner')).toBeNull();
    expect(container.querySelector('.ui-chat-header__avatar')).toBeNull();
    rerenderWith({ ...props, thinkingIcon: undefined, showHeaderIdentity: undefined });
    expect(container.querySelector('.ui-chat-status-line__spinner')).not.toBeNull();
    expect(container.querySelector('.ui-chat-header__avatar')).not.toBeNull();
  });

  it.each([
    [{}, 'Enter to send'],
    [{ isPending: true, onQueueChange: vi.fn() }, 'Enter to queue'],
    [
      { isPending: true, onQueueChange: vi.fn(), onSendNow: vi.fn(), steersWhilePending: true },
      'Enter to steer',
    ],
    [{ sendsWithModifier: true }, 'Control Enter to send'],
    [{ shortcuts: { send: 'Alt+Enter' } }, 'Alt Enter to send'],
    [{ isPending: true }, ''],
    [{ isDisabled: true }, ''],
  ] as const)(
    'UIC-CHAT-3.15 derives localized hints from the effective configuration %j',
    (options, hint) => {
      renderChat({ ...options, placeholder: (value) => `Write · ${value.text}` });
      expect(box().querySelector('[data-placeholder]')).toHaveAttribute(
        'data-placeholder',
        `Write · ${hint}`,
      );
    },
  );

  it('UIC-CHAT-3.15 uses Command on macOS and the save mode while editing', async () => {
    platformChoice.value = 'mac';
    const placeholder = vi.fn(
      (hint: Parameters<Exclude<ChatProps['placeholder'], string | undefined>>[0]) => hint.text,
    );
    const { user } = renderChat({ sendsWithModifier: true, placeholder });
    expect(box().querySelector('[data-placeholder]')).toHaveAttribute(
      'data-placeholder',
      'Command Enter to send',
    );
    await user.hover(article('m2'));
    await user.click(within(article('m2')).getByRole('button', { name: 'Edit' }));
    expect(box().querySelector('[data-placeholder]')).toBeNull();
    expect(placeholder).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'save',
        shortcut: 'Command Enter',
        text: 'Command Enter to save',
      }),
    );
  });
});
