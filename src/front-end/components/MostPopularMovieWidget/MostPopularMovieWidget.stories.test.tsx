// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './MostPopularMovieWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const {
  Nominal,
  AfficheAbsente,
  ValeurInconnue,
  TitreLong,
  Chargement,
  Erreur,
} = composeStories(stories, preview);

/** Returns the text displayed by the "Film le plus populaire" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Film le plus populaire' })
    .textContent;
}

describe('MostPopularMovieWidget stories', () => {
  it('renders the "Nominal" story with a popularity of 1 036,49', () => {
    // Arrange and act: render the nominal story.
    render(<Nominal />);

    // Assert: the story displays the poster, the movie and its popularity.
    const formattedPopularity = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
    }).format(1036.49);
    expect(
      screen.getByRole('img', { name: 'Affiche de Fight Club' }),
    ).toBeTruthy();
    expect(getWidgetText()).toContain('1999');
    expect(getWidgetText()).toContain(`${formattedPopularity} popularité`);
  });

  it('renders the "AfficheAbsente" story with the poster placeholder', () => {
    // Arrange and act: render the story without poster.
    render(<AfficheAbsente />);

    // Assert: the placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('renders the "ValeurInconnue" story with an unknown popularity', () => {
    // Arrange and act: render the story with an unknown popularity.
    render(<ValeurInconnue />);

    // Assert: the movie stays visible and the popularity is stated as unknown.
    expect(screen.getByText('Fight Club')).toBeTruthy();
    expect(screen.getByText('Popularité inconnue')).toBeTruthy();
  });

  it('renders the "TitreLong" story with the full title', () => {
    // Arrange and act: render the story with a long title.
    render(<TitreLong />);

    // Assert: the full title is displayed.
    expect(
      screen.getByText(
        'Le Seigneur des anneaux : Le Retour du roi – Version longue',
      ),
    ).toBeTruthy();
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
      'Impossible de charger le film le plus populaire.',
    );
  });
});
