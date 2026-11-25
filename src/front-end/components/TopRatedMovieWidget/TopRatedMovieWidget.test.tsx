// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopRatedMovieWidget from './TopRatedMovieWidget';

afterEach(cleanup);

// Representative top rated movie.
const movie = {
  title: 'Fight Club',
  releaseYear: 1999,
  posterPath: '/poster.jpg',
  rating: 9.1,
};

/** Returns the text displayed by the "Film le mieux noté" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Film le mieux noté' }).textContent;
}

describe('TopRatedMovieWidget', () => {
  it('renders the label, the poster, the title, the year and the rating', () => {
    // Arrange and act: render the widget with the top rated movie.
    render(<TopRatedMovieWidget status="success" {...movie} />);

    // Assert: the widget shows the movie information and its rating.
    expect(
      screen.getByRole('img', { name: 'Affiche de Fight Club' }),
    ).toBeTruthy();
    expect(screen.getByText('Fight Club')).toBeTruthy();
    expect(screen.getByText('1999')).toBeTruthy();
    expect(getWidgetText()).toContain('Note 9,1 / 10');
  });

  it('renders the rating in French format with one decimal', () => {
    // Arrange and act: render the widget with a whole rating.
    const { rerender } = render(
      <TopRatedMovieWidget status="success" {...movie} rating={9} />,
    );

    // Assert: a whole rating is displayed with one decimal.
    expect(getWidgetText()).toContain('9,0 / 10');

    // Act: render a rating with more decimals.
    rerender(<TopRatedMovieWidget status="success" {...movie} rating={8.46} />);

    // Assert: the rating is rounded to one decimal.
    expect(getWidgetText()).toContain('8,5 / 10');
  });

  it('renders the poster placeholder when the poster is missing', () => {
    // Arrange and act: render the widget without poster.
    render(
      <TopRatedMovieWidget status="success" {...movie} posterPath={null} />,
    );

    // Assert: an explicit placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('renders the poster placeholder when the poster cannot be loaded', () => {
    // Arrange: render the widget with an unreachable poster.
    render(<TopRatedMovieWidget status="success" {...movie} />);

    // Act: the browser fails to load the poster.
    fireEvent.error(screen.getByRole('img', { name: 'Affiche de Fight Club' }));

    // Assert: an explicit placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('keeps a long title and an unknown year readable', () => {
    // Arrange: a movie with a long title and no release year.
    const longTitle =
      'Docteur Folamour ou : comment j’ai appris à ne plus m’en faire et à aimer la bombe';

    // Act: render the widget with this movie.
    render(
      <TopRatedMovieWidget
        status="success"
        {...movie}
        title={longTitle}
        releaseYear={null}
      />,
    );

    // Assert: the full title and an explicit unknown year are displayed.
    expect(screen.getByText(longTitle)).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it.each([
    ['the title is absent', { title: undefined }],
    ['the title is blank', { title: '  ' }],
    ['the rating is absent', { rating: undefined }],
    ['the rating is null', { rating: null }],
    ['the rating is above the scale', { rating: 11 }],
    ['the rating is negative', { rating: -1 }],
    ['the rating is not a number', { rating: Number.NaN }],
  ])('renders the empty state when %s', (_case, override) => {
    // Arrange and act: render the widget without a valid rated movie.
    render(<TopRatedMovieWidget status="success" {...movie} {...override} />);

    // Assert: the empty message replaces the movie.
    expect(screen.getByText('Aucun film noté pour le moment.')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the loading state while the movie is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<TopRatedMovieWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the movie could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(<TopRatedMovieWidget status="error" {...movie} />);

    // Assert: the error message replaces the movie.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le mieux noté.',
    );
    expect(screen.queryByText('Fight Club')).toBeNull();
  });
});
