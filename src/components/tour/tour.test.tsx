import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type Ref, useImperativeHandle, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { Tour, type TourProps, type TourStep } from './tour.js';
import { resolveTourTarget } from './use-tour-target.js';

const searchRef = createRef<HTMLInputElement>();

const steps: TourStep[] = [
  { target: searchRef, title: 'Search', content: 'Find any recipe by name.' },
  { target: '#filters', title: 'Filters', content: 'Narrow the list.', placement: 'right' },
  { target: '[data-tour="share"]', title: 'Share', content: 'Send a list to a friend.' },
];

function Page(props: Partial<TourProps>) {
  return (
    <div>
      <input ref={searchRef} aria-label="Search recipes" />
      <button type="button" id="filters">
        Filters
      </button>
      <button type="button" data-tour="share">
        Share
      </button>
      <Tour steps={steps} defaultOpen {...props} />
    </div>
  );
}

function dialog() {
  return screen.getByRole('dialog');
}

describe('Tour', () => {
  it('UIC-TOUR-1.1 shows the first step against its target with a spotlight', async () => {
    render(<Page />);
    const step = await screen.findByRole('dialog', { name: 'Search' });
    expect(step).toHaveClass('ui-tour__dialog');
    expect(step.closest('.ui-tour')).toHaveAttribute('data-placement', 'bottom');
    expect(within(step).getByText('Find any recipe by name.')).toHaveClass('ui-tour__body');
    expect(within(step).getByText('1 of 3')).toHaveClass('ui-tour__progress');
    const spotlight = document.querySelector('.ui-tour__spotlight') as HTMLElement;
    expect(spotlight).toHaveAttribute('aria-hidden', 'true');
    expect(spotlight.style.position).toBe('fixed');
    expect(spotlight.style.pointerEvents).toBe('none');
    expect(spotlight).not.toHaveAttribute('data-target-missing');
    expectHooksMatchSpec(document.body, 'TOUR', {
      slots: [
        'spotlight',
        'dialog',
        'header',
        'title',
        'progress',
        'body',
        'footer',
        'skip',
        'next',
        'arrow',
      ],
    });
  });

  it('UIC-TOUR-1.2 resolves refs and selectors, and centres a step whose target is missing', async () => {
    const user = userEvent.setup();
    render(
      <Page
        steps={[
          { target: '#nowhere', title: 'Welcome' },
          { target: '[[invalid', title: 'Still here' },
        ]}
      />,
    );
    await screen.findByRole('dialog', { name: 'Welcome' });
    expect(document.querySelector('.ui-tour__spotlight')).toHaveAttribute(
      'data-target-missing',
      'true',
    );
    expect(document.querySelector('.ui-tour__arrow')).toBeNull();
    expect(document.querySelector('.ui-tour__body')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('dialog', { name: 'Still here' })).toBeInTheDocument();
    expect(resolveTourTarget(searchRef)).toBe(searchRef.current);
    expect(resolveTourTarget('#filters')).toBe(
      screen.getByRole('button', { name: 'Filters', hidden: true }),
    );
    expect(resolveTourTarget(undefined)).toBeNull();
  });

  it('UIC-TOUR-1.2 follows a ref target that is replaced or removed while its step shows', async () => {
    const saveRef = createRef<HTMLButtonElement>();
    const replacing = createRef<{ setVersion: (version: string | null) => void }>();
    function Replacing({ ref }: { ref: Ref<{ setVersion: (version: string | null) => void }> }) {
      const [version, setVersion] = useState<string | null>('first');
      useImperativeHandle(ref, () => ({ setVersion }), []);
      return (
        <div>
          {version === null ? null : (
            <button key={version} ref={saveRef} type="button" data-version={version}>
              Save
            </button>
          )}
          <Tour steps={[{ target: saveRef, title: 'Save' }]} defaultOpen />
        </div>
      );
    }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const top = this.dataset.version === 'second' ? 120 : 40;
      return { top, left: 30, width: 80, height: 24, right: 110, bottom: top + 24 } as DOMRect;
    });
    render(<Replacing ref={replacing} />);
    await screen.findByRole('dialog', { name: 'Save' });
    const spotlight = () => document.querySelector('.ui-tour__spotlight') as HTMLElement;
    expect(spotlight().style.top).toBe('40px');
    act(() => replacing.current?.setVersion('second'));
    await waitFor(() => expect(spotlight().style.top).toBe('120px'));
    expect(spotlight()).not.toHaveAttribute('data-target-missing');
    act(() => replacing.current?.setVersion(null));
    await waitFor(() => expect(spotlight()).toHaveAttribute('data-target-missing', 'true'));
    expect(screen.getByRole('dialog', { name: 'Save' })).toBeInTheDocument();
    expect(document.querySelector('.ui-tour__arrow')).toBeNull();
    vi.restoreAllMocks();
  });
  it('UIC-TOUR-1.2 scrolls a target that appears after its step shows into view', async () => {
    const scrolled = vi.fn();
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
      scrolled(this.textContent);
    };
    const { rerender } = render(
      <Tour steps={[{ target: '#late', title: 'Late', targetTimeout: 1000 }]} defaultOpen />,
    );
    expect(scrolled).not.toHaveBeenCalled();
    rerender(
      <>
        <button id="late" type="button">
          Export
        </button>
        <Tour steps={[{ target: '#late', title: 'Late', targetTimeout: 1000 }]} defaultOpen />
      </>,
    );
    await waitFor(() => expect(scrolled).toHaveBeenCalledWith('Export'));
    // @ts-expect-error -- jsdom has no scrollIntoView; the test's own goes again.
    delete HTMLElement.prototype.scrollIntoView;
  });

  it('UIC-TOUR-2.1 moves with next and back, and finishes on the last step', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    const onFinish = vi.fn();
    const onOpenChange = vi.fn();
    render(<Page onStepChange={onStepChange} onFinish={onFinish} onOpenChange={onOpenChange} />);
    await screen.findByRole('dialog', { name: 'Search' });
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(dialog().closest('.ui-tour')).toHaveAttribute('data-placement', 'right');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    const last = await screen.findByRole('dialog', { name: 'Share' });
    expect(within(last).getByText('3 of 3')).toBeInTheDocument();
    expect(within(last).queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    await user.click(within(last).getByRole('button', { name: 'Finish' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('.ui-tour__spotlight')).toBeNull();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('UIC-TOUR-2.2 skips with the Skip button or Escape', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const { unmount } = render(<Page onSkip={onSkip} />);
    await screen.findByRole('dialog', { name: 'Search' });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Skip' }));
    expect(onSkip).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    render(<Page onSkip={onSkip} />);
    const step = await screen.findByRole('dialog', { name: 'Search' });
    await waitFor(() => expect(step).toHaveFocus());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(step, { key: 'Escape', isComposing: true });
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onSkip).toHaveBeenLastCalledWith(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['modal', false],
    ['non-modal', true],
  ])('UIC-TOUR-2.2 leaves Escape to a %s step control that handles it', async (_, isNonModal) => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const storage = createMemoryStorage();
    const editor: TourStep[] = [
      {
        target: searchRef,
        title: 'Editor',
        content: (
          <>
            <input
              aria-label="Prevented"
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.preventDefault();
              }}
            />
            <input
              aria-label="Stopped"
              onKeyDown={(event) => {
                if (event.key === 'Escape') event.stopPropagation();
              }}
            />
            <input aria-label="Plain" />
          </>
        ),
      },
    ];
    render(
      <UiProvider storage={storage}>
        <Page steps={editor} onSkip={onSkip} persistKey="tour.editor" isNonModal={isNonModal} />
      </UiProvider>,
    );
    const step = await screen.findByRole('dialog', { name: 'Editor' });
    for (const name of ['Prevented', 'Stopped']) {
      await user.click(within(step).getByRole('textbox', { name }));
      await user.keyboard('{Escape}');
      expect(onSkip).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: 'Editor' })).toBeInTheDocument();
      expect(storage.getItem('tour.editor')).toBeNull();
    }
    await user.click(within(step).getByRole('textbox', { name: 'Plain' }));
    await user.keyboard('{Escape}');
    expect(onSkip).toHaveBeenCalledExactlyOnceWith(0);
    expect(storage.getItem('tour.editor')).toBe('true');
  });

  it('UIC-TOUR-2.5 moves focus to each step, keeps it inside, and returns it on close', async () => {
    const user = userEvent.setup();
    function Helped() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Help
          </button>
          <Page isOpen={isOpen} onOpenChange={setOpen} isNonModal />
        </>
      );
    }
    render(<Helped />);
    await user.click(screen.getByRole('button', { name: 'Help' }));
    const first = await screen.findByRole('dialog', { name: 'Search' });
    await waitFor(() => expect(first).toHaveFocus());
    await user.keyboard('{Tab}');
    expect(within(first).getByRole('button', { name: 'Skip' })).toHaveFocus();
    await user.keyboard('{Tab}{Enter}');
    const second = await screen.findByRole('dialog', { name: 'Filters' });
    await waitFor(() => expect(second).toHaveFocus());
    await user.keyboard('{Tab}{Tab}{Tab}{Tab}');
    expect(second.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus());
  });

  it('UIC-TOUR-2.3 follows a controlled step and open state', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [step, setStep] = useState(2);
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Start tour
          </button>
          <Page isOpen={isOpen} onOpenChange={setOpen} step={step} onStepChange={setStep} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start tour' }));
    expect(await screen.findByRole('dialog', { name: 'Share' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start tour' })).toHaveFocus());
  });

  it('UIC-TOUR-2.4 starts again at the default step after closing', async () => {
    const user = userEvent.setup();
    function Restartable() {
      const [isOpen, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Restart
          </button>
          <Page isOpen={isOpen} onOpenChange={setOpen} defaultStep={1} />
        </>
      );
    }
    render(<Restartable />);
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Finish' }));
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('UIC-TOUR-2.4 starts again at the default step after the host closes it', async () => {
    const user = userEvent.setup();
    function HostClosed() {
      const [isOpen, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen((value) => !value)}>
            Toggle tour
          </button>
          <Page isOpen={isOpen} onOpenChange={setOpen} isNonModal />
        </>
      );
    }
    render(<HostClosed />);
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle tour' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle tour' }));
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('UIC-TOUR-3.1 remembers completion through the provider storage', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Page persistKey="tour.recipes" />
      </UiProvider>,
    );
    await screen.findByRole('dialog', { name: 'Search' });
    expect(storage.getItem('tour.recipes')).toBeNull();
    await user.keyboard('{Escape}');
    expect(storage.getItem('tour.recipes')).toBe('true');
    unmount();
    render(
      <UiProvider storage={storage}>
        <Page persistKey="tour.recipes" />
        <Tour steps={steps} persistKey="tour.recipes" isOpen data-testid="forced" />
      </UiProvider>,
    );
    // The uncontrolled tour stays closed; the controlled one opens anyway.
    expect(await screen.findAllByRole('dialog')).toHaveLength(1);
  });

  it('UIC-TOUR-3.1 opens a tour whose stored completion is not a boolean', async () => {
    const storage = createMemoryStorage({ 'tour.recipes': '{}' });
    render(
      <UiProvider storage={storage}>
        <Page persistKey="tour.recipes" />
      </UiProvider>,
    );
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('UIC-TOUR-3.2 makes the page inert while modal and leaves it usable when not', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Page />);
    await screen.findByRole('dialog', { name: 'Search' });
    const panel = dialog().closest('.ui-tour') as HTMLElement;
    expect(panel).not.toHaveAttribute('data-non-modal');
    const outside = screen.getByRole('button', { name: 'Filters', hidden: true });
    await waitFor(() => expect(outside.closest('[inert], [aria-hidden="true"]')).not.toBeNull());
    unmount();
    const onPress = vi.fn();
    render(
      <div>
        <button type="button" onClick={onPress}>
          Elsewhere
        </button>
        <Page isNonModal />
      </div>,
    );
    await screen.findByRole('dialog', { name: 'Search' });
    expect(dialog().closest('.ui-tour')).toHaveAttribute('data-non-modal', 'true');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('UIC-TOUR-1.1 UIC-TOUR-3.2 keeps a non-modal step on its target as the page scrolls', async () => {
    let top = 300;
    const rect = vi
      .spyOn(HTMLInputElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => new DOMRect(40, top, 200, 30));
    try {
      render(<Page isNonModal />);
      await screen.findByRole('dialog', { name: 'Search' });
      const panel = document.querySelector<HTMLElement>('.ui-tour') as HTMLElement;
      await waitFor(() => expect(panel.style.top).not.toBe(''));
      const before = parseFloat(panel.style.top);
      top = 180;
      fireEvent.scroll(window);
      await waitFor(() => expect(parseFloat(panel.style.top)).toBe(before - 120));
      expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    } finally {
      rect.mockRestore();
    }
  });

  it('UIC-TOUR-3.3 forwards the class name, caller attributes and id', async () => {
    render(<Page className="onboarding" id="intro" data-flow="first-run" />);
    const step = await screen.findByRole('dialog', { name: 'Search' });
    expect(step).toHaveAttribute('id', 'intro');
    const panel = step.closest('.ui-tour') as HTMLElement;
    expect(panel).toHaveClass('onboarding');
    expect(panel).toHaveAttribute('data-flow', 'first-run');
    expectHooksMatchSpec(document.body, 'TOUR', { callerAttributes: ['data-flow'] });
  });

  it('UIC-TOUR-1.1 renders nothing without steps or while closed', () => {
    const { container, unmount } = render(<Tour steps={[]} defaultOpen />);
    expect(container).toBeEmptyDOMElement();
    unmount();
    render(<Tour steps={steps} />);
    expect(document.querySelector('.ui-tour, .ui-tour__spotlight')).toBeNull();
  });
});
