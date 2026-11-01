// Cases of the annotation layer lab in which the layer's surroundings change how its anchors show:
// a zoomed surface around the layer.

import { useLayoutEffect, useRef, useState } from 'react';
import {
  AnnotationLayer,
  AnnotationMargin,
  type AnnotationLayerHandle,
} from '../../src/components/annotation-layer/annotation-layer.js';
import { Button } from '../../src/components/button/button.js';
import type { Key } from '../../src/core/props.js';

const zooms = {
  'Actual size': [1, 1],
  'Zoom 150%': [1.5, 1.5],
  'Stretch 150% by 200%': [1.5, 2],
} as const;

type Zoom = keyof typeof zooms;

/**
 * A review drawn on a surface the caller zooms with a CSS scale, the same or different across and
 * down. A transform moves nothing the layer can observe, so the caller asks it to measure again.
 */
export function ZoomedReview() {
  const [zoom, setZoom] = useState<Zoom>('Zoom 150%');
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const handleRef = useRef<AnnotationLayerHandle>(null);
  useLayoutEffect(() => handleRef.current?.remeasure(), [zoom]);
  const [scaleX, scaleY] = zooms[zoom];
  return (
    <div data-lab-demo="zoomed">
      <p>
        {Object.keys(zooms).map((name) => (
          <Button
            key={name}
            size="sm"
            variant={name === zoom ? 'primary' : 'secondary'}
            onPress={() => setZoom(name as Zoom)}
          >
            {name}
          </Button>
        ))}{' '}
        <Button size="sm" variant="ghost" onPress={() => setCurrentKey(null)}>
          Clear
        </Button>{' '}
        Active: <output data-lab-active>{currentKey ?? 'none'}</output>
      </p>
      <div style={{ height: 320, overflow: 'auto' }}>
        <div
          data-lab-zoom={zoom}
          style={{ width: 560, transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: '0 0' }}
        >
          <AnnotationLayer
            annotations={[{ id: 'glaze', targetId: 'zoomed-glaze' }]}
            currentKey={currentKey}
            onCurrentKeyChange={setCurrentKey}
            handleRef={handleRef}
          >
            <p>
              Brush with milk, <span id="zoomed-glaze">dust with sugar</span> and bake.
            </p>
            <AnnotationMargin renderCard={() => 'Glaze note'} />
          </AnnotationLayer>
        </div>
      </div>
    </div>
  );
}
