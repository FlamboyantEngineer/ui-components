import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../src/components/button/button.js';
import { FocusScope, useFocusManager } from '../../src/components/focus-scope/focus-scope.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

function FruitFilters() {
  const manager = useFocusManager();
  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, () => void> = {
      ArrowRight: () => manager?.focusNext({ wrap: true }),
      ArrowLeft: () => manager?.focusPrevious({ wrap: true }),
      Home: () => manager?.focusFirst(),
      End: () => manager?.focusLast(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  };
  return (
    <div role="toolbar" aria-label="Fruit filters" onKeyDown={onKeyDown}>
      {fruit.map((name) => (
        <Button key={name} size="sm" variant="chip">
          {name}
        </Button>
      ))}
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
      title="Inside a frame"
      description="This page's React renders the note editor into a same-origin frame. Saving sends focus to the frame's Note saved line: the scope reads focus from its own document, not this page's."
    >
      <FramedScope />
    </LabSection>
    <LabSection
      title="Arrow keys through the focus manager"
      description="The filters use useFocusManager: ArrowRight and ArrowLeft wrap around, Home and End jump to the ends."
    >
      <FocusScope data-lab-demo="filters">
        <FruitFilters />
      </FocusScope>
    </LabSection>
  </>,
);
