import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createContext, type Dispatch, type SetStateAction, useContext, useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
  useProjectedContent,
} from './projection.js';

/** A labelled sample section around an outlet or a declaration. */
function region(name: string) {
  return screen.getByRole('region', { name });
}

describe('Projection', () => {
  it('UIC-PROJECTION-1.1 renders declared content at the outlet, without wrappers', () => {
    render(
      <ProjectionProvider>
        <header>
          <ProjectionOutlet slot="tools" />
        </header>
        <main>
          <ProjectionContent slot="tools">
            <button type="button">Share</button>
          </ProjectionContent>
        </main>
      </ProjectionProvider>,
    );
    const header = screen.getByRole('banner');
    expect(header.firstElementChild).toBe(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });

  it('UIC-PROJECTION-1.1 renders the content at every outlet of the slot', () => {
    render(
      <ProjectionProvider>
        <ProjectionOutlet slot="title" />
        <ProjectionOutlet slot="title" />
        <ProjectionOutlet slot="other" fallback="none" />
        <ProjectionContent slot="title">Harbour</ProjectionContent>
      </ProjectionProvider>,
    );
    expect(document.body).toHaveTextContent('HarbourHarbournone');
  });

  it('UIC-PROJECTION-1.2 keeps the declaring component state, callbacks and inner state', async () => {
    let publisherCalls = 0;
    function Counter() {
      const [count, setCount] = useState(0);
      publisherCalls += 1;
      return (
        <ProjectionContent slot="tools">
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Apples {count}
          </button>
          <input aria-label="Note" />
        </ProjectionContent>
      );
    }
    render(
      <ProjectionProvider>
        <ProjectionOutlet slot="tools" />
        <Counter />
      </ProjectionProvider>,
    );
    const callsAfterMount = publisherCalls;
    const note = screen.getByRole('textbox', { name: 'Note' });
    await userEvent.type(note, 'ripe');
    expect(publisherCalls).toBe(callsAfterMount);

    await userEvent.click(screen.getByRole('button', { name: 'Apples 0' }));
    expect(screen.getByRole('button', { name: 'Apples 1' })).toBeInTheDocument();
    expect(publisherCalls).toBe(callsAfterMount + 1);
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note).toHaveValue('ripe');
  });

  it('UIC-PROJECTION-1.3 renders the fallback while the slot has no content', () => {
    function Page({ shown, empty }: { shown: boolean; empty?: boolean }) {
      return (
        <ProjectionProvider>
          <ProjectionOutlet slot="tools" fallback={<span>No tools</span>} />
          {shown ? (
            <ProjectionContent slot="tools">{empty ? null : <span>Ruler</span>}</ProjectionContent>
          ) : null}
        </ProjectionProvider>
      );
    }
    const { rerender } = render(<Page shown={false} />);
    expect(screen.getByText('No tools')).toBeInTheDocument();
    rerender(<Page shown />);
    expect(screen.getByText('Ruler')).toBeInTheDocument();
    expect(screen.queryByText('No tools')).not.toBeInTheDocument();
    rerender(<Page shown empty />);
    expect(screen.getByText('No tools')).toBeInTheDocument();
    rerender(<Page shown={false} />);
    expect(screen.getByText('No tools')).toBeInTheDocument();
  });

  it('UIC-PROJECTION-1.4 shows the most recently mounted declaration and restores the previous one', () => {
    let setFirstLabel: Dispatch<SetStateAction<string>> = () => {};
    function First() {
      const [label, setLabel] = useState('Paris');
      setFirstLabel = setLabel;
      return <ProjectionContent slot="city">{label}</ProjectionContent>;
    }
    function Page({ second, slot }: { second: boolean; slot: string }) {
      return (
        <ProjectionProvider>
          <section aria-label="City">
            <ProjectionOutlet slot="city" />
          </section>
          <section aria-label="Town">
            <ProjectionOutlet slot="town" />
          </section>
          <First />
          {second ? <ProjectionContent slot={slot}>Lisbon</ProjectionContent> : null}
        </ProjectionProvider>
      );
    }
    const { rerender } = render(<Page second={false} slot="city" />);
    expect(region('City')).toHaveTextContent('Paris');

    rerender(<Page second slot="city" />);
    expect(region('City')).toHaveTextContent('Lisbon');

    act(() => setFirstLabel('Rome'));
    expect(region('City')).toHaveTextContent('Lisbon');

    rerender(<Page second slot="town" />);
    expect(region('City')).toHaveTextContent('Rome');
    expect(region('Town')).toHaveTextContent('Lisbon');

    rerender(<Page second={false} slot="town" />);
    expect(region('Town')).toBeEmptyDOMElement();
    expect(region('City')).toHaveTextContent('Rome');
  });

  it('UIC-PROJECTION-1.5 reads context at the outlet, not at the declaration', () => {
    const Season = createContext('none');
    function SeasonLabel() {
      return <span>{useContext(Season)}</span>;
    }
    render(
      <ProjectionProvider>
        <Season value="summer">
          <section aria-label="Outlet">
            <ProjectionOutlet slot="season" />
          </section>
        </Season>
        <Season value="winter">
          <ProjectionContent slot="season">
            <SeasonLabel />
          </ProjectionContent>
        </Season>
      </ProjectionProvider>,
    );
    expect(region('Outlet')).toHaveTextContent('summer');
  });

  it('UIC-PROJECTION-1.6 renders in place without a provider', () => {
    render(
      <>
        <section aria-label="Outlet">
          <ProjectionOutlet slot="tools" fallback="Fallback" />
        </section>
        <section aria-label="Origin">
          <ProjectionContent slot="tools">
            <button type="button">Zoom</button>
          </ProjectionContent>
        </section>
      </>,
    );
    expect(region('Outlet')).toHaveTextContent('Fallback');
    expect(region('Origin')).toContainElement(screen.getByRole('button', { name: 'Zoom' }));
  });

  it('UIC-PROJECTION-1.7 lets a scoped provider own its slots and pass the others up', () => {
    function Page({ inner }: { inner: boolean }) {
      return (
        <ProjectionProvider>
          <section aria-label="Outer tools">
            <ProjectionOutlet slot="tools" fallback="none" />
          </section>
          <ProjectionProvider slots={['title']}>
            <section aria-label="Inner title">
              <ProjectionOutlet slot="title" fallback="untitled" />
            </section>
            <section aria-label="Inner tools">
              <ProjectionOutlet slot="tools" fallback="none" />
            </section>
            {inner ? (
              <>
                <ProjectionContent slot="title">Harbour</ProjectionContent>
                <ProjectionContent slot="tools">Ruler</ProjectionContent>
              </>
            ) : null}
          </ProjectionProvider>
          <section aria-label="Outer title">
            <ProjectionOutlet slot="title" fallback="untitled" />
          </section>
        </ProjectionProvider>
      );
    }
    const { rerender } = render(<Page inner />);
    expect(region('Inner title')).toHaveTextContent('Harbour');
    expect(region('Outer title')).toHaveTextContent('untitled');
    expect(region('Outer tools')).toHaveTextContent('Ruler');
    expect(region('Inner tools')).toHaveTextContent('Ruler');
    rerender(<Page inner={false} />);
    expect(region('Inner title')).toHaveTextContent('untitled');
    expect(region('Outer tools')).toHaveTextContent('none');
  });

  it('UIC-PROJECTION-1.7 owns every slot without an enclosing provider', () => {
    render(
      <ProjectionProvider slots={['title']}>
        <section aria-label="Tools">
          <ProjectionOutlet slot="tools" />
        </section>
        <ProjectionContent slot="tools">Ruler</ProjectionContent>
      </ProjectionProvider>,
    );
    expect(region('Tools')).toHaveTextContent('Ruler');
  });

  it('UIC-PROJECTION-1.8 reads a slot, undefined while it has no content', () => {
    const seen: unknown[] = [];
    function Reader() {
      const content = useProjectedContent('tools');
      seen.push(content);
      return content === undefined ? (
        <span>empty</span>
      ) : (
        <section aria-label="Holder">{content}</section>
      );
    }
    function Page({ content }: { content?: string | false | null }) {
      return (
        <ProjectionProvider>
          <Reader />
          {content === undefined ? null : (
            <ProjectionContent slot="tools">{content}</ProjectionContent>
          )}
        </ProjectionProvider>
      );
    }
    const { rerender } = render(<Page />);
    expect(screen.getByText('empty')).toBeInTheDocument();
    rerender(<Page content="Ruler" />);
    expect(region('Holder')).toHaveTextContent('Ruler');
    for (const empty of [false, null, ''] as const) {
      rerender(<Page content={empty} />);
      expect(screen.getByText('empty')).toBeInTheDocument();
    }
    expect(seen.at(-1)).toBeUndefined();
  });
});
