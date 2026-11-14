import { Button } from '../src/components/button/button.js';
import { Card } from '../src/components/card/card.js';
import { usePreviewOwner } from '../src/components/hover-card/preview-trigger.js';
import type { IconSource } from '../src/components/icon/icon.js';

/** Host content keeps action policy while PreviewTrigger owns the overlay. */
export function PreviewContent({
  name,
  actions,
  onAction,
}: {
  name: string;
  actions?: readonly { id: string; label: string; icon?: IconSource }[];
  onAction?: (id: string) => void;
}) {
  const owner = usePreviewOwner();
  const content = (
    <Card title={name}>
      {actions?.map((action) => (
        <Button
          key={action.id}
          startIcon={action.icon}
          onPress={(event) => {
            owner?.dismiss(event.target);
            onAction?.(action.id);
          }}
        >
          {action.label}
        </Button>
      ))}
    </Card>
  );
  return owner ? (
    content
  ) : (
    <section role="dialog" aria-label={name}>
      {content}
    </section>
  );
}
