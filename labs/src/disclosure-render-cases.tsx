import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTitle,
} from '../../src/components/disclosure/disclosure.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';

/** A group and its disclosures on the caller's own roots, each showing the state it receives. */
function RenderedRoots() {
  const [isDisabled, setDisabled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div data-lab-demo="rendered-roots" style={{ width: 380 }}>
      <Switch isSelected={isDisabled} onChange={setDisabled}>
        Disable the group
      </Switch>{' '}
      <Button size="sm" variant="secondary" onPress={() => triggerRef.current?.focus()}>
        Focus the packing trigger
      </Button>
      <DisclosureGroup
        isDisabled={isDisabled}
        allowsMultipleExpanded
        defaultExpandedKeys={['route']}
        render={(props, state) => (
          <div {...props} data-lab-rendered="group">
            <p data-lab-output="group-state">Group disabled: {String(state.isDisabled)}</p>
            {props.children}
          </div>
        )}
      >
        <Disclosure
          id="route"
          title="Route"
          render={(props, state) => (
            <div {...props} data-lab-rendered="route">
              {props.children}
              <p data-lab-output="route-state">
                Expanded: {String(state.isExpanded)} · disabled: {String(state.isDisabled)} · focus
                within: {String(state.isFocusVisibleWithin)}
              </p>
            </div>
          )}
        >
          <TextField label="Starting point" defaultValue="Old mill" />
        </Disclosure>
        <Disclosure
          id="packing"
          render={(props, state) => (
            <div {...props} data-lab-rendered="packing">
              {props.children}
              <p data-lab-output="packing-state">
                Expanded: {String(state.isExpanded)} · disabled: {String(state.isDisabled)}
              </p>
            </div>
          )}
        >
          <DisclosureTitle triggerRef={triggerRef}>Packing</DisclosureTitle>
          <DisclosurePanel
            role="region"
            render={(props, state) => (
              <div {...props} data-lab-rendered="packing-panel">
                {props.children}
                <p data-lab-output="panel-state">
                  Panel focus within: {String(state.isFocusVisibleWithin)}
                </p>
              </div>
            )}
          >
            <TextField label="Things to bring" defaultValue="Water and a map" />
          </DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    </div>
  );
}

export function DisclosureRenderCases() {
  return (
    <LabSection
      title="Caller roots and trigger focus"
      description="The group, both disclosures and the packing panel render on the caller's own elements, spreading the props they receive and showing the state they get. Type in a field, collapse and expand its disclosure: the text stays. Tab into a field to see focus within; disable the group to see every disabled state. Focus the packing trigger moves focus to its button through DisclosureTitle's triggerRef."
    >
      <RenderedRoots />
    </LabSection>
  );
}
