import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Orientation } from '../../core/props.js';
import { Cluster, Stack } from './layout.js';
import { ToolbarRow, ToolbarRowGroup, type ToolbarRowOverflow } from './toolbar-row.js';

// Presentation options never remount the children (UIC-LAYOUT-2.7, UIC-LAYOUT-3.8).

/** A draft field that counts its mounts. */
function Draft({ label, onMount }: { label: string; onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return <input aria-label={label} defaultValue="" />;
}

const field = (name: string) => screen.getByRole('textbox', { name });

describe('Layout child identity', () => {
  it.each([
    ['Stack', Stack],
    ['Cluster', Cluster],
  ] as const)(
    'UIC-LAYOUT-2.7 keeps the children of a %s while its dividers come and go',
    async (_, Layout) => {
      const user = userEvent.setup();
      const onMount = vi.fn();
      const tree = (divided: boolean, names: readonly string[]) => (
        <Layout divided={divided}>
          {names.map((name) => (
            <Draft key={name} label={name} onMount={onMount} />
          ))}
        </Layout>
      );
      const { container, rerender } = render(tree(false, ['First', 'Second']));
      await user.type(field('Second'), 'draft');
      const input = field('Second');
      rerender(tree(true, ['First', 'Second']));
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
      rerender(tree(true, ['Second', 'First']));
      expect(field('Second')).toBe(input);
      expect(container.firstElementChild?.firstElementChild).toBe(input);
      rerender(tree(false, ['Second', 'First']));
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
      expect(field('Second')).toBe(input);
      expect(input).toHaveValue('draft');
      expect(input).toHaveFocus();
      expect(onMount).toHaveBeenCalledTimes(2);
    },
  );

  it('UIC-LAYOUT-3.8 keeps the controls of a ToolbarRow across overflow modes and orientations', async () => {
    const user = userEvent.setup();
    const onMount = vi.fn();
    const tree = (overflow: ToolbarRowOverflow, orientation: Orientation, groups: string[]) => (
      <ToolbarRow aria-label="Tools" overflow={overflow} orientation={orientation}>
        {groups.map((name) => (
          <ToolbarRowGroup key={name} aria-label={name}>
            <Draft label={`${name} search`} onMount={onMount} />
          </ToolbarRowGroup>
        ))}
      </ToolbarRow>
    );
    const { container, rerender } = render(tree('wrap', 'horizontal', ['Find', 'Filter']));
    await user.type(field('Find search'), 'draft');
    const input = field('Find search');
    const steps: Array<[ToolbarRowOverflow, Orientation, string[]]> = [
      ['scroll', 'horizontal', ['Find', 'Filter']],
      ['scroll', 'horizontal', ['Filter', 'Find']],
      ['none', 'horizontal', ['Filter', 'Find']],
      ['scroll', 'vertical', ['Filter', 'Find']],
      ['scroll', 'horizontal', ['Find', 'Filter']],
      ['wrap', 'horizontal', ['Find', 'Filter']],
    ];
    for (const [overflow, orientation, groups] of steps) {
      rerender(tree(overflow, orientation, groups));
      expect(field('Find search')).toBe(input);
    }
    expect(container.querySelector('.ui-toolbar-row__scroll-button')).toBeNull();
    expect(input).toHaveValue('draft');
    expect(input).toHaveFocus();
    expect(onMount).toHaveBeenCalledTimes(2);
  });
});
