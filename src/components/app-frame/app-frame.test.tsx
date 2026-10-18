import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
} from '../projection/projection.js';
import { AppFrame, AppFrameContent } from './app-frame.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function FullFrame(props: { isEmbedded?: boolean }) {
  return (
    <AppFrame
      {...props}
      label="Workspace"
      topBar={<span>Top</span>}
      navigation={<span>Places</span>}
      startPanel={<span>Outline</span>}
      endPanel={<span>Details</span>}
      bottomPanel={<span>Console</span>}
      statusBar={<span>Ready</span>}
    >
      <p>Report body</p>
    </AppFrame>
  );
}

const slotOrder = [
  'skip-link',
  'top-bar',
  'navigation',
  'start-panel',
  'main',
  'bottom-panel',
  'end-panel',
  'status-bar',
];

describe('AppFrame', () => {
  it('UIC-APP-FRAME-1.1 renders its regions in reading order and leaves out empty ones', () => {
    const { container, rerender } = render(<FullFrame />);
    const frame = root(container);
    expect(frame).toHaveClass('ui-app-frame');
    const slots = [...frame.querySelectorAll('[class*="ui-app-frame__"]')].map((node) =>
      node.className.replace(/^.*ui-app-frame__([a-z-]+).*$/, '$1'),
    );
    expect(slots).toEqual(slotOrder);
    expectHooksMatchSpec(container, 'APP-FRAME', { slots: slotOrder });

    rerender(
      <AppFrame topBar={null} startPanel={false} endPanel="" statusBar={undefined}>
        Body
      </AppFrame>,
    );
    expect(container.querySelector('.ui-app-frame__top-bar')).toBeNull();
    expect(container.querySelector('.ui-app-frame__start-panel')).toBeNull();
    expect(container.querySelector('.ui-app-frame__end-panel')).toBeNull();
    expect(container.querySelector('.ui-app-frame__main')).toHaveTextContent('Body');
  });

  it('UIC-APP-FRAME-1.2 UIC-APP-FRAME-3.1 draws the regions of a page frame as landmarks', () => {
    render(<FullFrame />);
    expect(screen.getByRole('banner')).toHaveTextContent('Top');
    expect(screen.getByRole('main')).toHaveTextContent('Report body');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Ready');
    expect(screen.getByRole('complementary', { name: 'Start panel' })).toHaveTextContent('Outline');
    expect(screen.getByRole('complementary', { name: 'End panel' })).toHaveTextContent('Details');
    expect(screen.getByRole('complementary', { name: 'Bottom panel' })).toHaveTextContent(
      'Console',
    );
    expect(screen.getByText('Places').parentElement?.tagName).toBe('DIV');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('UIC-APP-FRAME-1.2 names the main region and panels from labels and provider strings', () => {
    render(
      <UiProvider strings={{ appFramePanel: (panel) => `Panneau ${panel}` }}>
        <AppFrame
          labels={{ main: 'Editor', 'end-panel': 'Comments' }}
          startPanel="Outline"
          endPanel="Threads"
        >
          Body
        </AppFrame>
      </UiProvider>,
    );
    expect(screen.getByRole('main', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Comments' })).toHaveTextContent('Threads');
    expect(screen.getByRole('complementary', { name: 'Panneau start' })).toBeInTheDocument();
  });

  it('UIC-APP-FRAME-1.3 UIC-APP-FRAME-3.1 skips to the main content without changing the address', async () => {
    const user = userEvent.setup();
    const address = window.location.href;
    render(<FullFrame />);
    const main = screen.getByRole('main');
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveClass('ui-app-frame__skip-link');
    expect(link.parentElement).toHaveClass('ui-visually-hidden');
    expect(link).toHaveAttribute('href', `#${main.id}`);
    expect(main).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(link).toHaveFocus();
    expect(link.parentElement).toHaveAttribute('data-focus-within', 'true');
    await user.keyboard('{Enter}');
    expect(main).toHaveFocus();
    expect(window.location.href).toBe(address);
  });

  it('UIC-APP-FRAME-1.4 draws no landmarks when embedded', async () => {
    const user = userEvent.setup();
    const { container } = render(<FullFrame isEmbedded />);
    const frame = root(container);
    expect(frame).toHaveAttribute('data-embedded', 'true');
    expect(screen.getByRole('group', { name: 'Workspace' })).toBe(frame);
    for (const role of ['banner', 'main', 'contentinfo', 'complementary']) {
      expect(screen.queryByRole(role)).not.toBeInTheDocument();
    }
    for (const slot of slotOrder.slice(1)) {
      const region = frame.querySelector(`.ui-app-frame__${slot}`);
      expect(region?.tagName).toBe('DIV');
      expect(region).not.toHaveAttribute('aria-label');
    }
    expectHooksMatchSpec(container, 'APP-FRAME', { slots: slotOrder });
    await user.click(screen.getByRole('link', { name: 'Skip to main content' }));
    expect(frame.querySelector('.ui-app-frame__main')).toHaveFocus();
  });

  it('UIC-APP-FRAME-1.5 fills regions from below and restores their own content', async () => {
    const user = userEvent.setup();
    function Page() {
      const [count, setCount] = useState(0);
      const [shown, setShown] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShown(!shown)}>
            Toggle
          </button>
          {shown ? (
            <AppFrameContent region="end-panel">
              <button type="button" onClick={() => setCount(count + 1)}>
                Pears {count}
              </button>
            </AppFrameContent>
          ) : null}
          <AppFrameContent region="status-bar">Saved</AppFrameContent>
        </>
      );
    }
    render(
      <AppFrame endPanel="Default details">
        <Page />
      </AppFrame>,
    );
    const panel = screen.getByRole('complementary', { name: 'End panel' });
    expect(within(panel).getByRole('button', { name: 'Pears 0' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pears 0' }));
    expect(within(panel).getByRole('button', { name: 'Pears 1' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Saved');
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByRole('complementary', { name: 'End panel' })).toHaveTextContent(
      'Default details',
    );
    expect(screen.getByRole('main')).not.toHaveTextContent('Pears');
  });

  it('UIC-APP-FRAME-1.5 keeps other slots on the outer provider and nested frames apart', () => {
    render(
      <ProjectionProvider>
        <div data-testid="host-outlet">
          <ProjectionOutlet slot="host-tools" />
        </div>
        <AppFrame data-testid="outer">
          <AppFrameContent region="start-panel">Outer outline</AppFrameContent>
          <AppFrame isEmbedded data-testid="inner">
            <AppFrameContent region="start-panel">Inner outline</AppFrameContent>
            <ProjectionContent slot="host-tools">Ruler</ProjectionContent>
          </AppFrame>
        </AppFrame>
      </ProjectionProvider>,
    );
    expect(screen.getByTestId('host-outlet')).toHaveTextContent('Ruler');
    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    expect(outer.querySelector(':scope > .ui-app-frame__start-panel')).toHaveTextContent(
      'Outer outline',
    );
    expect(inner.querySelector(':scope > .ui-app-frame__start-panel')).toHaveTextContent(
      'Inner outline',
    );
  });

  it('UIC-APP-FRAME-1.5 renders content in place without a frame', () => {
    render(<AppFrameContent region="top-bar">Loose</AppFrameContent>);
    expect(screen.getByText('Loose')).toBeInTheDocument();
  });

  it('UIC-APP-FRAME-1.6 forwards the class, id and data attributes', () => {
    const { container } = render(
      <AppFrame className="extra" id="frame" data-app="notes">
        Body
      </AppFrame>,
    );
    expect(root(container)).toHaveClass('ui-app-frame', 'extra');
    expect(root(container)).toHaveAttribute('id', 'frame');
    expect(root(container)).toHaveAttribute('data-app', 'notes');
    expect(root(container)).not.toHaveAttribute('data-embedded');
    expectHooksMatchSpec(container, 'APP-FRAME', { callerAttributes: ['data-app'] });
  });
});
