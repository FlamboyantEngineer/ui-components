// A combobox lab case: a single and a multiple combobox printing each callback with its reason.

import { useState } from 'react';
import { Combobox, type ComboboxItem } from '../../src/components/combobox/combobox.js';
import { LabOutput } from './lab-output.js';

const herbs: ComboboxItem[] = [
  { id: 'basil', label: 'Basil' },
  { id: 'chives', label: 'Chives' },
  { id: 'dill', label: 'Dill' },
  { id: 'mint', label: 'Mint' },
  { id: 'sage', label: 'Sage' },
];

/** The last few callbacks of a combobox, each with its reason. */
function useCallbackLog() {
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) => setLog((list) => [...list.slice(-5), entry]);
  return {
    log: log.join(' · ') || 'none',
    props: {
      onChange: (value: unknown, { reason }: { reason: string }) =>
        add(`change ${JSON.stringify(value)} (${reason})`),
      onInputChange: (text: string, { reason }: { reason: string }) =>
        add(`text “${text}” (${reason})`),
      onOpenChange: (isOpen: boolean, { reason }: { reason: string }) =>
        add(`${isOpen ? 'open' : 'close'} (${reason})`),
    },
  };
}

/**
 * A single and a multiple combobox that print their callbacks with their reasons: type, pick,
 * clear, remove a chip, press Escape or leave the field to see each reason.
 */
export function ChangeReasons() {
  const single = useCallbackLog();
  const several = useCallbackLog();
  return (
    <>
      <Combobox label="Herb, with reasons" defaultItems={herbs} {...single.props} />
      <LabOutput name="Single reasons">{single.log}</LabOutput>
      <Combobox
        label="Herbs, with reasons"
        selectionMode="multiple"
        defaultItems={herbs}
        defaultValue={['mint']}
        {...several.props}
      />
      <LabOutput name="Multiple reasons">{several.log}</LabOutput>
    </>
  );
}
