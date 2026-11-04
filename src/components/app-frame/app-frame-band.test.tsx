import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ToolbarRowGroup } from '../layout/toolbar-row.js';
import { ProjectionProvider } from '../projection/projection.js';
import { SaveStatus } from '../save-status/save-status.js';
import { AppFrame } from './app-frame.js';
import { AppFrameBand, AppFrameBandContent } from './app-frame-band.js';

const bandSlots = ['leading', 'status', 'tools', 'actions'];

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function FullBand() {
  return (
    <AppFrameBand
      aria-label="Recipe controls"
      leading={<span>Lemon tart</span>}
      status={<SaveStatus phase="saved" />}
      actions={<Button>Share</Button>}
    >
      <ToolbarRowGroup aria-label="Text">
        <Button>Bold</Button>
        <Button>Italic</Button>
      </ToolbarRowGroup>
    </AppFrameBand>
  );
}

describe('AppFrameBand', () => {
  it('UIC-APP-FRAME-2.1 draws its parts in a named group, leaving out empty ones', () => {
    const { container, rerender } = render(<FullBand />);
    const band = screen.getByRole('group', { name: 'Recipe controls' });
    expect(band).toBe(root(container));
    expect(band).toHaveClass('ui-app-frame-band');
    const slots = [...band.children].map((node) =>
      node.className.replace(/^.*ui-app-frame-band__([a-z]+).*$/, '$1'),
    );
    expect(slots).toEqual(bandSlots);
    expect(within(band).getByRole('group', { name: 'Actions' })).toHaveClass(
      'ui-app-frame-band__actions',
    );
    expect(within(band).getByRole('status')).toHaveTextContent('Saved');
    expectHooksMatchSpec(container, 'APP-FRAME', {
      slots: bandSlots.map((slot) => `ui-app-frame-band__${slot}`),
    });

    rerender(<AppFrameBand aria-label="Empty" leading={null} status="" />);
    expect(screen.getByRole('group', { name: 'Empty' })).toBeEmptyDOMElement();
  });

  it('UIC-APP-FRAME-2.1 UIC-APP-FRAME-2.2 names the tools and actions from props or strings', () => {
    const { rerender } = render(
      <AppFrameBand
        aria-label="Band"
        toolsLabel="Formatting"
        actionsLabel="Document actions"
        actions="A"
      >
        <Button>Bold</Button>
      </AppFrameBand>,
    );
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Document actions' })).toBeInTheDocument();
    rerender(
      <UiProvider messages={{ tools: 'Outils', actions: 'Actions du document' }}>
        <AppFrameBand aria-label="Band" actions="A">
          <Button>Bold</Button>
        </AppFrameBand>
      </UiProvider>,
    );
    expect(screen.getByRole('toolbar', { name: 'Outils' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Actions du document' })).toBeInTheDocument();
  });

  it('UIC-APP-FRAME-2.2 keeps the tools on one scrolling toolbar row', async () => {
    const user = userEvent.setup();
    const { container } = render(<FullBand />);
    const tools = container.querySelector('.ui-app-frame-band__tools');
    expect(tools).toHaveClass('ui-toolbar-row');
    expect(tools).toHaveAttribute('data-overflow', 'scroll');
    expect(tools).toHaveAttribute('data-justify', 'start');
    expect(tools).toHaveAttribute('data-wrap', 'nowrap');
    const toolbar = screen.getByRole('toolbar', { name: 'Tools' });
    expect(toolbar).toHaveClass('ui-toolbar-row__strip');
    expect(toolbar.parentElement).toBe(tools);
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
  });

  it('UIC-APP-FRAME-2.3 renders band content in place without a frame', () => {
    render(
      <ProjectionProvider>
        <AppFrameBandContent slot="actions">
          <Button>Loose action</Button>
        </AppFrameBandContent>
      </ProjectionProvider>,
    );
    expect(screen.getByRole('button', { name: 'Loose action' })).toBeInTheDocument();
  });

  it('UIC-APP-FRAME-2.3 fills the band from deep in the frame, keeping the page state', async () => {
    const user = userEvent.setup();
    function Section() {
      const [count, setCount] = useState(0);
      const [shown, setShown] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShown(!shown)}>
            Leave section
          </button>
          {shown ? (
            <>
              <AppFrameBandContent slot="leading">Pantry</AppFrameBandContent>
              <AppFrameBandContent slot="actions">
                <Button onPress={() => setCount(count + 1)}>Add jar {count}</Button>
              </AppFrameBandContent>
            </>
          ) : null}
          <AppFrameBandContent slot="status">
            <SaveStatus phase="dirty" />
          </AppFrameBandContent>
          <AppFrameBandContent slot="tools">
            <Button>Sort</Button>
          </AppFrameBandContent>
        </>
      );
    }
    render(
      <AppFrame topBar={<AppFrameBand aria-label="Section controls" leading="Home" />}>
        <Section />
      </AppFrame>,
    );
    const band = screen.getByRole('group', { name: 'Section controls' });
    expect(band.querySelector('.ui-app-frame-band__leading')).toHaveTextContent('Pantry');
    expect(within(band).getByRole('status')).toHaveTextContent('Unsaved changes');
    expect(within(band).getByRole('toolbar', { name: 'Tools' })).toHaveTextContent('Sort');
    await user.click(within(band).getByRole('button', { name: 'Add jar 0' }));
    expect(within(band).getByRole('button', { name: 'Add jar 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave section' }));
    expect(band.querySelector('.ui-app-frame-band__leading')).toHaveTextContent('Home');
    expect(band.querySelector('.ui-app-frame-band__actions')).toBeNull();
  });

  it('UIC-APP-FRAME-2.4 forwards the class, id and data attributes', () => {
    const { container } = render(
      <AppFrameBand
        aria-label="Band"
        className="extra"
        id="band"
        data-area="notes"
        leading="Notes"
      />,
    );
    expect(root(container)).toHaveClass('ui-app-frame-band', 'extra');
    expect(root(container)).toHaveAttribute('id', 'band');
    expect(root(container)).toHaveAttribute('data-area', 'notes');
    expectHooksMatchSpec(container, 'APP-FRAME', { callerAttributes: ['data-area'] });
  });
});
