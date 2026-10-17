import { useState, type JSX } from 'react';
import {
  GridList,
  GridListItem,
  useDragAndDrop,
  type ItemDropTarget,
  type Key,
} from 'react-aria-components';
import { armHandleDrag, DragHandle } from '../../src/components/drag-handle/drag-handle.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const FRUIT = ['Apple', 'Banana', 'Cherry', 'Fig'];

function moveBeside(names: readonly string[], keys: Set<Key>, target: ItemDropTarget) {
  const moving = names.filter((name) => keys.has(name));
  const rest = names.filter((name) => !keys.has(name));
  const index = rest.indexOf(String(target.key)) + (target.dropPosition === 'after' ? 1 : 0);
  return [...rest.slice(0, index), ...moving, ...rest.slice(index)];
}

/** A row element without React Aria's `draggable`, so only its handle starts a pointer drag. */
function HandleRow({ draggable: _draggable, ...props }: JSX.IntrinsicElements['div']) {
  return <div {...props} />;
}

function FruitList({ isHandleOnly = false }: { isHandleOnly?: boolean }) {
  const [names, setNames] = useState(FRUIT);
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => setNames((current) => moveBeside(current, keys, target)),
  });
  return (
    <div
      data-lab-list={isHandleOnly ? 'handle' : 'row'}
      onPointerDownCapture={isHandleOnly ? armHandleDrag : undefined}
    >
      <GridList
        aria-label={isHandleOnly ? 'Fruit, dragged by handle' : 'Fruit'}
        items={names.map((name) => ({ id: name }))}
        dragAndDropHooks={dragAndDropHooks}
      >
        {(item) => (
          <GridListItem textValue={item.id} render={isHandleOnly ? HandleRow : undefined}>
            <DragHandle isDisabled={item.id === 'Fig'} />
            {item.id}
          </GridListItem>
        )}
      </GridList>
      <p data-lab-output>Order: {names.join(', ')}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A handle on its own, named here by an aria-label, enabled and disabled."
    >
      <StateMatrix
        axes={{ state: ['enabled', 'disabled'] }}
        render={({ state }) => (
          <DragHandle aria-label="Drag Report.pdf" isDisabled={state === 'disabled'} />
        )}
      />
    </LabSection>
    <LabSection
      title="In a reorderable list"
      description="Each row draws a handle the list names after it. Focus a row, press ArrowRight to reach its handle and Enter to drag it with the arrow keys. Fig's handle is disabled."
    >
      <FruitList />
    </LabSection>
    <LabSection
      title="Dragging by the handle only"
      description="The list renders its rows without draggable and arms a row from its handle, so a press on the row's text never drags it."
    >
      <FruitList isHandleOnly />
    </LabSection>
  </>,
);
