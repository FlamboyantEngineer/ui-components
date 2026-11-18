import type { CSSProperties, ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** One face of the stack, listed from the top. */
export interface EquipmentStackFace {
  /** A key that stays the same for this face while the stack changes. */
  id: Key;
  /** The face's name, shown on it and read as its list item. */
  label: ReactNode;
  /** The face's height in stack units: a positive number, fractions allowed. */
  units: number;
  /** A reading the caller formats, such as a measured value. */
  readout?: ReactNode;
  /** A status the caller formats, such as a short state text or a badge. */
  status?: ReactNode;
  /** Marks a position whose unit is absent: it keeps its height and shows the stack's `missingPlaceholder`. */
  isMissing?: boolean | undefined;
}

export interface EquipmentStackProps
  extends
    BaseProps,
    RefProps<HTMLOListElement>,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby' | 'aria-describedby'> {
  /** The faces, from the top of the stack. */
  faces: readonly EquipmentStackFace[];
  /** The stack's width divided by the height of one unit, such as `10` for a stack ten units of height wide. */
  unitRatio: number;
  /** Shown in place of the readout and status of each missing face, such as "Empty". */
  missingPlaceholder?: ReactNode;
}

const hooks = createHooks('equipment-stack', ['face', 'label', 'readout', 'status', 'placeholder']);

/** A number the stylesheet can divide by: positive and finite, else `fallback`. */
function toPositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function FaceContent({
  face,
  missingPlaceholder,
}: {
  face: EquipmentStackFace;
  missingPlaceholder: ReactNode;
}) {
  if (face.isMissing) {
    return isEmptyNode(missingPlaceholder) ? null : (
      <div {...hooks.slot('placeholder')}>{missingPlaceholder}</div>
    );
  }
  return (
    <>
      {isEmptyNode(face.readout) ? null : <div {...hooks.slot('readout')}>{face.readout}</div>}
      {isEmptyNode(face.status) ? null : <div {...hooks.slot('status')}>{face.status}</div>}
    </>
  );
}

/**
 * A read-only, ordered stack of faces drawn to scale: each face is as tall as its units, and one
 * unit's height is the stack's width divided by `unitRatio`.
 */
export function EquipmentStack({
  faces,
  unitRatio,
  missingPlaceholder,
  className,
  ...rest
}: EquipmentStackProps) {
  return (
    <ol
      {...rest}
      {...hooks.root({ className })}
      style={
        measuredProperty('equipment-stack-ratio', String(toPositive(unitRatio, 1))) as CSSProperties
      }
    >
      {faces.map((face) => (
        <li
          key={face.id}
          {...hooks.slot('face', { missing: face.isMissing === true })}
          style={
            measuredProperty(
              'equipment-stack-units',
              String(toPositive(face.units, 1)),
            ) as CSSProperties
          }
        >
          <div {...hooks.slot('label')}>{face.label}</div>
          <FaceContent face={face} missingPlaceholder={missingPlaceholder} />
        </li>
      ))}
    </ol>
  );
}
