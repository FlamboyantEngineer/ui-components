'use client';

import { useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { FieldScopeContext, useFieldScope } from './field-scope.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

export interface FieldsetProps extends Omit<NativeProps<'fieldset'>, 'disabled'>, BaseProps {
  /** The group's caption, drawn in a `<legend>`, which names the group. */
  legend?: ReactNode;
  /** Disables every field and native control inside, as an enclosing disabled fieldset does. */
  isDisabled?: boolean | undefined;
  children?: ReactNode;
}

const hooks = createHooks('fieldset', ['legend']);

/**
 * Groups fields under a legend on a native `<fieldset>`. Disabling it disables every field inside:
 * their state refuses changes as well as their native controls.
 */
export function Fieldset({
  legend,
  isDisabled = false,
  className,
  children,
  ...rest
}: FieldsetProps) {
  const parent = useFieldScope();
  const isGroupDisabled = Boolean(parent.isDisabled || isDisabled);
  const scope = useMemo(
    () => ({ ...parent, isDisabled: isGroupDisabled }),
    [parent, isGroupDisabled],
  );
  return (
    <fieldset
      {...rest}
      {...hooks.root({ className, props: rest, data: { disabled: isGroupDisabled } })}
      disabled={isDisabled || undefined}
    >
      {isEmptyNode(legend) ? null : <legend {...hooks.slot('legend')}>{legend}</legend>}
      <FieldScopeContext value={scope}>{children}</FieldScopeContext>
    </fieldset>
  );
}
