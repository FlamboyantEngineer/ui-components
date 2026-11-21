import { Button } from '../../src/components/button/button.js';
import { Dialog, DialogTrigger } from '../../src/components/dialog/index.js';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
} from '../../src/components/dropdown-menu/index.js';

export function ComposedDropdownMenu() {
  return (
    <DropdownMenuRoot>
      <Button variant="secondary">View settings</Button>
      <DropdownMenuContent selectionMode="single" defaultSelectedKeys={['comfortable']}>
        <DropdownMenuGroup title="Density">
          <DropdownMenuItem id="comfortable">Comfortable</DropdownMenuItem>
          <DropdownMenuItem id="compact">Compact</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuItem id="more">More views</DropdownMenuItem>
          <DropdownMenuContent selectionMode="single" defaultSelectedKeys={['list']}>
            <DropdownMenuItem id="list">List</DropdownMenuItem>
            <DropdownMenuItem id="timeline">Timeline</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

export function ComposedDropdownInDialog() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Open workspace settings</Button>
      <Dialog title="Workspace settings" showCloseButton>
        <ComposedDropdownMenu />
      </Dialog>
    </DialogTrigger>
  );
}
