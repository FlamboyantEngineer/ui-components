import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  FocusScope,
  useFocusManager,
  type FocusManager,
  type FocusScopeProps,
} from './focus-scope.js';

/** A page with buttons around a scope holding two fields and a button. */
function Page(props: Omit<FocusScopeProps, 'children'>) {
  return (
    <>
      <button type="button">Before</button>
      <FocusScope aria-label="Recipe" {...props}>
        <input aria-label="Name" />
        <input aria-label="Servings" />
        <button type="button">Save</button>
      </FocusScope>
      <button type="button">After</button>
    </>
  );
}

/** An opener that mounts a scope until its Close button is pressed. */
function Opener({
  scope,
  children,
}: {
  scope: Omit<FocusScopeProps, 'children'>;
  children?: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {children}
      {isOpen ? (
        <FocusScope {...scope}>
          <input aria-label="City" />
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </FocusScope>
      ) : null}
    </>
  );
}

/** Buttons that move focus with the arrow keys through the scope's focus manager. */
function ArrowButtons() {
  const manager = useFocusManager();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') manager?.focusNext({ wrap: true });
    if (event.key === 'ArrowLeft') manager?.focusPrevious({ wrap: true });
    if (event.key === 'Home') manager?.focusFirst();
    if (event.key === 'End') manager?.focusLast();
  };
  return (
    <div role="toolbar" aria-label="Fruit" onKeyDown={onKeyDown}>
      <button type="button">Apple</button>
      <button type="button">Pear</button>
      <button type="button">Plum</button>
    </div>
  );
}

const focused = (name: string) => screen.getByRole('button', { name }) as HTMLElement;
const field = (name: string) => screen.getByRole('textbox', { name }) as HTMLElement;

