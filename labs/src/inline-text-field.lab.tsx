import { useEffect, useRef, useState } from 'react';
import { InlineTextField } from '../../src/components/inline-text-field/inline-text-field.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

/**
 * An editable document that, as a rich-text editor does, selects all of itself on Ctrl+A and logs
 * every key and paste it receives, around a figure whose caption is an inline text field.
 */
function CaptionInDocument() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [caption, setCaption] = useState('A basket of pears');
  const [log, setLog] = useState<readonly string[]>([]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const record = (event: Event) => {
      const name = event instanceof KeyboardEvent ? `${event.type} ${event.key}` : event.type;
      setLog((entries) => [...entries.slice(-4), name]);
      if (event instanceof KeyboardEvent && event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        const selection = host.ownerDocument.getSelection();
        selection?.selectAllChildren(host);
      }
    };
    host.addEventListener('keydown', record);
    host.addEventListener('paste', record);
    return () => {
      host.removeEventListener('keydown', record);
      host.removeEventListener('paste', record);
    };
  }, []);
  return (
    <div data-lab-demo="document">
      <div
        ref={hostRef}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        aria-label="Document"
      >
        <p>The orchard sends a weekly basket.</p>
        <figure contentEditable={false}>
          <div aria-hidden="true">[ image ]</div>
          <figcaption>
            <InlineTextField
              value={caption}
              aria-label="Caption"
              placeholder="Add a caption"
              onCommit={setCaption}
            />
          </figcaption>
        </figure>
        <p>Pears ripen on the counter.</p>
      </div>
      <p data-lab-output="caption">Committed: {caption}</p>
      <p data-lab-output="host">Document received: {log.join(', ') || 'nothing'}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Empty with a placeholder, filled, and read only. Hover or focus shows the frame."
    >
      <StateMatrix
        axes={{ value: ['empty', 'filled'], mode: ['editable', 'read only'] }}
        render={({ value, mode }) => (
          <InlineTextField
            value={value === 'empty' ? '' : 'A basket of pears'}
            aria-label={`Caption ${value} ${mode}`}
            placeholder="Add a caption"
            isReadOnly={mode === 'read only'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Inside an editable document"
      description="The caption sits in a non-editable figure of an editable document that selects all of itself on Ctrl+A. In the caption, select all, paste, Backspace and Enter stay in the field; Escape restores the committed caption."
    >
      <CaptionInDocument />
    </LabSection>
  </>,
);
