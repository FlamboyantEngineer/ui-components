import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group.js';

it('UIC-INPUT-GROUP-1.1 UIC-INPUT-GROUP-1.2 focuses a grouped input from plain text and preserves button actions', async () => {
  const user = userEvent.setup();
  const onPress = vi.fn();
  const onSubmit = vi.fn();
  const { container } = render(
    <form onSubmit={onSubmit}>
      <InputGroup aria-label="Website address">
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-sm" onPress={onPress}>
            Copy
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>,
  );
  const input = screen.getByRole('textbox', { name: 'Domain' });
  const group = screen.getByRole('group', { name: 'Website address' });
  const copy = screen.getByRole('button', { name: 'Copy' });
  const prefix = screen.getByText('https://');
  expect(prefix.closest('.ui-input-group__addon')).toHaveAttribute('data-align', 'inline-start');
  expect(copy).toHaveAttribute('data-group-size', 'icon-sm');
  expect(copy).toHaveAttribute('type', 'button');
  await user.click(prefix);
  expect(input).toHaveFocus();
  expect(group).toHaveAttribute('data-focus-within', 'true');
  await user.click(copy);
  expect(copy).toHaveFocus();
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
  expectHooksMatchSpec(container, 'INPUT-GROUP');
});

it('UIC-INPUT-GROUP-1.2 focuses a textarea without taking focus from links or canceled clicks', async () => {
  const user = userEvent.setup();
  render(
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>Formatting</InputGroupText>
        <a href="#help">Help</a>
      </InputGroupAddon>
      <InputGroupTextarea aria-label="Message" />
      <InputGroupAddon align="block-end" onClick={(event) => event.preventDefault()}>
        <InputGroupText>Draft</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  const textarea = screen.getByRole('textbox', { name: 'Message' });
  const help = screen.getByRole('link', { name: 'Help' });
  await user.click(screen.getByText('Formatting'));
  expect(textarea).toHaveFocus();
  await user.click(help);
  expect(help).toHaveFocus();
  await user.click(screen.getByText('Draft'));
  expect(textarea).not.toHaveFocus();
});