describe('FocusScope', () => {
  it('UIC-FOCUS-SCOPE-1.1 UIC-FOCUS-SCOPE-2.1 wraps its content in one element with no role of its own', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <FocusScope ref={ref}>
        <button type="button">Save</button>
      </FocusScope>,
    );
    const root = container.querySelector('.ui-focus-scope') as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).not.toHaveAttribute('role');
    expect(ref.current).toBe(root);
    expect(root).toContainElement(focused('Save'));
    expect(root).not.toHaveAttribute('data-contain');
    expectHooksMatchSpec(container, 'FOCUS-SCOPE');
  });

  it('UIC-FOCUS-SCOPE-1.2 UIC-FOCUS-SCOPE-2.1 appends the caller class and forwards id, data, ARIA and DOM props', () => {
    const { container } = render(
      <FocusScope
        contain
        className="caller"
        id="editor"
        role="group"
        aria-label="Editor"
        data-contain="caller"
        data-owner="kitchen"
      >
        <button type="button">Save</button>
      </FocusScope>,
    );
    const root = screen.getByRole('group', { name: 'Editor' });
    expect(root).toHaveClass('ui-focus-scope', 'caller');
    expect(root).toHaveAttribute('id', 'editor');
    expect(root).toHaveAttribute('data-contain', 'true');
    expect(root).toHaveAttribute('data-owner', 'kitchen');
    expectHooksMatchSpec(container, 'FOCUS-SCOPE', { callerAttributes: ['data-owner'] });
  });

  it('UIC-FOCUS-SCOPE-2.2 keeps Tab and Shift+Tab inside while it contains focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<Page contain />);
    expect(container.querySelector('.ui-focus-scope')).toHaveAttribute('data-contain', 'true');
    await user.click(field('Name'));
    await user.tab();
    expect(field('Servings')).toHaveFocus();
    await user.tab();
    expect(focused('Save')).toHaveFocus();
    await user.tab();
    expect(field('Name')).toHaveFocus();
    await user.tab({ shift: true });
    expect(focused('Save')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.3 releases and contains again as contain switches while mounted', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Page contain />);
    await user.click(focused('Save'));
    await user.tab();
    expect(field('Name')).toHaveFocus();
    rerender(<Page contain={false} />);
    expect(container.querySelector('.ui-focus-scope')).not.toHaveAttribute('data-contain');
    await user.click(focused('Save'));
    await user.tab();
    expect(focused('After')).toHaveFocus();
    rerender(<Page contain />);
    await user.click(focused('Save'));
    await user.tab();
    expect(field('Name')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.4 focuses the first tabbable element on mount with autoFocus', async () => {
    const user = userEvent.setup();
    render(<Opener scope={{ autoFocus: true }} />);
    await user.click(focused('Open'));
    expect(field('City')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.4 leaves focus on an element that took it with autoFocus', () => {
    render(
      <FocusScope autoFocus>
        <input aria-label="City" />
        <button type="button" autoFocus>
          Save
        </button>
      </FocusScope>,
    );
    expect(focused('Save')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.5 focuses initialFocus on mount ahead of autoFocus', async () => {
    const user = userEvent.setup();
    function Harness() {
      const closeRef = useRef<HTMLButtonElement>(null);
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {isOpen ? (
            <FocusScope autoFocus initialFocus={closeRef}>
              <input aria-label="City" />
              <button type="button" ref={closeRef}>
                Close
              </button>
            </FocusScope>
          ) : null}
        </>
      );
    }
    render(<Harness />);
    await user.click(focused('Open'));
    expect(focused('Close')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.5 falls back to autoFocus when initialFocus names no element', async () => {
    const user = userEvent.setup();
    render(<Opener scope={{ autoFocus: true, initialFocus: () => null }} />);
    await user.click(focused('Open'));
    expect(field('City')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.6 returns focus to the element focused at mount with restoreFocus', async () => {
    const user = userEvent.setup();
    render(<Opener scope={{ autoFocus: true, restoreFocus: true, contain: true }} />);
    await user.click(focused('Open'));
    expect(field('City')).toHaveFocus();
    await user.click(focused('Close'));
    await waitFor(() => expect(focused('Open')).toHaveFocus());
  });

  it('UIC-FOCUS-SCOPE-2.7 sends focus to finalFocus on unmount', async () => {
    const user = userEvent.setup();
    const afterRef = createRef<HTMLButtonElement>();
    render(
      <Opener scope={{ autoFocus: true, restoreFocus: true, contain: true, finalFocus: afterRef }}>
        <button type="button" ref={afterRef}>
          Summary
        </button>
      </Opener>,
    );
    await user.click(focused('Open'));
    await user.click(focused('Close'));
    expect(focused('Summary')).toHaveFocus();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(focused('Summary')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-2.7 leaves focus where the reader moved it before unmount', async () => {
    const user = userEvent.setup();
    const afterRef = createRef<HTMLButtonElement>();
    function Harness() {
      const [isOpen, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            Hide
          </button>
          <button type="button" ref={afterRef}>
            Summary
          </button>
          {isOpen ? (
            <FocusScope finalFocus={afterRef}>
              <input aria-label="City" />
            </FocusScope>
          ) : null}
        </>
      );
    }
    render(<Harness />);
    await user.click(focused('Hide'));
    expect(focused('Hide')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-3.1 moves focus within the scope through useFocusManager', async () => {
    const user = userEvent.setup();
    render(
      <FocusScope>
        <ArrowButtons />
      </FocusScope>,
    );
    await user.click(focused('Apple'));
    await user.keyboard('{ArrowRight}');
    expect(focused('Pear')).toHaveFocus();
    await user.keyboard('{End}');
    expect(focused('Plum')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(focused('Apple')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(focused('Plum')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(focused('Apple')).toHaveFocus();
  });

  it('UIC-FOCUS-SCOPE-3.1 returns the focused element, and no manager outside a scope', () => {
    const managers: (FocusManager | undefined)[] = [];
    function Probe() {
      managers.push(useFocusManager());
      return <button type="button">Probe</button>;
    }
    render(
      <>
        <Probe />
        <FocusScope>
          <Probe />
        </FocusScope>
      </>,
    );
    expect(managers[0]).toBeUndefined();
    let moved: Element | null | undefined;
    act(() => {
      moved = managers.at(-1)?.focusFirst({ tabbable: true });
    });
    expect(moved).toBe(screen.getAllByRole('button', { name: 'Probe' })[1]);
    expect(moved).toHaveFocus();
  });
});
