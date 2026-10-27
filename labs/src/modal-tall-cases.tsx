import { Modal, ModalTrigger, type ModalSize } from '../../src/components/modal/modal.js';
import { Button } from '../../src/components/button/button.js';
import { StateMatrix } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const satisfies readonly ModalSize[];
const sections = Array.from({ length: 24 }, (_, index) => index + 1);

/** Dialogs whose body is taller than the viewport: the panel stays on screen and the body scrolls. */
export function ModalTallCases() {
  return (
    <StateMatrix
      axes={{ size: sizes }}
      render={({ size }) => (
        <ModalTrigger>
          <Button size="sm">Open the {size} terms</Button>
          <Modal
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
          </Modal>
        </ModalTrigger>
      )}
    />
  );
}
