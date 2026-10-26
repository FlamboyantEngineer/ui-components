import { DropIndicator } from '../primitives/index.js';
import type { CollectionDropTarget } from './use-reorder-drag-and-drop.js';

/** A stable collection landing renderer with the owning component's styling hook. */
export function createDropIndicator(className: string) {
  return (target: CollectionDropTarget) => (
    <DropIndicator
      target={target}
      className={className}
      render={(props) => (
        <div {...props} data-position={target.type === 'item' ? target.dropPosition : undefined} />
      )}
    />
  );
}
