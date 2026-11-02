import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../src/components/button/button.js';
import { FocusScope, useFocusManager } from '../../src/components/focus-scope/focus-scope.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { ShadowRootHost } from './shadow-root-host.js';

const fruit = ['Apples', 'Pears', 'Plums', 'Cherries'];

interface ScopeOptions {
  autoFocus: boolean;
  restoreFocus: boolean;
  contain: boolean;
}

/** An opener that mounts a scope with a field and a Close button. */
function OpenableScope({ autoFocus, restoreFocus, contain }: ScopeOptions) {
  const [isOpen, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" onPress={() => setOpen(true)}>
        Open
      </Button>
      {isOpen ? (
        <FocusScope
          autoFocus={autoFocus}
          restoreFocus={restoreFocus}
          contain={contain}
          role="group"
          aria-label="Delivery"
        >
          <TextField label="City" />
          <Button size="sm" onPress={() => setOpen(false)}>
            Close
          </Button>
        </FocusScope>
      ) : null}
    </div>
  );
}

function InlineEditor() {
  const [isTrapped, setTrapped] = useState(false);
  return (
    <div data-lab-demo="editor">
      <Button size="sm">Before the editor</Button>
      <FocusScope contain={isTrapped} role="group" aria-label="Recipe editor">
        <TextField label="Name" defaultValue="Lemon tart" />
        <TextField label="Servings" defaultValue="6" />
        <Switch isSelected={isTrapped} onChange={setTrapped}>
          Keep focus in the editor
        </Switch>
        <Button size="sm" variant="primary">
          Save
        </Button>
      </FocusScope>
      <Button size="sm">After the editor</Button>
    </div>
  );
}

function RenameFlow() {
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState('Lemon tart');
  const [draft, setDraft] = useState(name);
  const nameRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const close = (save: boolean) => {
    if (save) setName(draft);
    setEditing(false);
  };
  return (
    <div data-lab-demo="rename">
      <h3 ref={resultRef} tabIndex={-1} data-lab-output="name">
        {name}
      </h3>
      <Button size="sm" onPress={() => setEditing(true)}>
        Rename
      </Button>
      {isEditing ? (
        <FocusScope
          contain
          restoreFocus
          initialFocus={() => nameRef.current?.querySelector('input')}
          finalFocus={resultRef}
          role="group"
          aria-label="Rename recipe"
        >
          <TextField label="Category" defaultValue="Desserts" />
          <div ref={nameRef}>
            <TextField label="New name" value={draft} onChange={setDraft} />
          </div>
          <Button size="sm" variant="primary" onPress={() => close(true)}>
            Save name
          </Button>
          <Button size="sm" onPress={() => close(false)}>
            Cancel
          </Button>
        </FocusScope>
      ) : null}
    </div>
  );
}

/**
 * A rename scope in an open shadow root. Its buttons are native: React Aria's presses do not reach
 * into shadow roots.
 */
function ShadowRename() {
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState('Lemon tart');
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (
    <ShadowRootHost demo="shadow-rename">
      <h3 ref={headingRef} tabIndex={-1} data-lab-output="name">
        {name}
      </h3>
      <button type="button" onClick={() => setEditing(true)}>
        Rename
      </button>
      {isEditing ? (
        <FocusScope autoFocus finalFocus={headingRef} role="group" aria-label="Rename recipe">
          <label>
            New name <input defaultValue={name} name="name" />
          </label>
          <button
            type="button"
            onClick={(event) => {
              const field = event.currentTarget.parentElement?.querySelector('input');
              setName(field?.value ?? name);
              setEditing(false);
            }}
          >
            Save name
          </button>
        </FocusScope>
      ) : null}
    </ShadowRootHost>
  );
}

/** A note editor rendered by this page's React into a same-origin frame's document. */
function FramedNote() {
  const [isEditing, setEditing] = useState(false);
  const doneRef = useRef<HTMLParagraphElement>(null);
  return (
    <main aria-label="Note editor">
      <h1>Note</h1>
      <p ref={doneRef} tabIndex={-1}>
        Note saved
      </p>
      <button type="button" onClick={() => setEditing(true)}>
        Edit note
      </button>
      {isEditing ? (
        <FocusScope autoFocus finalFocus={doneRef} role="group" aria-label="Edit note">
          <label>
            Note <input />
          </label>
          <button type="button" onClick={() => setEditing(false)}>
            Save note
          </button>
        </FocusScope>
      ) : null}
    </main>
  );
}

function FramedScope() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const body = frameRef.current?.contentDocument?.body;
    if (!body) return;
    const root = createRoot(body);
    root.render(<FramedNote />);
    return () => root.unmount();
  }, []);
  return (
    <iframe
      ref={frameRef}
      title="Framed note"
      data-lab-demo="frame"
      style={{ width: 360, height: 140, border: '1px dotted currentColor' }}
    />
  );
}

interface FilterOptions {
  wrap: boolean;
  tabbable: boolean;
  skipSoldOut: boolean;
  startAt: 'focused' | 'Plums';
}

