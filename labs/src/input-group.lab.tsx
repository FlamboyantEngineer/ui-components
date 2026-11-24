import { useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '../../src/components/input-group/input-group.js';
import { usePromptSubmission } from '../../src/components/message-composer/message-composer.js';
import { ArrowUpGlyph, CloseGlyph, PlusGlyph } from '../../src/core/glyphs.js';
import { Glyph } from '../../src/core/provider.js';
import { LabSection, mountLab } from './chrome/index.js';

function Address() {
  const [value, setValue] = useState('');
  return (
    <InputGroup aria-label="Website address">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Domain"
        placeholder="example.com"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          icon={CloseGlyph}
          label="Clear domain"
          size="xs"
          onPress={() => setValue('')}
        />
      </InputGroupAddon>
    </InputGroup>
  );
}

function Quantity() {
  const [quantity, setQuantity] = useState(0);
  return (
    <InputGroup aria-label="Quantity controls">
      <InputGroupInput aria-label="Quantity" value={quantity} readOnly />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onPress={() => setQuantity(0)}>Reset quantity</InputGroupButton>
        <InputGroupButton
          content="icon"
          size="sm"
          aria-label="Increase quantity"
          onPress={() => setQuantity((current) => current + 1)}
        >
          <Glyph icon={PlusGlyph} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function Prompt() {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState('');
  const prompt = usePromptSubmission({ value, onChange: setValue, onSubmit: setSent });
  return (
    <form aria-label="Send a message" onSubmit={prompt.onSubmit}>
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>At least three characters</InputGroupText>
        </InputGroupAddon>
        <InputGroupTextarea
          aria-label="Message"
          name="message"
          minLength={3}
          rows={2}
          value={value}
          onChange={prompt.onChange}
          onKeyDown={prompt.onKeyDown}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            type="submit"
            variant="primary"
            size="sm"
            icon={ArrowUpGlyph}
            label="Send"
            isDisabled={!prompt.canSubmit}
          />
        </InputGroupAddon>
      </InputGroup>
      <p aria-live="polite">{sent && `Sent: ${sent}`}</p>
    </form>
  );
}

mountLab(
  <>
    <LabSection title="Inline addons">
      <Address />
    </LabSection>
    <LabSection title="Block addons">
      <Prompt />
    </LabSection>
    <LabSection title="Button layouts">
      <Quantity />
    </LabSection>
  </>,
);
