import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Dialog, type DialogSize, DialogTrigger } from '../../src/components/dialog/dialog.js';
import { Disclosure } from '../../src/components/disclosure/disclosure.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { StateMatrix } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const satisfies readonly DialogSize[];
const sections = Array.from({ length: 24 }, (_, index) => index + 1);

/** Dialogs whose body is taller than the viewport: the panel stays on screen and the body scrolls. */
export function DialogTallCases() {
  return (
    <StateMatrix
      axes={{ size: sizes }}
      render={({ size }) => (
        <DialogTrigger>
          <Button size="sm">Open the {size} terms</Button>
          <Dialog
            size={size}
            title="Terms of travel"
            description="Every section of the agreement."
            showCloseButton
            data-lab-modal={`tall-${size}`}
            primaryAction={{ label: 'Accept', onPress: (close) => close() }}
          >
            {sections.map((section) => (
              <p key={section}>
                Section {section}. Bookings can be changed up to a day before departure; a change
                after that keeps the fare and adds the difference in price.
              </p>
            ))}
          </Dialog>
        </DialogTrigger>
      )}
    />
  );
}

const groups = ['Route', 'Schedule', 'Fares', 'Luggage', 'Seating', 'Meals', 'Notices', 'Contacts'];

/**
 * A tall form in an extra-large dialog that focuses itself at opening: fields, disclosures and a
 * compact number field whose restore button takes focus while the outer frame stays put.
 */
export function DialogTallFormCase() {
  return (
    <DialogTrigger>
      <Button size="sm">Edit the trip</Button>
      <Dialog
        size="xl"
        initialFocus="dialog"
        title="Trip settings"
        isDismissable={false}
        description="Every setting of the trip."
        showCloseButton
        data-lab-modal="tall-form"
        primaryAction={{ label: 'Save', onPress: (close) => close() }}
      >
        <NumberField label="Travellers" size="sm" defaultValue={2} minValue={1} showRestoreButton />
        {groups.map((group, index) => (
          <Disclosure key={group} title={group} defaultExpanded={index % 2 === 0}>
            <TextField label={`${group} note`} defaultValue={`${group} as booked.`} />
            <Checkbox defaultSelected={index % 3 === 0}>
              Share {group.toLowerCase()} with everyone
            </Checkbox>
            {sections.slice(0, 6).map((section) => (
              <p key={section}>
                {group} detail {section}. A change made here applies to every traveller on the trip.
              </p>
            ))}
          </Disclosure>
        ))}
      </Dialog>
    </DialogTrigger>
  );
}
