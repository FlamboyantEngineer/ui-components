import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuTrigger,
} from '../../src/components/context-menu/index.js';
import { LabOutput } from './lab-output.js';

export function ComposedContextMenu() {
  const [showGrid, setShowGrid] = useState(false);
  const [exported, setExported] = useState('None');
  return (
    <>
      <ContextMenuTrigger aria-label="Canvas actions">
        <Button variant="secondary">Canvas target</Button>
        <ContextMenuContent>
          <ContextMenuGroup title="Canvas">
            <ContextMenuItem
              id="grid"
              isSelected={showGrid}
              onAction={() => setShowGrid(!showGrid)}
            >
              Show grid
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuItem id="export">Export</ContextMenuItem>
            <ContextMenuSubContent>
              <ContextMenuContent>
                <ContextMenuItem id="svg" onAction={() => setExported('SVG')}>
                  SVG
                </ContextMenuItem>
                <ContextMenuItem id="png" onAction={() => setExported('PNG')}>
                  PNG
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenuTrigger>
      <LabOutput name="Export format">{exported}</LabOutput>
    </>
  );
}
