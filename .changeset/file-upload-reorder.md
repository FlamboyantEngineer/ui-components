---
'@flamboyantengineer/ui-components': minor
---

`FileUpload` lets the reader reorder the listed files with `onMove`: each file gets a drag handle (`ui-file-upload__file-handle`) that drags it by pointer or, from its press, by keyboard and screen reader, and Alt+ArrowUp and Alt+ArrowDown move it one place. `onMove` receives a `FileUploadMove` (`id`, `targetId`, `position`) and `moveFileUploadItem(files, move)` applies it, so files keep their ids, previews, progress, errors and focus, and a form submits them in the new order. Each move is announced in a status region (provider strings `moveFile` and `fileMoved`); rows publish `data-dragging` and `data-drop-position` during a drag. Disabled uploads refuse moves and read-only ones draw no handles.
