import { useId } from 'react';

/** A media type unique to one drag owner, so another owner's targets refuse its items. */
export function useDragType(scope: string): string {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  return `application/x-ui-${scope}-${id}`.toLowerCase();
}
