import { getOwnerWindow, getTreeRoot } from '../../utils/owner-window.js';

type FileInputs = Map<HTMLInputElement, () => readonly File[]>;
type FormEntry = [string, FormDataEntryValue];

const roots = new WeakMap<
  Document | ShadowRoot,
  { inputs: FileInputs; onFormData: (event: Event) => void }
>();

function indexFiles(entries: readonly FormEntry[]): Map<string, number[]> {
  const positions = new Map<string, number[]>();
  entries.forEach(([name, value], index) => {
    if (typeof value === 'string') return;
    const indices = positions.get(name) ?? [];
    indices.push(index);
    positions.set(name, indices);
  });
  return positions;
}

function isSuccessfulFileInput(element: Element): element is HTMLInputElement {
  return (
    element.tagName === 'INPUT' &&
    element.getAttribute('type')?.toLowerCase() === 'file' &&
    Boolean(element.getAttribute('name')) &&
    !element.matches(':disabled') &&
    !element.closest('datalist')
  );
}

function findReplacements(
  form: HTMLFormElement,
  entries: readonly FormEntry[],
  inputs: FileInputs,
): Map<number, readonly File[]> {
  const positions = indexFiles(entries);
  const offsets = new Map<string, number>();
  const replacements = new Map<number, readonly File[]>();
  // Named controls can shadow form.elements; invoke the native getter with the form as receiver.
  const prototype = getOwnerWindow(form).HTMLFormElement.prototype;
  const controls = Reflect.get(prototype, 'elements', form) as HTMLFormControlsCollection;
  // Include unmanaged file inputs: even an empty one contributes a native File placeholder.
  for (const input of Array.from(controls).filter(isSuccessfulFileInput)) {
    const offset = offsets.get(input.name) ?? 0;
    const count = Math.max(1, input.files?.length ?? 0);
    offsets.set(input.name, offset + count);
    const listed = inputs.get(input)?.();
    if (!listed || (input.files?.length ?? 0) === listed.length) continue;
    const indices = positions.get(input.name)?.slice(offset, offset + count) ?? [];
    indices.forEach((index, part) => replacements.set(index, part === 0 ? listed : []));
  }
  return replacements;
}

function repairFormData(event: Event, inputs: FileInputs, root: Document | ShadowRoot) {
  if (!(event.target instanceof getOwnerWindow(root).HTMLFormElement)) return;
  if (!('formData' in event)) return;
  const { formData } = event as FormDataEvent;
  const entries = Array.from(formData.entries());
  const replacements = findReplacements(event.target, entries, inputs);
  if (replacements.size === 0) return;
  // Compute every replacement from the same native snapshot, then replay its full order. Deleting
  // a name independently would discard other uploads, strings and ordinary native files.
  for (const name of new Set(entries.map(([name]) => name))) formData.delete(name);
  entries.forEach(([name, value], index) => {
    const files = replacements.get(index);
    if (files) {
      for (const file of files) formData.append(name, file);
    } else formData.append(name, value);
  });
}

/** Repairs all uploads together, using each input's current form, name and native position. */
export function registerFileInput(input: HTMLInputElement, getFiles: () => readonly File[]) {
  const root = getTreeRoot(input);
  let registration = roots.get(root);
  if (!registration) {
    const inputs: FileInputs = new Map();
    const onFormData = (event: Event) => repairFormData(event, inputs, root);
    registration = { inputs, onFormData };
    roots.set(root, registration);
    // One listener per tree root also handles reassociated forms and non-composed shadow events.
    root.addEventListener('formdata', onFormData, true);
  }
  const { inputs, onFormData } = registration;
  inputs.set(input, getFiles);
  return () => {
    inputs.delete(input);
    if (inputs.size === 0) {
      root.removeEventListener('formdata', onFormData, true);
      roots.delete(root);
    }
  };
}
