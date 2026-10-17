import { useId, type ReactNode } from 'react';

export interface LabSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** One titled block of a lab page. */
export function LabSection({ title, description, children }: LabSectionProps) {
  const id = useId();
  return (
    <section aria-labelledby={id} data-lab-section={title}>
      <h2 id={id}>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
