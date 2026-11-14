import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Card } from '../card/card.js';
import { Tag, TagGroup } from '../tag-group/tag-group.js';
import { HoverCard, HoverCardTrigger } from './hover-card.js';
import { PreviewTrigger } from './preview-trigger.js';

describe.each([
  { removable: true, identity: false },
  { removable: false, identity: false },
  { removable: true, identity: true },
  { removable: false, identity: true },
])('Preview in tags with removal $removable and identity $identity', ({ removable, identity }) => {
  it('UIC-HOVER-CARD-3.1 UIC-HOVER-CARD-4.3 preserves preview interaction independently of tag removal', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(
      <>
        <Button>Outside</Button>
        <TagGroup aria-label="Labels" onRemove={removable ? onRemove : undefined}>
          <Tag id="alpha" textValue="Alpha">
            {identity ? (
              <PreviewTrigger
                trigger="hover"
                delay={0}
                closeDelay={0}
                previewLabel="About Alpha"
                preview={<Card title="Alpha" />}
              >
                Alpha
              </PreviewTrigger>
            ) : (
              <HoverCardTrigger delay={0} closeDelay={0}>
                <Button>Alpha</Button>
                <HoverCard aria-label="About Alpha">
                  <p>First letter.</p>
                </HoverCard>
              </HoverCardTrigger>
            )}
          </Tag>
        </TagGroup>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Alpha' });
    await user.pointer([
      { target: document.body, coords: { clientX: 1, clientY: 1 } },
      { target: trigger },
    ]);
    const card = await screen.findByRole('dialog', { name: 'About Alpha' });
    expect(container).not.toContainElement(card);
    if (!identity) expectHooksMatchSpec(card, 'HOVER-CARD');
    await user.click(trigger);
    expect(onRemove).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'About Alpha' })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    await user.tab();
    act(() => trigger.focus());
    await screen.findByRole('dialog', { name: 'About Alpha' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'About Alpha' })).not.toBeInTheDocument(),
    );
    if (removable) {
      await user.click(screen.getByRole('button', { name: /Remove/ }));
      expect(onRemove).toHaveBeenCalledWith(new Set(['alpha']));
    } else {
      await user.keyboard('{Delete}');
      expect(onRemove).not.toHaveBeenCalled();
      expect(screen.getByRole('row', { name: /Alpha/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    }
  });
});
