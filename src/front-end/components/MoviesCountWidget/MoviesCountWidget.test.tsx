// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesCountWidget from './MoviesCountWidget';

afterEach(cleanup);

// Same formatting as the widget, to compare with the French thousands separator.
const formatCount = (count: number) =>
  new Intl.NumberFormat('fr-FR').format(count);

describe('MoviesCountWidget', () => {
  it('renders the number of movies and the release period', () => {
    // Arrange and act: render the widget with movies released over several years.
    render(
      <MoviesCountWidget
        status="success"
        count={1234}
        firstYear={2015}
        lastYear={2024}
      />,
    );

    // Assert: the widget shows its title, the formatted count and the period.
    const widget = screen.getByRole('region', { name: 'Films en base' });
    expect(widget.textContent).toContain(`${formatCount(1234)} films`);
    expect(screen.getByText('Sortis de 2015 à 2024')).toBeTruthy();
  });

  it('renders a single year period and the singular unit', () => {
    // Arrange and act: render the widget with one movie released in one year.
    render(
      <MoviesCountWidget
        status="success"
        count={1}
        firstYear={2020}
        lastYear={2020}
      />,
    );

    // Assert: the unit is singular and the period names the single year.
    expect(screen.getByText(/^\s*film$/)).toBeTruthy();
    expect(screen.getByText('Sortis en 2020')).toBeTruthy();
  });

  it('does not render the period when the release years are unknown', () => {
    // Arrange and act: render the widget without release years.
    render(<MoviesCountWidget status="success" count={12} />);

    // Assert: the count is displayed without any period.
    expect(screen.getByText('12', { exact: false })).toBeTruthy();
    expect(screen.queryByText(/^Sortis/)).toBeNull();
  });

  it('renders the empty state when the database has no movie', () => {
    // Arrange and act: render the widget after loading an empty database.
    render(<MoviesCountWidget status="success" count={0} />);

    // Assert: the empty message replaces the count.
    expect(screen.getByText('Aucun film en base pour le moment.')).toBeTruthy();
    expect(screen.queryByText('0', { exact: false })).toBeNull();
  });

  it('renders the loading state while the count is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<MoviesCountWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the count could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(<MoviesCountWidget status="error" />);

    // Assert: the widget error message is announced as an alert.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le nombre de films.',
    );
  });
});
