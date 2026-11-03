'use client';

import { useLayoutEffect, useRef } from 'react';
import type { ListFilterProps } from './list-filter.js';

interface FilterOperation<V> {
  base: V;
  next: V;
  controller: AbortController;
}

/** Cancels host work and error feedback once a controlled value supersedes it or the row unmounts. */
export function useFilterChange<V extends string>({
  value,
  options,
  onChange,
  onError,
}: Pick<ListFilterProps<V>, 'value' | 'options' | 'onChange' | 'onError'>) {
  const operationRef = useRef<FilterOperation<V> | null>(null);
  useLayoutEffect(() => {
    const operation = operationRef.current;
    if (operation && value !== operation.base && value !== operation.next) {
      operation.controller.abort();
      operationRef.current = null;
    }
  }, [value]);
  useLayoutEffect(
    () => () => {
      operationRef.current?.controller.abort();
      operationRef.current = null;
    },
    [],
  );

  return async (next: string | null): Promise<void> => {
    const option = options.find((item) => item.value === next);
    if (!option || option.isDisabled) return;
    const operation = { base: value, next: option.value, controller: new AbortController() };
    operationRef.current?.controller.abort();
    operationRef.current = operation;
    try {
      await onChange?.(option.value, operation.controller.signal);
    } catch (error) {
      if (!operation.controller.signal.aborted) onError?.(error);
      throw error;
    } finally {
      if (operationRef.current === operation) operationRef.current = null;
    }
  };
}
