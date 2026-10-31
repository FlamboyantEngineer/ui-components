'use client';

import { LinkGlyph, UnlinkGlyph } from '../../core/glyphs.js';
import { useState, type FormEvent } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { SelectField } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import { getBlockItems, type FormatItem } from './format-items.js';
import type { RichTextController } from './rich-text-controller.js';

interface FormatControlProps {
  controller: RichTextController;
}

interface OverlayControlProps extends FormatControlProps {
  /** The overlay's hook class. */
  className: string;
  /** Called after a command chosen in the overlay ran, to send focus back to the document. */
  onCommand: () => void;
}

function isToggle({ command }: FormatItem): boolean {
  return command.type === 'toggle-mark' || command.type === 'toggle-wrap';
}

/**
 * Buttons for the commands the schema supports; marks, lists and the quote are toggle buttons,
 * pressed while their effect holds. A pointer press keeps focus, and the selection, in the document.
 */
export function FormatButtons({ controller, items }: FormatControlProps & { items: FormatItem[] }) {
  return items
    .filter((item) => controller.supports(item.command))
    .map((item) => {
      const run = () => controller.run(item.command);
      const toggle = isToggle(item)
        ? { isSelected: controller.isActive(item.command), onChange: run }
        : { onPress: run };
      return (
        <Button
          key={item.id}
          {...toggle}
          icon={item.icon}
          label={item.label}
          tooltip={item.label}
          shortcut={item.shortcut}
          size="sm"
          isDisabled={!controller.can(item.command)}
          preventFocusOnPress
        />
      );
    });
}

/** The select of text block types; choosing one turns the selected blocks into it. */
export function BlockTypeSelect({ controller, className, onCommand }: OverlayControlProps) {
  const strings = useUiStrings();
  const items = getBlockItems(strings).filter((item) => controller.supports(item.command));
  const value = items.find((item) => controller.isActive(item.command))?.id ?? null;
  const choose = (key: Key | null) => {
    const item = items.find((candidate) => candidate.id === key);
    if (item && controller.run(item.command)) onCommand();
  };
  return (
    <SelectField
      size="sm"
      className={className}
      label={strings.blockType}
      labelLayout="control-only"
      placeholder={strings.blockType}
      options={items.map(({ id, label, icon }) => ({ id, label, icon }))}
      value={value}
      tracksChanges={false}
      onChange={choose}
      isDisabled={!controller.isEditable}
    />
  );
}

/**
 * The link button, pressed on a link, and its popover: an address field that links the selection
 * (or inserts the address at a caret), and a button that removes the link.
 */
export function LinkButton({ controller, className, onCommand }: OverlayControlProps) {
  const strings = useUiStrings();
  const [isOpen, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  if (isOpen && !controller.isEditable) setOpen(false);
  const href = address.trim();
  const finish = (isDone: boolean) => {
    if (!isDone) return;
    setOpen(false);
    onCommand();
  };
  const apply = (event: FormEvent) => {
    event.preventDefault();
    finish(controller.run({ type: 'set-link', href }));
  };
  return (
    <PopoverTrigger
      isOpen={isOpen && controller.isEditable}
      onOpenChange={(open) => {
        if (open) setAddress(controller.link ?? '');
        setOpen(open);
      }}
    >
      <Button
        icon={LinkGlyph}
        label={strings.link}
        tooltip={strings.link}
        size="sm"
        isSelected={controller.link !== null}
        isDisabled={!controller.isEditable}
      />
      <Popover className={className} placement="bottom start" aria-label={strings.link}>
        <form onSubmit={apply}>
          <TextField
            label={strings.linkAddress}
            inputMode="url"
            spellCheck={false}
            autoFocus
            value={address}
            onChange={setAddress}
          />
          <Button type="submit" variant="primary" size="sm" isDisabled={!href || !isSafeUrl(href)}>
            {strings.apply}
          </Button>
          {controller.link === null ? null : (
            <Button
              size="sm"
              startIcon={UnlinkGlyph}
              onPress={() => finish(controller.run({ type: 'set-link', href: null }))}
            >
              {strings.removeLink}
            </Button>
          )}
        </form>
      </Popover>
    </PopoverTrigger>
  );
}
