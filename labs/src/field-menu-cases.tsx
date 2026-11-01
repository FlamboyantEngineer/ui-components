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
