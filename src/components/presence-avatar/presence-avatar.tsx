import { Button as AriaButton, type PressEvent } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, type AvatarIdentity } from '../avatar/avatar.js';

export type PresenceAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface PresenceAvatarProps extends AvatarIdentity {
  /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, `idle`, …). */
  status?: string | undefined;
  /** Human-readable status, added to the accessible name (`Maria Santos, Away`). */
  statusLabel?: string | undefined;
  /** Avatar size. Defaults to `md`. */
  size?: PresenceAvatarSize | undefined;
  /** How many colour slots the host stylesheet defines, passed to the avatar. */
  colorCount?: number | undefined;
  /** Makes the avatar a button that runs this on click, Enter or Space. */
  onPress?: ((event: PressEvent) => void) | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('presence-avatar', ['avatar', 'indicator']);

/**
 * One person's avatar marked with what they are doing, optionally pressable. The avatar carries the
 * accessible name, so a pressable one is named by its content rather than by a label that hides the
 * visible initials.
 */
export function PresenceAvatar({
  name,
  src,
  initials,
  colorKey,
  colorIndex,
  kind,
  status,
  statusLabel,
  size = 'md',
  colorCount,
  onPress,
  className,
  id,
  ...rest
}: PresenceAvatarProps) {
  const strings = useUiStrings();
  const displayName = name.trim() || strings.unnamed;
  const statusText = statusLabel?.trim();
  const label = statusText ? strings.nameWithStatus(displayName, statusText) : displayName;
  const statusValue = status?.trim() || undefined;
  const rootProps = hooks.root({ className, props: rest, data: { size, status: statusValue } });
  const content = (
    <>
      <Avatar
        name={name}
        src={src}
        initials={initials}
        colorKey={colorKey}
        colorIndex={colorIndex}
        colorCount={colorCount}
        kind={kind}
        size={size}
        label={label}
        className={hooks.slotClass('avatar')}
      />
      {statusValue ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
    </>
  );

  if (onPress) {
    return (
      <AriaButton {...rootProps} id={id} onPress={onPress}>
        {content}
      </AriaButton>
    );
  }
  return (
    <span {...rootProps} id={id}>
      {content}
    </span>
  );
}
