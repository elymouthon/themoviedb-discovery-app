// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './TopRatedMovieWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const {
  Nominal,
  AfficheAbsente,
  AfficheInaccessible,
  TitreLongAnneeInconnue,
  AucunFilmNote,
  Chargement,
  Erreur,
} = composeStories(stories, preview);

/** Returns the text displayed by the "Film le mieux noté" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Film le mieux noté' }).textContent;
}

describe('TopRatedMovieWidget stories', () => {
  it('renders the "Nominal" story with a rating of 9,1 / 10', () => {
    // Arrange and act: render the nominal story.
    render(<Nominal />);

    // Assert: the story displays the poster, the movie and its rating.
    expect(
      screen.getByRole('img', { name: 'Affiche de Fight Club' }),
    ).toBeTruthy();
    expect(getWidgetText()).toContain('1999');
    expect(getWidgetText()).toContain('Note 9,1 / 10');
  });

  it('renders the "AfficheAbsente" story with the poster placeholder', () => {
    // Arrange and act: render the story without poster.
    render(<AfficheAbsente />);

    // Assert: the placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('renders the "AfficheInaccessible" story with the placeholder once the poster fails', () => {
    // Arrange: render the story with an unreachable poster.
    render(<AfficheInaccessible />);

    // Act: the browser fails to load the poster.
    fireEvent.error(screen.getByRole('img', { name: 'Affiche de Fight Club' }));

    // Assert: the placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('renders the "TitreLongAnneeInconnue" story with the full title', () => {
    // Arrange and act: render the story with a long title and no year.
    render(<TitreLongAnneeInconnue />);

    // Assert: the full title and the unknown year are displayed.
    expect(getWidgetText()).toContain('Docteur Folamour');
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it('renders the "AucunFilmNote" story with the empty state', () => {
    // Arrange and act: render the story without any rated movie.
    render(<AucunFilmNote />);

    // Assert: the story displays the empty message.
    expect(screen.getByText('Aucun film noté pour le moment.')).toBeTruthy();
  });

  it('renders the "Chargement" story with the loading state', () => {
    // Arrange and act: render the story while loading.
    render(<Chargement />);

    // Assert: the story announces the loading state.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the "Erreur" story with the error state', () => {
    // Arrange and act: render the story after a loading error.
    render(<Erreur />);

    // Assert: the story announces the error.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le mieux noté.',
    );
  });
});