/** Fruit chips; Pears is sold out and Quinces is focusable from code only (tabIndex -1). */
function FruitFilters({
  options,
  onMove,
}: {
  options: FilterOptions;
  onMove: (result: string) => void;
}) {
  const manager = useFocusManager();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const managerOptions = () => ({
    wrap: options.wrap,
    tabbable: options.tabbable,
    accept: options.skipSoldOut
      ? (node: Element) => !node.hasAttribute('data-sold-out')
      : undefined,
    from:
      options.startAt === 'Plums'
        ? (toolbarRef.current?.querySelector('[data-fruit="Plums"]') ?? undefined)
        : undefined,
  });
  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, () => Element | null | undefined> = {
      ArrowRight: () => manager?.focusNext(managerOptions()),
      ArrowLeft: () => manager?.focusPrevious(managerOptions()),
      Home: () => manager?.focusFirst(managerOptions()),
      End: () => manager?.focusLast(managerOptions()),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const focused = move();
    onMove(`${event.key}: ${focused?.getAttribute('data-fruit') ?? 'nothing (stayed put)'}`);
  };
  return (
    <div ref={toolbarRef} role="toolbar" aria-label="Fruit filters" onKeyDown={onKeyDown}>
      {fruit.map((name) => (
        <Button
          key={name}
          size="sm"
          variant="chip"
          data-fruit={name}
          data-sold-out={name === 'Pears' ? '' : undefined}
        >
          {name === 'Pears' ? 'Pears (sold out)' : name}
        </Button>
      ))}
      <button type="button" tabIndex={-1} data-fruit="Quinces">
        Quinces (not tabbable)
      </button>
    </div>
  );
}

function FocusManagerDemo() {
  const [options, setOptions] = useState<FilterOptions>({
    wrap: true,
    tabbable: true,
    skipSoldOut: false,
    startAt: 'focused',
  });
  const [result, setResult] = useState('No move yet');
  const toggle = (key: 'wrap' | 'tabbable' | 'skipSoldOut') => (value: boolean) =>
    setOptions((current) => ({ ...current, [key]: value }));
  return (
    <div data-lab-demo="manager-options">
      <div role="group" aria-label="Focus manager options">
        <Switch isSelected={options.wrap} onChange={toggle('wrap')}>
          Wrap at the ends
        </Switch>
        <Switch isSelected={options.tabbable} onChange={toggle('tabbable')}>
          Tabbable elements only
        </Switch>
        <Switch isSelected={options.skipSoldOut} onChange={toggle('skipSoldOut')}>
          Skip sold-out fruit (accept)
        </Switch>
        <SegmentedChoice
          aria-label="Start from"
          sizing="content"
          options={[
            { value: 'focused', label: 'Focused element' },
            { value: 'Plums', label: 'Plums' },
          ]}
          value={options.startAt}
          onChange={(value) =>
            setOptions((current) => ({
              ...current,
              startAt: value === 'Plums' ? 'Plums' : 'focused',
            }))
          }
        />
      </div>
      <FocusScope data-lab-demo="filters">
        <FruitFilters options={options} onMove={setResult} />
      </FocusScope>
      <output aria-label="Last move" data-lab-output="move">
        {result}
      </output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Options"
      description="Open a scope in each combination: autoFocus moves focus to its field, restoreFocus returns focus to Open when it closes, contain keeps Tab inside."
    >
      <StateMatrix
        axes={{
          autoFocus: ['off', 'on'],
          restoreFocus: ['off', 'on'],
          contain: ['off', 'on'],
        }}
        render={(cell) => (
          <OpenableScope
            autoFocus={cell.autoFocus === 'on'}
            restoreFocus={cell.restoreFocus === 'on'}
            contain={cell.contain === 'on'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Switching the trap off"
      description="Turn the switch on and the editor keeps Tab and Shift+Tab inside, wherever focus tries to go; turn it off and Tab leaves for the button after it."
    >
      <InlineEditor />
    </LabSection>
    <LabSection
      title="Initial and final focus"
      description="Rename focuses the name field rather than the first field, and saving sends focus to the renamed heading instead of the Rename button."
    >
      <RenameFlow />
    </LabSection>
    <LabSection
      title="Inside a shadow root"
      description="A rename scope lives in an open shadow root, unstyled there, with native buttons. Saving sends focus to the renamed heading: the scope reads focus through the shadow root."
    >
      <ShadowRename />
    </LabSection>
    <LabSection
      title="Inside a frame"
      description="This page's React renders the note editor into a same-origin frame. Saving sends focus to the frame's Note saved line: the scope reads focus from its own document, not this page's."
    >
      <FramedScope />
    </LabSection>
    <LabSection
      title="Arrow keys through the focus manager"
      description="The filters use useFocusManager: ArrowRight and ArrowLeft move, Home and End jump to the ends. The switches set wrap, tabbable (Quinces is focusable from code only) and accept (skips Pears); Start from passes Plums as from. The readout names the element each move returned."
    >
      <FocusManagerDemo />
    </LabSection>
  </>,
);
