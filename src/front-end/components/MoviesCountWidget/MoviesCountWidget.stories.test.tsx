// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './MoviesCountWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const { AvecDonnees, UnSeulFilm, SansPeriode, Vide, Chargement, Erreur } =
  composeStories(stories, preview);

// Same formatting as the widget, to compare with the French thousands separator.
const formatCount = (count: number) =>
  new Intl.NumberFormat('fr-FR').format(count);

describe('MoviesCountWidget stories', () => {
  it('renders the "AvecDonnees" story with the count and the period', () => {
    // Arrange and act: render the story with movies over several years.
    render(<AvecDonnees />);

    // Assert: the story displays the formatted count and the release period.
    const widget = screen.getByRole('region', { name: 'Films en base' });
    expect(widget.textContent).toContain(`${formatCount(1234)} films`);
    expect(screen.getByText('Sortis de 2015 à 2024')).toBeTruthy();
  });

  it('renders the "UnSeulFilm" story with the singular unit', () => {
    // Arrange and act: render the story with a single movie.
    render(<UnSeulFilm />);

    // Assert: the story displays one movie released in a single year.
    const widget = screen.getByRole('region', { name: 'Films en base' });
    expect(widget.textContent).toContain('1 film');
    expect(screen.getByText('Sortis en 2020')).toBeTruthy();
  });

  it('renders the "SansPeriode" story without the release period', () => {
    // Arrange and act: render the story without release years.
    render(<SansPeriode />);

    // Assert: the story displays the count only.
    const widget = screen.getByRole('region', { name: 'Films en base' });
    expect(widget.textContent).toContain('87 films');
    expect(screen.queryByText(/^Sortis/)).toBeNull();
  });

  it('renders the "Vide" story with the empty state', () => {
    // Arrange and act: render the story with an empty database.
    render(<Vide />);

    // Assert: the story displays the empty message.
    expect(screen.getByText('Aucun film en base pour le moment.')).toBeTruthy();
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
      'Impossible de charger le nombre de films.',
    );
  });
});
