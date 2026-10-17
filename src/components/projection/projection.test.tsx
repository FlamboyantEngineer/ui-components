import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import { describe, expect, it } from 'vitest';
import { ProjectionContent, ProjectionOutlet, ProjectionProvider } from './projection.js';

describe('Projection', () => {
  it('UIC-PROJECTION-1.1 renders declared content at the outlet, without wrappers', () => {
    render(
      <ProjectionProvider>
        <header data-testid="header">
          <ProjectionOutlet slot="tools" />
        </header>
        <main data-testid="main">
          <ProjectionContent slot="tools">
            <button type="button">Share</button>
          </ProjectionContent>
        </main>
      </ProjectionProvider>,
    );
    const header = screen.getByTestId('header');
    expect(header.firstElementChild).toBe(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByTestId('main')).toBeEmptyDOMElement();
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
    let publisherRenders = 0;
    function Counter() {
      const [count, setCount] = useState(0);
      publisherRenders += 1;
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
    const rendersAfterMount = publisherRenders;
    const note = screen.getByRole('textbox', { name: 'Note' });
    await userEvent.type(note, 'ripe');
    expect(publisherRenders).toBe(rendersAfterMount);

    await userEvent.click(screen.getByRole('button', { name: 'Apples 0' }));
    expect(screen.getByRole('button', { name: 'Apples 1' })).toBeInTheDocument();
    expect(publisherRenders).toBe(rendersAfterMount + 1);
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
    expect(screen.queryByText('No tools')).toBeNull();
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
          <p data-testid="city">
            <ProjectionOutlet slot="city" />
          </p>
          <p data-testid="town">
            <ProjectionOutlet slot="town" />
          </p>
          <First />
          {second ? <ProjectionContent slot={slot}>Lisbon</ProjectionContent> : null}
        </ProjectionProvider>
      );
    }
    const { rerender } = render(<Page second={false} slot="city" />);
    expect(screen.getByTestId('city')).toHaveTextContent('Paris');

    rerender(<Page second slot="city" />);
    expect(screen.getByTestId('city')).toHaveTextContent('Lisbon');

    act(() => setFirstLabel('Rome'));
    expect(screen.getByTestId('city')).toHaveTextContent('Lisbon');

    rerender(<Page second slot="town" />);
    expect(screen.getByTestId('city')).toHaveTextContent('Rome');
    expect(screen.getByTestId('town')).toHaveTextContent('Lisbon');

    rerender(<Page second={false} slot="town" />);
    expect(screen.getByTestId('town')).toBeEmptyDOMElement();
    expect(screen.getByTestId('city')).toHaveTextContent('Rome');
  });

  it('UIC-PROJECTION-1.5 reads context at the outlet, not at the declaration', () => {
    const Season = createContext('none');
    function SeasonLabel() {
      return <span>{useContext(Season)}</span>;
    }
    render(
      <ProjectionProvider>
        <Season.Provider value="summer">
          <div data-testid="outlet">
            <ProjectionOutlet slot="season" />
          </div>
        </Season.Provider>
        <Season.Provider value="winter">
          <ProjectionContent slot="season">
            <SeasonLabel />
          </ProjectionContent>
        </Season.Provider>
      </ProjectionProvider>,
    );
    expect(screen.getByTestId('outlet')).toHaveTextContent('summer');
  });

  it('UIC-PROJECTION-1.6 renders in place without a provider', () => {
    render(
      <>
        <div data-testid="outlet">
          <ProjectionOutlet slot="tools" fallback="Fallback" />
        </div>
        <div data-testid="origin">
          <ProjectionContent slot="tools">
            <button type="button">Zoom</button>
          </ProjectionContent>
        </div>
      </>,
    );
    expect(screen.getByTestId('outlet')).toHaveTextContent('Fallback');
    expect(screen.getByTestId('origin')).toContainElement(
      screen.getByRole('button', { name: 'Zoom' }),
    );
  });
});
