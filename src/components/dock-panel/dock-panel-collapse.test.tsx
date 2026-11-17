import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Frame,
  Panel,
  panelRoot as root,
  resizeFrame,
  stubFrames,
} from '../../../test/dock-panel-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';

beforeEach(() => {
  stubFrames();
  Element.prototype.scrollTo = () => {};
});

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error -- jsdom has no scrollTo; React Aria's sheet calls it.
  delete Element.prototype.scrollTo;
});

describe('DockPanel forced collapse', () => {
  it('UIC-DOCK-PANEL-3.6 stays collapsed below collapseBelow, its controls disabled, and expands again with room', async () => {
    const onExpandedChange = vi.fn();
    const storage = createMemoryStorage();
    const { container } = render(
      <UiProvider storage={storage}>
        <Frame>
          <Panel collapseBelow={800} persistKey="details" onExpandedChange={onExpandedChange} />
        </Frame>
      </UiProvider>,
    );
    resizeFrame(700, 500);
    const panel = root(container);
    expect(panel).toHaveAttribute('data-collapse-forced', 'true');
    expect(panel).not.toHaveAttribute('data-expanded');
    expect(panel.style.width).toBe('');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Expand Details' });
    expect(toggle).toBeDisabled();
    const people = screen.getByRole('button', { name: 'People' });
    expect(people).toBeDisabled();
    await userEvent.click(people);
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(storage.getItem('details:expanded')).toBeNull();
    resizeFrame(900, 500);
    expect(panel).toHaveAttribute('data-expanded', 'true');
    expect(panel).not.toHaveAttribute('data-collapse-forced');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('UIC-DOCK-PANEL-3.3 drops the collapsed separator when resizableWhileCollapsed is false', () => {
    const { rerender } = render(<Panel defaultExpanded={false} resizableWhileCollapsed={false} />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    rerender(<Panel defaultExpanded={false} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
