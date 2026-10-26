import { useRef, useState } from 'react';
function carriesFiles(event) {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}
/** The files chosen in the system file chooser, handed to `onAttach` when there are any. */
export function attachChosenFiles(list, onAttach) {
    const files = list ? Array.from(list) : [];
    if (files.length > 0)
        onAttach(files);
}
/** The files a paste carries, handed to `onAttach` instead of pasting; whether there were any. */
export function attachPastedFiles(event, onAttach) {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (!onAttach || files.length === 0)
        return false;
    event.preventDefault();
    onAttach(files);
    return true;
}
/**
 * Files dragged onto the composer: while a drag that carries files is over it, it is a drop
 * target, and dropping hands the files to `onAttach`. Drags of text are left to the text box.
 * React Aria's drop hooks cannot tell a file drag from a text drag before the drop, so this
 * follows the native drag events, counting entries into the composer's children.
 */
export function useFileDrop(onAttach) {
    const [isDropTarget, setDropTarget] = useState(false);
    const depth = useRef(0);
    const accepts = (event) => Boolean(onAttach) && carriesFiles(event);
    return {
        isDropTarget: isDropTarget && Boolean(onAttach),
        dropProps: {
            onDragEnter(event) {
                if (!accepts(event))
                    return;
                event.preventDefault();
                depth.current += 1;
                setDropTarget(true);
            },
            onDragOver(event) {
                if (!accepts(event))
                    return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            },
            onDragLeave(event) {
                if (!accepts(event))
                    return;
                depth.current = Math.max(0, depth.current - 1);
                if (depth.current === 0)
                    setDropTarget(false);
            },
            onDrop(event) {
                if (!accepts(event))
                    return;
                event.preventDefault();
                depth.current = 0;
                setDropTarget(false);
                const files = Array.from(event.dataTransfer.files);
                if (files.length > 0)
                    onAttach?.(files);
            },
        },
    };
}
//# sourceMappingURL=use-file-drop.js.map