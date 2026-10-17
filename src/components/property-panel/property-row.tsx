import { useContext, useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  PropertyScopeContext,
  matchesPropertyScope,
  useReportPropertyTally,
} from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';

export interface PropertyRowProps extends BaseProps {
  /** The property's name, beside its control. A text label takes part in filtering and is marked. */
  label: ReactNode;
  /** The id of the control the label names; the label is then a `<label>` for it. */
  htmlFor?: string | undefined;
  /** More words a query may match, such as the names of a strip's cells. */
  keywords?: readonly string[] | undefined;
  /** The unit after the control, such as `px`. */
  unit?: string | undefined;
  /** A short caption under the control. */
  hint?: ReactNode;
  /** Supporting text for the whole row. */
  description?: ReactNode;
  /** Buttons at the end of the row. */
  actions?: ReactNode;
  /** The value is set here rather than inherited; sections and cards around it show a mark. */
  isOverridden?: boolean | undefined;
  /** Shows an asterisk after the label. The control announces the requirement itself. */
  isRequired?: boolean | undefined;
  /** Puts the label above a large control that spans the row. */
  wide?: boolean | undefined;
  /** The property's value or editable field. */
  children?: ReactNode;
}

interface RowLabelProps {
  id: string;
  htmlFor: string | undefined;
  children: ReactNode;
}

type RowControlProps = Pick<PropertyRowProps, 'htmlFor' | 'unit' | 'hint' | 'children'> & {
  labelId: string;
};

const hooks = createHooks('property-row', [
  'label',
  'required',
  'control',
  'unit',
  'hint',
  'description',
  'actions',
]);

const noKeywords: readonly string[] = [];

function RowLabel({ id, htmlFor, children }: RowLabelProps) {
  if (htmlFor === undefined) {
    return (
      <div {...hooks.slot('label')} id={id}>
        {children}
      </div>
    );
  }
  return (
    <label {...hooks.slot('label')} id={id} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

/** The control slot: named by the label as a group unless the label is bound to the control. */
function RowControl({ labelId, htmlFor, unit, hint, children }: RowControlProps) {
  const isGroup = htmlFor === undefined;
  return (
    <div
      {...hooks.slot('control')}
      role={isGroup ? 'group' : undefined}
      aria-labelledby={isGroup ? labelId : undefined}
    >
      {children}
      {unit ? <span {...hooks.slot('unit')}>{unit}</span> : null}
      {isEmptyNode(hint) ? null : <div {...hooks.slot('hint')}>{hint}</div>}
    </div>
  );
}

/**
 * One labelled property of a panel: the label, then the control with its unit and hint, a
 * description and actions. Under a query it hides, staying mounted, unless the enclosing path, its
 * label or its keywords hold every term.
 */
export function PropertyRow({
  label,
  htmlFor,
  keywords = noKeywords,
  unit,
  hint,
  description,
  actions,
  isOverridden = false,
  isRequired = false,
  wide = false,
  children,
  className,
  id,
  ...rest
}: PropertyRowProps) {
  const scope = useContext(PropertyScopeContext);
  const labelText = typeof label === 'string' ? label : undefined;
  const isMatch = matchesPropertyScope(scope, [labelText, ...keywords]);
  useReportPropertyTally(scope, { count: 1, matches: isMatch ? 1 : 0, isOverridden });
  const generatedId = useId();
  const labelId = `${id ?? generatedId}-label`;
  const data = { overridden: isOverridden, required: isRequired, wide };

  return (
    <div {...rest} {...hooks.root({ className, data })} id={id} hidden={!isMatch}>
      <RowLabel id={labelId} htmlFor={htmlFor}>
        {labelText === undefined ? label : <TextMatch>{labelText}</TextMatch>}
        {isRequired ? (
          <span {...hooks.slot('required')} aria-hidden="true">
            *
          </span>
        ) : null}
      </RowLabel>
      <RowControl labelId={labelId} htmlFor={htmlFor} unit={unit} hint={hint}>
        {children}
      </RowControl>
      {isEmptyNode(description) ? null : <div {...hooks.slot('description')}>{description}</div>}
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </div>
  );
}
