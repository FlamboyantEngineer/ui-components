import { useState } from 'react';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { RichTextEditor } from '../../src/components/rich-text-editor/rich-text-editor.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { shortNote } from './rich-text-editor-cases.js';

/**
 * One field of each kind of control, whose menu opens from anywhere in the field: the label, the
 * space around the control, and the text inside an input, a text area or editable content.
 */
export function MenuEverywhere() {
  return (
    <div data-lab-menu-everywhere style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <TextField label="Fruit" defaultValue="Pear" description="A text input." />
      <TextField
        label="Shopping list"
        multiline
        defaultValue={'Pears\nFigs'}
        description="A text area."
      />
      <NumberField label="Quantity" defaultValue={12} description="A number input." />
      <RichTextEditor label="Note" defaultValue={shortNote} description="Editable content." />
    </div>
  );
}

const helpTexts = ['Use the name on the label.', 'Use the name printed on the crate.'] as const;

/**
 * Fields with help, which their menus offer as Help: with the help button, without it, read-only
 * and in a number field. The button swaps the help text, or takes it away.
 */
export function HelpFromMenu() {
  const [help, setHelp] = useState<number | null>(0);
  const text = help === null ? undefined : helpTexts[help];
  return (
    <div data-lab-help-menu style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <button type="button" onClick={() => setHelp(help === null ? 0 : help === 0 ? 1 : null)}>
        {help === null ? 'Restore the help' : help === 0 ? 'Change the help' : 'Remove the help'}
      </button>
      <TextField label="Variety" defaultValue="Comice" help={text} />
      <TextField label="Grower" defaultValue="Hillside" help={text} showHelpButton={false} />
      <TextField label="Orchard" defaultValue="North row" help={text} isReadOnly />
      <NumberField label="Crates" defaultValue={4} help={text} showHelpButton={false} />
    </div>
  );
}
