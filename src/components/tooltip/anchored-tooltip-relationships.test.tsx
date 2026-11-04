import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useRef, useState, type RefObject } from 'react';
import { describe, expect, it } from 'vitest';
import { AnchoredTooltip, type AnchoredTooltipProps } from './tooltip.js';

const modes = [
  { relationship: 'description', attribute: 'aria-describedby' },
  { relationship: 'label', attribute: 'aria-labelledby' },
] as const;

function HostAnchor({
  anchor,
  attribute,
}: {
  anchor: RefObject<HTMLButtonElement | null>;
  attribute: string;
}) {
  const [context, setContext] = useState('first');
  return (
    <>
      <span id="first">First</span>
      <span id="second">Second</span>
      <span id="extra">Extra</span>
      <button ref={anchor} type="button" {...{ [attribute]: context }}>
        Anchor
      </button>
      <button
        type="button"
        onClick={() => setContext(context === 'first' ? 'second' : 'extra second')}
      >
        Update context
      </button>
    </>
  );
}

function HostHint({
  relationship = 'description',
  isMounted = true,
  ...props
}: Partial<Omit<AnchoredTooltipProps, 'anchor' | 'content'>> & { isMounted?: boolean }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const attribute = relationship === 'label' ? 'aria-labelledby' : 'aria-describedby';
  return (
    <>
      <HostAnchor anchor={anchor} attribute={attribute} />
      {isMounted ? (
        <AnchoredTooltip
          isOpen
          id="hint"
          {...props}
          relationship={relationship}
          anchor={anchor}
          content="Hint"
        />
      ) : null}
    </>
  );
}

describe.each(modes)(
  'AnchoredTooltip $relationship relationship',
  ({ relationship, attribute }) => {
    it('UIC-TOOLTIP-2.3 maintains the relationship through independent host commits', async () => {
      const user = userEvent.setup();
      render(<HostHint relationship={relationship} />);
      const anchor = screen.getByRole('button', {
        name: relationship === 'label' ? 'First Hint' : 'Anchor',
      });
      const panel = screen.getByRole('tooltip');
      expect(anchor).toHaveAttribute(attribute, 'first hint');
      for (const [tokens, text] of [
        ['second', 'Second'],
        ['extra second', 'Extra Second'],
      ]) {
        await user.click(screen.getByRole('button', { name: 'Update context' }));
        await waitFor(() => expect(anchor).toHaveAttribute(attribute, `${tokens} hint`));
        if (relationship === 'label') expect(anchor).toHaveAccessibleName(`${text} Hint`);
        else expect(anchor).toHaveAccessibleDescription(`${text} Hint`);
        expect(screen.getByRole('tooltip')).toBe(panel);
        expect(panel).toHaveAttribute('id', 'hint');
      }
    });

    it('UIC-TOOLTIP-2.3 restores externally replaced, empty and removed attributes', async () => {
      render(<HostHint relationship={relationship} />);
      const anchor = screen.getByRole('button', {
        name: relationship === 'label' ? 'First Hint' : 'Anchor',
      });
      for (const value of ['second', 'extra\tsecond', '', null]) {
        act(() => {
          if (value === null) anchor.removeAttribute(attribute);
          else anchor.setAttribute(attribute, value);
        });
        const expected = value ? `${value.split(/\s+/).join(' ')} hint` : 'hint';
        await waitFor(() => expect(anchor).toHaveAttribute(attribute, expected));
      }
      if (relationship === 'label') expect(anchor).toHaveAccessibleName('Hint');
      else expect(anchor).toHaveAccessibleDescription('Hint');
    });

    it('UIC-TOOLTIP-2.3 leaves a host update containing the hint unchanged and settles', async () => {
      render(<HostHint relationship={relationship} />);
      const anchor = screen.getByRole('button', {
        name: relationship === 'label' ? 'First Hint' : 'Anchor',
      });
      const mutations: MutationRecord[] = [];
      const observer = new MutationObserver((records) => mutations.push(...records));
      observer.observe(anchor, { attributes: true, attributeFilter: [attribute] });
      try {
        await act(async () => {
          anchor.setAttribute(attribute, 'second');
        });
        expect(anchor).toHaveAttribute(attribute, 'second hint');
        expect(mutations).toHaveLength(2);
        await act(async () => {
          anchor.setAttribute(attribute, 'extra\t hint second');
        });
        expect(anchor).toHaveAttribute(attribute, 'extra\t hint second');
        expect(mutations).toHaveLength(3);
        await act(async () => {
          anchor.setAttribute('title', 'Updated context');
        });
        expect(mutations).toHaveLength(3);
      } finally {
        observer.disconnect();
      }
    });

    it.each(['close', 'unmount'] as const)(
      'UIC-TOOLTIP-2.3 UIC-TOOLTIP-2.4 preserves current host tokens on %s',
      async (release) => {
        const { rerender } = render(<HostHint relationship={relationship} />);
        const anchor = screen.getByRole('button', {
          name: relationship === 'label' ? 'First Hint' : 'Anchor',
        });
        act(() => anchor.setAttribute(attribute, 'second extra'));
        await waitFor(() => expect(anchor).toHaveAttribute(attribute, 'second extra hint'));
        rerender(
          <HostHint relationship={relationship} isOpen={false} isMounted={release !== 'unmount'} />,
        );
        expect(anchor).toHaveAttribute(attribute, 'second extra');
        await act(async () => anchor.setAttribute(attribute, 'extra'));
        expect(anchor).toHaveAttribute(attribute, 'extra');
      },
    );

    it.each(['close', 'unmount'] as const)(
      'UIC-TOOLTIP-2.3 UIC-TOOLTIP-2.4 releases pending host updates on %s',
      async (release) => {
        const { rerender } = render(<HostHint relationship={relationship} />);
        const anchor = screen.getByRole('button', {
          name: relationship === 'label' ? 'First Hint' : 'Anchor',
        });
        // Release in the same task, before MutationObserver delivers the host's update.
        act(() => anchor.setAttribute(attribute, '\textra  second '));
        rerender(
          <HostHint relationship={relationship} isOpen={false} isMounted={release !== 'unmount'} />,
        );
        await act(async () => {
          anchor.setAttribute('title', 'Released');
        });
        expect(anchor).toHaveAttribute(attribute, '\textra  second ');
      },
    );

    it('UIC-TOOLTIP-2.3 removes an empty relationship on close without restoring it', async () => {
      const { rerender } = render(<HostHint relationship={relationship} />);
      const anchor = screen.getByRole('button', {
        name: relationship === 'label' ? 'First Hint' : 'Anchor',
      });
      act(() => anchor.removeAttribute(attribute));
      await waitFor(() => expect(anchor).toHaveAttribute(attribute, 'hint'));
      rerender(<HostHint relationship={relationship} isOpen={false} />);
      expect(anchor).not.toHaveAttribute(attribute);
      await act(async () => anchor.setAttribute(attribute, 'second'));
      expect(anchor).toHaveAttribute(attribute, 'second');
    });
  },
);

