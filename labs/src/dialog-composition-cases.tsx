import { Button } from '../../src/components/button/button.js';
import {
  AlertDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  type SheetSide,
} from '../../src/components/dialog/dialog.js';
import { LabSection } from './chrome/index.js';

const sides: SheetSide[] = ['right', 'left', 'top', 'bottom'];

export function ComposedDialogCases() {
  return (
    <>
      <LabSection
        title="Composed dialogs"
        description="Build a dialog with a title, description, body and footer. The alert stays open on outside presses."
      >
        <DialogTrigger>
          <Button size="sm">View delivery details</Button>
          <Dialog>
            <DialogHeader>
              <DialogTitle>Delivery details</DialogTitle>
              <DialogDescription>The parcel ships on Tuesday.</DialogDescription>
            </DialogHeader>
            <DialogBody>Tracking appears once the parcel has shipped.</DialogBody>
            <DialogFooter>
              <DialogClose>Done</DialogClose>
            </DialogFooter>
          </Dialog>
        </DialogTrigger>{' '}
        <DialogTrigger>
          <Button size="sm">Review interrupted delivery</Button>
          <AlertDialog>
            <DialogHeader>
              <DialogTitle>Delivery interrupted</DialogTitle>
              <DialogDescription>A new address is required.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose autoFocus>Return to address</DialogClose>
            </DialogFooter>
          </AlertDialog>
        </DialogTrigger>
      </LabSection>
      <LabSection
        title="Sheets"
        description="A sheet opens a dialog at a viewport edge. Close it with Escape, the Done button or a press outside."
      >
        {sides.map((side) => (
          <DialogTrigger key={side}>
            <Button size="sm">Open {side} sheet</Button>
            <Sheet side={side} size="sm">
              <DialogHeader>
                <DialogTitle>Order summary</DialogTitle>
                <DialogDescription>One parcel is ready to ship.</DialogDescription>
              </DialogHeader>
              <DialogBody>Standard delivery</DialogBody>
              <DialogFooter>
                <DialogClose>Done</DialogClose>
              </DialogFooter>
            </Sheet>
          </DialogTrigger>
        ))}
      </LabSection>
    </>
  );
}
