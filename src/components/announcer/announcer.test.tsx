import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { REANNOUNCE_MARK } from '../../utils/reannounce.js';
import { Button } from '../button/button.js';
import { type AnnounceOptions, Announcer, useAnnounce } from './announcer.js';

function Saver({ text, options }: { text: string; options?: AnnounceOptions }) {
  const announce = useAnnounce();
  return <Button onPress={() => announce(text, options)}>Announce {text}</Button>;
}

describe('Announcer', () => {
  it('UIC-ANNOUNCER-1.1 renders a polite and an assertive live region, hidden from view', () => {
    const { container } = render(
      <Announcer className="page-announcer" data-area="editor" id="announcer">
        <p>Body</p>
      </Announcer>,
    );
    const root = container.querySelector('.ui-announcer');
    expect(root).toHaveClass('ui-visually-hidden', 'page-announcer');
    expect(root).toHaveAttribute('data-area', 'editor');
    expect(root).toHaveAttribute('id', 'announcer');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Body')).toBeVisible();
    expectHooksMatchSpec(container, 'ANNOUNCER', {
      slots: ['polite', 'assertive'],
      callerAttributes: ['data-area'],
    });
  });

  it('UIC-ANNOUNCER-1.2 reads text through the region its politeness names', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Saver text="Saved" />
        <Saver text="Connection lost" options={{ politeness: 'assertive' }} />
      </Announcer>,
    );
    await user.click(screen.getByRole('button', { name: 'Announce Saved' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Announce Connection lost' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('UIC-ANNOUNCER-1.3 changes the region again for repeated text', async () => {
    const user = userEvent.setup();
    render(
      <Announcer>
        <Saver text="Saved" />
      </Announcer>,
    );
    const button = screen.getByRole('button', { name: 'Announce Saved' });
    await user.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/);
    await user.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(new RegExp(`^Saved${REANNOUNCE_MARK}$`));
    await user.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/);
  });

  it('UIC-ANNOUNCER-1.4 serves the nearest announcer and does nothing outside one', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Saver text="Nowhere" />
        <Announcer data-scope="outer">
          <Saver text="Outer" />
          <Announcer data-scope="inner">
            <Saver text="Inner" />
          </Announcer>
        </Announcer>
      </>,
    );
    const region = (scope: string) =>
      container.querySelector(`[data-scope="${scope}"] .ui-announcer__polite`);
    await user.click(screen.getByRole('button', { name: 'Announce Inner' }));
    expect(region('inner')).toHaveTextContent('Inner');
    expect(region('outer')).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Announce Outer' }));
    expect(region('outer')).toHaveTextContent('Outer');
    expect(region('inner')).toHaveTextContent('Inner');
    await user.click(screen.getByRole('button', { name: 'Announce Nowhere' }));
    for (const live of container.querySelectorAll('.ui-announcer__polite')) {
      expect(live).not.toHaveTextContent('Nowhere');
    }
  });
});