it('UIC-TOOLTIP-2.3 UIC-TOOLTIP-2.4 releases the previous ID and relationship mode', async () => {
  const anchorRef = createRef<HTMLButtonElement>();
  render(<HostAnchor anchor={anchorRef} attribute="aria-describedby" />);
  const props = { isOpen: true, anchor: anchorRef, id: 'hint', content: 'Hint' };
  const { rerender } = render(<AnchoredTooltip {...props} />);
  const anchor = screen.getByRole('button', { name: 'Anchor' });
  act(() => anchor.setAttribute('aria-describedby', 'second hint'));
  rerender(<AnchoredTooltip {...props} id="replacement" />);
  expect(anchor).toHaveAttribute('aria-describedby', 'second replacement');
  await act(async () => anchor.setAttribute('aria-describedby', 'extra'));
  expect(anchor).toHaveAttribute('aria-describedby', 'extra replacement');
  act(() => anchor.setAttribute('aria-labelledby', 'first'));
  rerender(<AnchoredTooltip {...props} id="replacement" relationship="label" />);
  expect(anchor).toHaveAttribute('aria-describedby', 'extra');
  expect(anchor).toHaveAttribute('aria-labelledby', 'first replacement');
  await act(async () => anchor.setAttribute('aria-describedby', 'second'));
  expect(anchor).toHaveAttribute('aria-describedby', 'second');
  rerender(<AnchoredTooltip {...props} id="replacement" relationship="none" />);
  expect(anchor).toHaveAttribute('aria-labelledby', 'first');
  await act(async () => anchor.setAttribute('aria-labelledby', 'extra'));
  expect(anchor).toHaveAttribute('aria-labelledby', 'extra');
});
