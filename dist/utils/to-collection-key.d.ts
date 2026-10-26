import type { Key } from '../core/props.js';
/** Encodes typed keys without whitespace for collection primitives that normalize DOM ids. */
export declare function toCollectionKey(key: Key): string;
/**
 * The collection key a library collection item hands its primitive for its optional `id`. Each
 * item encodes its own `id`, so one rendered through a host component (React Aria's reuse
 * pattern) keeps the key its collection's selection, disabled keys and panels are encoded to.
 */
export declare function toCollectionItemKey(id: Key | undefined): string | undefined;
//# sourceMappingURL=to-collection-key.d.ts.map