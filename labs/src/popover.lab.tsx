import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Popover,
  PopoverTrigger,
  type PopoverProps,
} from '../../src/components/popover/popover.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const placements = ['top', 'bottom', 'start', 'end'] as const;
const arrows = ['no arrow', 'arrow'] as const;
const parts = ['title and close button', 'title only', 'body only'] as const;
const options = ['offset 16', 'cross offset 24', 'no flip'] as const;
const dismissals = ['Escape refused', 'outside presses refused'] as const;

/** A field whose Escape clears its draft first, handling the key, and lets the next one pass. */
function DraftField({ label }: { label: string }) {
  return (
    <label>
      {label}{' '}
      <input
        data-lab-draft=""
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || event.currentTarget.value === '') return;
          event.currentTarget.value = '';
          event.preventDefault();
        }}
      />
    </label>
  );
}

/** A trigger button and the popover it opens. */
function Opener({ label, ...props }: PopoverProps & { label: string }) {
  return (
    <PopoverTrigger>
      <Button size="sm">{label}</Button>
      <Popover {...props} />
    </PopoverTrigger>
  );
}

function partProps(part: (typeof parts)[number]): Partial<PopoverProps> {
  switch (part) {
    case 'title and close button':
      return { title: 'Opening hours', showCloseButton: true };
    case 'title only':
      return { title: 'Opening hours' };
    default:
      return { 'aria-label': 'Opening hours' };
  }
}

function optionProps(option: (typeof options)[number]): Partial<PopoverProps> {
  switch (option) {
    case 'offset 16':
      return { offset: 16 };
    case 'cross offset 24':
      return { crossOffset: 24 };
    default:
      return { placement: 'top', shouldFlip: false };
  }
}

function dismissalProps(dismissal: (typeof dismissals)[number]): Partial<PopoverProps> {
  return dismissal === 'Escape refused'
    ? { isKeyboardDismissDisabled: true }
    : { shouldCloseOnInteractOutside: () => false };
}

/** A non-modal popover beside a page counter that stays pressable. */
function NonModal() {
  const [count, setCount] = useState(0);
  return (
    <div data-lab-page="">
      <Opener
        label="Show notes"
        data-lab-popover="notes"
        isNonModal
        showArrow
        placement="end"
        title="Notes"
      >
        <p>Pack an umbrella for Bergen.</p>
      </Opener>{' '}
      <Button size="sm" data-lab-counter="" onPress={() => setCount(count + 1)}>
        Count visits
      </Button>{' '}
      Visits: <output data-lab-output="visits">{count}</output>
    </div>
  );
}

/** A popover opened by a button but placed against the search box beside it. */
function CustomAnchor() {
  const anchorRef = useRef<HTMLLabelElement>(null);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <label ref={anchorRef} data-lab-anchor="">
        Search <input defaultValue="Coastal towns" />
      </label>
      <PopoverTrigger>
        <Button size="sm" data-lab-open="anchored">
          Search options
        </Button>
        <Popover
          triggerRef={anchorRef}
          placement="bottom start"
          title="Search options"
          showArrow
          data-lab-popover="anchored"
        >
          <label>
            <input type="checkbox" defaultChecked /> Match whole words
          </label>
        </Popover>
      </PopoverTrigger>
    </div>
  );
}

/** A popover the page opens itself, against a summary it does not contain. */
function Controlled() {
  const [isOpen, setOpen] = useState(false);
  const [applied, setApplied] = useState('none');
  const summaryRef = useRef<HTMLParagraphElement>(null);
  return (
    <div>
      <p ref={summaryRef} data-lab-summary="" style={{ display: 'inline-block' }}>
        Trip to Kyoto, 12 to 16 October
      </p>{' '}
      <Button size="sm" data-lab-open="controlled" onPress={() => setOpen(true)}>
        Edit dates
      </Button>
      <p>
        Open: <output data-lab-output="controlled">{isOpen ? 'open' : 'closed'}</output>, applied:{' '}
        <output data-lab-output="applied">{applied}</output>
      </p>
      <Popover
        isOpen={isOpen}
        onOpenChange={setOpen}
        triggerRef={summaryRef}
        title="Dates"
        showCloseButton
        data-lab-popover="controlled"
      >
        {({ close }) => (
          <Button
            size="sm"
            onPress={() => {
              setApplied('13 to 17 October');
              close();
            }}
          >
            Shift by a day
          </Button>
        )}
      </Popover>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Placements and arrow"
      description="Each cell opens a popover on that side of its button, with consistent spacing even when the browser reserves scrollbar space, with or without an arrow. Escape, the close button or a press outside closes it and focus returns to the button."
    >
      <StateMatrix
        axes={{ placement: placements, arrow: arrows }}
        render={({ placement, arrow }) => (
          <div
            style={{
              paddingBlock: 24,
              paddingInlineStart: 120,
              paddingInlineEnd: 24,
              minWidth: 120,
            }}
          >
            <Opener
              label={`Open ${placement}`}
              placement={placement}
              showArrow={arrow === 'arrow'}
              title="Filters"
              showCloseButton
              data-lab-popover={`${placement}-${arrow}`}
            >
              <p>Cities within 50 km of Lisbon.</p>
              <label>
                Radius <input defaultValue="50" size={4} />
              </label>
            </Opener>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Parts"
      description="A title with a close button, a title alone, and a body named by aria-label."
    >
      <StateMatrix
        axes={{ parts }}
        render={({ parts: part }) => (
          <Opener label="Hours" data-lab-popover={part} {...partProps(part)}>
            <p>Open daily from 9:00 to 18:00.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Position options"
      description="A larger offset from the button, a shift along its side, and a popover that stays above its button even without room."
    >
      <StateMatrix
        axes={{ option: options }}
        render={({ option }) => (
          <Opener label={option} title="Weather" data-lab-popover={option} {...optionProps(option)}>
            <p>Sunny, 21 degrees.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Refused dismissal"
      description="One popover ignores Escape, the other ignores presses outside it; both close from their close button."
    >
      <StateMatrix
        axes={{ dismissal: dismissals }}
        render={({ dismissal }) => (
          <Opener
            label={dismissal}
            title="Draft"
            showCloseButton
            data-lab-popover={dismissal}
            {...dismissalProps(dismissal)}
          >
            <p>Your postcard is not sent yet.</p>
          </Opener>
        )}
      />
    </LabSection>
    <LabSection
      title="Non-modal popover"
      description="The page stays visible to assistive technology and the counter stays pressable while the notes are open; they close when focus leaves them."
    >
      <NonModal />
    </LabSection>
    <LabSection
      title="Custom anchor"
      description="The button opens the popover against the search box beside it; focus returns to the button on close."
    >
      <CustomAnchor />
    </LabSection>
    <LabSection
      title="Controlled popover"
      description="The page opens the popover against the trip summary; the close button and Shift by a day close it through the page's state."
    >
      <Controlled />
    </LabSection>
    <LabSection
      title="Escape handled inside"
      description="Type in Label, then press Escape: the field clears its draft and the popover stays open; the next Escape closes it."
    >
      <Opener label="Add label" title="Add label" data-lab-popover="handled">
        <DraftField label="Label" />
      </Opener>
    </LabSection>
  </>,
);
