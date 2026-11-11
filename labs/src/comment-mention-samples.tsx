import { createCommentMentions } from '../../src/components/comment-composer/rich/index.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { samplePeople } from './people-samples.js';

/** Who `@` finds: the sample people, matched by the start of a name, after a short delay. */
export const sampleMentions = createCommentMentions({
  search: (query, signal) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        const lower = query.toLowerCase();
        resolve(
          samplePeople
            .filter((person) =>
              person.name.split(' ').some((part) => part.toLowerCase().startsWith(lower)),
            )
            .map((person) => ({
              id: String(person.id),
              name: person.name,
              avatar: person.src,
              description: person.statusLabel,
            })),
        );
      }, 150);
      signal.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new Error('aborted'));
      });
    }),
});

/** The card a mention chip opens: the person's sample profile. */
export function renderSampleCard({ id, name }: { id: string; name: string }) {
  const person = samplePeople.find((candidate) => candidate.id === id);
  return person ? (
    <UserCard
      name={name}
      src={person.src}
      status={person.status}
      statusLabel={person.statusLabel}
    />
  ) : undefined;
}
