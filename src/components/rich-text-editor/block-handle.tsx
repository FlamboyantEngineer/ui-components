import { DragHandleGlyph, MoreVerticalGlyph } from '../../core/glyphs.js';
import { useEditorEventCallback } from '@handlewithcare/react-prosemirror';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useState, type DragEvent, type FocusEvent } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { MenuEntry } from '../menu/menu.js';
import { findTopBlocks } from './block-commands.js';
import { getBlockItems, getWrapItems } from './format-items.js';
import type { RichTextCommand } from './rich-text-command.js';
import type { RichTextController } from './rich-text-controller.js';
import { useRichTextController } from './rich-text-controller.js';
import { useBlockTarget } from './use-block-target.js';
import { useFocusReturn } from './use-focus-return.js';

export type BlockHandleProps = BaseProps;

const hooks = createHooks('block-handle', ['grip', 'menu']);

/** The block menu's commands by entry key: the turn-into entries, then the block actions. */
function getBlockCommands(strings: UiStrings, controller: RichTextController) {
  const turnInto = [...getBlockItems(strings), ...getWrapItems(strings)].filter((item) =>
    controller.supports(item.command),
  );
  const actions: Array<{ id: string; label: string; command: RichTextCommand }> = [
    { id: 'move-up', label: strings.moveUp, command: { type: 'move-block', direction: 'up' } },
    {
      id: 'move-down',
      label: strings.moveDown,
      command: { type: 'move-block', direction: 'down' },
    },
    { id: 'duplicate', label: strings.duplicate, command: { type: 'duplicate-block' } },
    { id: 'delete', label: strings.delete, command: { type: 'delete-block' } },
  ];
  return { turnInto, actions };
}

function toMenuEntries(
  strings: UiStrings,
  controller: RichTextController,
  { turnInto, actions }: ReturnType<typeof getBlockCommands>,
): MenuEntry[] {
  return [
    {
      id: 'turn-into',
      label: strings.turnInto,
      items: turnInto.map(({ id, label, icon }) => ({ id: `turn-into:${id}`, label, icon })),
    },
    { type: 'separator', id: 'actions' },
    ...actions.map(({ id, label, command }) => ({
      id,
      label,
      tone: id === 'delete' ? ('danger' as const) : undefined,
      isDisabled: !controller.can(command),
    })),
  ];
}

/**
 * Selects the block at `pos`: a caret at its start, or the block itself when it holds no text. A
 * selection over several blocks that include it stays, so the menu acts on all of them.
 */
function selectBlock(view: EditorView, pos: number) {
  const blocks = findTopBlocks(view.state);
  if (blocks && blocks.endIndex - blocks.index > 1 && blocks.from <= pos && pos < blocks.to) return;
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const selection = node.isAtom
    ? NodeSelection.create(view.state.doc, pos)
    : TextSelection.near(view.state.doc.resolve(pos + 1));
  view.dispatch(view.state.tr.setSelection(selection));
}

/**
 * A handle beside the hovered block, or the block holding the selection, in the enclosing
 * `RichTextEditor`, for its children: a grip that drags the block and a menu that turns it into
 * another type, moves, duplicates or deletes it. Alt+Shift+Up and Down move the block from the
 * keyboard.
 */
export function BlockHandle({ className, ...rest }: BlockHandleProps) {
  const strings = useUiStrings();
  const controller = useRichTextController();
  const focusReturn = useFocusReturn(controller);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const target = useBlockTarget(isMenuOpen);
  const select = useEditorEventCallback(selectBlock);
  const startDrag = useEditorEventCallback((view, event: DragEvent, pos: number) => {
    const selection = NodeSelection.create(view.state.doc, pos);
    view.dispatch(view.state.tr.setSelection(selection));
    const dom = view.nodeDOM(pos);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', selection.node.textContent);
    if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 0, 0);
    const dragging = { slice: selection.content(), move: true, node: selection };
    view.dragging = dragging;
  });
  if (isMenuOpen && !controller.isEditable) setMenuOpen(false);
  if (!target || !controller.isEditable) return null;
  const commands = getBlockCommands(strings, controller);
  const run = (key: Key) => {
    const id = String(key);
    const turnInto = commands.turnInto.find((item) => `turn-into:${item.id}` === id);
    const command =
      turnInto?.command ?? commands.actions.find((action) => action.id === id)?.command;
    if (command && controller.run(command)) focusReturn.request();
  };
  return (
    <div
      {...hooks.root({ className, props: rest, data: { dragging: target.isDragging } })}
      style={{ position: 'absolute', top: target.top }}
      ref={focusReturn.ref}
      onFocus={target.onFocus}
      onBlur={(event: FocusEvent) => target.onBlur(event)}
    >
      <span
        {...hooks.slot('grip')}
        aria-hidden="true"
        draggable
        onDragStart={(event) => {
          startDrag(event, target.pos);
          target.setDragging(true);
        }}
        onDragEnd={() => target.setDragging(false)}
      >
        <Glyph icon={DragHandleGlyph} />
      </span>
      <DropdownMenu
        className={hooks.slotClass('menu')}
        label={strings.blockActions}
        icon={MoreVerticalGlyph}
        iconOnly
        size="sm"
        menuSize="sm"
        isOpen={isMenuOpen}
        onOpenChange={(open) => {
          if (open) select(target.pos);
          setMenuOpen(open);
        }}
        items={toMenuEntries(strings, controller, commands)}
        onAction={run}
      />
    </div>
  );
}
