import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../../core/provider.js';
import { createMemoryStorage } from '../../../core/storage.js';
import type { RecordLabelResolver } from '../../record-label/record-label.js';
import { MessageComposerMenuButton } from '../composer-menu.js';
import type { MessageComposerMessage } from '../composer-message.js';
import { RichMessageComposer, type RichMessageComposerProps } from './rich-message-composer.js';

installEditorDom();

const tripId = '7c2e4f10-9b1a-4d3e-8f6a-2b5c1d0e9a47';
const noteId = '19af6c3d-2e8b-4a7f-b1d0-5c9e3f2a6b81';

const trip = { kind: 'reference', id: tripId, label: 'TRIP-4', recordType: 'itinerary' } as const;
const note = { kind: 'reference', id: noteId, label: 'NOTE-12', recordType: 'note' } as const;

const text = 'Please review TRIP-4 and NOTE-12 first';

const draft: MessageComposerMessage = {
  text,
  tokens: [
    { start: 14, end: 20, ...trip },
    { start: 25, end: 32, ...note },
  ],
};

/** The host's lookup: the trip is shown with its name and link, the note is gone. */
const getReference = vi.fn<RecordLabelResolver>((reference) =>
  reference.id === tripId
    ? { name: 'Lisbon weekend', href: '/trips/4', type: 'Itinerary' }
    : { unavailable: 'missing' },
);

const box = () => screen.getByRole('textbox', { name: 'Message' });
const chips = () => [
  ...box().querySelectorAll('.ui-message-composer__pill[data-kind="reference"]'),
];

/** A rich composer whose menu inserts the trip and the note as references. */
function renderComposer(props: Partial<RichMessageComposerProps> = {}) {
  const onSubmit = vi.fn<(message: MessageComposerMessage) => void | Promise<unknown>>();
  const user = userEvent.setup();
  const view = render(
    <RichMessageComposer
      getReference={getReference}
      onSubmit={onSubmit}
      startControls={
        <MessageComposerMenuButton
          sections={[
            {
              id: 'references',
              title: 'References',
              items: [trip, note].map((token) => ({
                id: token.label,
                label: `Reference ${token.label}`,
                onAction: (composer) => composer.insertPill(token),
              })),
            },
          ]}
        />
      }
      {...props}
    />,
  );
  const choose = async (name: string) => {
    await user.click(screen.getByRole('button', { name: 'Add and more' }));
    await user.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name }));
    await waitFor(() => expect(box()).toHaveFocus());
  };
  return { ...view, user, onSubmit, choose };
}

describe('RichMessageComposer references', () => {
  it('UIC-MESSAGE-COMPOSER-4.9 UIC-RECORD-LABEL-3.2 draws each reference as a record chip from the host lookup by id', () => {
    renderComposer({ defaultValue: draft });
    const [first, second] = chips();
    expect(getReference).toHaveBeenCalledWith({
      id: tripId,
      label: 'TRIP-4',
      recordType: 'itinerary',
    });
    expect(first).toHaveAttribute('contenteditable', 'false');
    expect(within(first as HTMLElement).getByRole('link')).toHaveAttribute('href', '/trips/4');
    expect(first).toHaveTextContent('TRIP-4 Lisbon weekend Itinerary');
    expect(second?.querySelector('.ui-record-label')).toHaveAttribute(
      'data-unavailable',
      'missing',
    );
    expect(box()).toHaveTextContent(/^Please review TRIP-4.* and Missing item first$/);
  });

  it('UIC-MESSAGE-COMPOSER-4.9 shows only the label without a lookup, and no remove button while disabled', () => {
    renderComposer({ defaultValue: draft, getReference: undefined, isDisabled: true });
    expect(chips().map((chip) => chip.textContent)).toEqual(['TRIP-4', 'NOTE-12']);
    expect(screen.queryByRole('button', { name: 'Remove TRIP-4' })).not.toBeInTheDocument();
  });

  it('UIC-MESSAGE-COMPOSER-4.9 UIC-MESSAGE-COMPOSER-5.3 sends references among words and on their own', async () => {
    const { user, onSubmit, choose } = renderComposer();
    await user.click(box());
    await user.keyboard('Please review ');
    await choose('Reference TRIP-4');
    await choose('Reference NOTE-12');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith({
      text: 'Please review TRIP-4 NOTE-12 ',
      tokens: [
        { start: 14, end: 20, ...trip },
        { start: 21, end: 28, ...note },
      ],
    });
    await choose('Reference NOTE-12');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith({
      text: 'NOTE-12 ',
      tokens: [{ start: 0, end: 7, ...note }],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.9 UIC-MESSAGE-COMPOSER-4.3 removes a reference with its button or Backspace, and Ctrl+Z brings it back', async () => {
    const { user, onSubmit } = renderComposer({
      defaultValue: { text: 'See TRIP-4', tokens: [{ start: 4, end: 10, ...trip }] },
    });
    await user.click(screen.getByRole('button', { name: 'Remove TRIP-4' }));
    expect(chips()).toHaveLength(0);
    expect(box()).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(chips()).toHaveLength(1);
    await user.keyboard('{Backspace}');
    expect(chips()).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('TRIP-4 removed');
    await user.keyboard('{Control>}z{/Control}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'See TRIP-4',
      tokens: [{ start: 4, end: 10, ...trip }],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.9 inserts a reference as its label in a code block', async () => {
    const { user, onSubmit, choose } = renderComposer();
    await user.click(box());
    await user.keyboard('```');
    await choose('Reference TRIP-4');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith({ text: '```\nTRIP-4 \n```', tokens: [] });
  });

  it('UIC-MESSAGE-COMPOSER-4.9 keeps the references when the host refuses the message', async () => {
    const onSubmitError = vi.fn();
    const { user, onSubmit } = renderComposer({ defaultValue: draft, onSubmitError });
    onSubmit.mockRejectedValueOnce(new Error('refused'));
    await user.click(box());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onSubmitError).toHaveBeenCalled());
    expect(chips()).toHaveLength(2);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith(draft);
  });

  it('UIC-MESSAGE-COMPOSER-4.9 keeps the references in the stored draft and ignores a stored token it cannot trust', async () => {
    const storage = createMemoryStorage();
    const user = userEvent.setup();
    const { unmount } = render(
      <UiProvider storage={storage}>
        <RichMessageComposer persistKey="draft" defaultValue={draft} />
      </UiProvider>,
    );
    // Focus from the keyboard keeps the caret where the composer put it: at the end.
    await user.tab();
    await user.keyboard('!');
    expect(JSON.parse(storage.getItem('draft') ?? '')).toEqual({ ...draft, text: `${text}!` });
    unmount();
    const { unmount: unmountRestored } = render(
      <UiProvider storage={storage}>
        <RichMessageComposer persistKey="draft" getReference={getReference} />
      </UiProvider>,
    );
    expect(
      chips().map((chip) => chip.querySelector('.ui-record-label__identifier')?.textContent),
    ).toEqual(['TRIP-4', 'Missing item']);
    unmountRestored();
    const unsafe = { ...draft, tokens: [{ ...draft.tokens[0], recordType: { html: '<b>x</b>' } }] };
    storage.setItem('draft', JSON.stringify(unsafe));
    render(
      <UiProvider storage={storage}>
        <RichMessageComposer persistKey="draft" />
      </UiProvider>,
    );
    expect(box()).toHaveTextContent('');
  });
});
