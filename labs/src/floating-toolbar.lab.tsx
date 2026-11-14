import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { FloatingToolbar } from '../../src/components/floating-toolbar/floating-toolbar.js';
import { LabSection, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

interface Picked {
  text: string;
  rect: DOMRect;
  key: string;
}

// The text selected inside the element, with its box, or null.
function pickedIn(element: HTMLElement | null): Picked | null {
  const selection = element?.ownerDocument.getSelection();
  if (!element || !selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return null;
  const rect = range.getBoundingClientRect();
  const key = [rect.left, rect.top, rect.width, rect.height].map(Math.round).join(':');
  return { text: selection.toString(), rect, key };
}

/** Selecting text in the passage floats a toolbar over it; Alt+F10 moves focus into it. */
function SelectionDemo() {
  const passage = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [action, setAction] = useState('none');
  useEffect(() => {
    const document = passage.current?.ownerDocument;
    if (!document) return undefined;
    const update = () => setPicked(pickedIn(passage.current));
    document.addEventListener('selectionchange', update);
    window.addEventListener('scroll', update, true);
    return () => {
      document.removeEventListener('selectionchange', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey || event.key !== 'F10') return;
    event.preventDefault();
    row.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
  };
  const isOpen = picked !== null && dismissed !== picked.key;
  return (
    <div data-lab-demo="selection">
      <div
        ref={passage}
        tabIndex={0}
        onKeyDown={onKeyDown}
        data-lab-passage=""
        aria-label="Passage"
        role="document"
      >
        <p>
          Select a few words of this passage. The toolbar floats over the selection and follows it
          as it changes, without taking focus from the page.
        </p>
      </div>
      <FloatingToolbar
        isOpen={isOpen}
        triggerRef={passage}
        getTargetRect={() => picked?.rect ?? null}
        targetKey={picked?.key ?? ''}
        rowRef={row}
        aria-label="Selection actions"
        onDismiss={() => {
          setDismissed(picked?.key ?? null);
          passage.current?.focus();
        }}
      >
        <Button
          size="sm"
          preventFocusOnPress
          onPress={() => setAction(`count ${String(picked?.text.length ?? 0)}`)}
        >
          Count
        </Button>
        <Button
          size="sm"
          preventFocusOnPress
          onPress={() => setAction(`upper ${picked?.text.toUpperCase() ?? ''}`)}
        >
          Shout
        </Button>
      </FloatingToolbar>
      <LabOutput name="action">{action}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Over selected text"
      description="Select words in the passage: the toolbar floats above them, focus stays in the passage, Alt+F10 moves into the toolbar and Escape hides it until the selection changes."
    >
      <SelectionDemo />
    </LabSection>
  </>,
);
