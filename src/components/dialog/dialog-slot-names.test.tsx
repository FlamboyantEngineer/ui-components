import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  AlertDialog,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  type DialogProps,
  DialogTitle,
  Sheet,
} from './dialog.js';

function Parts({ title }: { title: string }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Read before going on.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose>Close {title}</DialogClose>
      </DialogFooter>
    </>
  );
}

/** The data-slot names of one open dialog's parts, by part. */
function partNames(title: string, role: 'dialog' | 'alertdialog' = 'dialog') {
  const dialog = screen.getByRole(role, { name: title });
  const overlay = dialog.closest('.ui-dialog');
  const nameOf = (selector: string) => dialog.querySelector(selector)?.getAttribute('data-slot');
  return {
    overlay: overlay?.getAttribute('data-slot'),
    content: dialog.closest('.ui-dialog__panel')?.getAttribute('data-slot'),
    dialog: dialog.getAttribute('data-slot'),
    header: nameOf('.ui-dialog__header'),
    title: nameOf('.ui-dialog__title'),
    description: nameOf('.ui-dialog__description'),
    footer: nameOf('.ui-dialog__footer'),
    close: screen.getByRole('button', { name: `Close ${title}` }).getAttribute('data-slot'),
  };
}

function prefixed(prefix: string) {
  return {
    overlay: `${prefix}-overlay`,
    content: `${prefix}-content`,
    dialog: prefix,
    header: `${prefix}-header`,
    title: `${prefix}-title`,
    description: `${prefix}-description`,
    footer: `${prefix}-footer`,
    close: `${prefix}-close`,
  };
}

describe('Dialog part names', () => {
  const cases = {
    dialog: { draw: (props: DialogProps) => <Dialog {...props} />, prefix: 'dialog' },
    'alert dialog': {
      draw: (props: DialogProps) => <AlertDialog {...props} />,
      prefix: 'alert-dialog',
    },
    'alertdialog role': {
      draw: (props: DialogProps) => <Dialog role="alertdialog" {...props} />,
      prefix: 'alert-dialog',
    },
    sheet: { draw: (props: DialogProps) => <Sheet {...props} />, prefix: 'sheet' },
  };

  it.each(Object.keys(cases) as Array<keyof typeof cases>)(
    'UIC-DIALOG-23.2 names the parts of a %s after it',
    (name) => {
      const { draw, prefix } = cases[name];
      render(draw({ defaultOpen: true, children: <Parts title="Archive" /> }));
      const role = prefix === 'alert-dialog' ? 'alertdialog' : 'dialog';
      expect(partNames('Archive', role)).toEqual(prefixed(prefix));
      expectHooksMatchSpec(document.body, 'DIALOG', {
        slots: ['header', 'title', 'description', 'footer', 'close'],
      });
    },
  );

  it('UIC-DIALOG-23.2 names a dialog opened inside a sheet dialog-*', () => {
    render(
      <Sheet defaultOpen>
        <Parts title="Filters" />
        <Dialog defaultOpen isNonModal>
          <Parts title="Save filter" />
        </Dialog>
      </Sheet>,
    );
    expect(partNames('Filters')).toEqual(prefixed('sheet'));
    expect(partNames('Save filter')).toEqual(prefixed('dialog'));
  });
});
