// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget from './MostPopularMovieWidget';

afterEach(cleanup);

// Representative most popular movie.
const movie = {
  title: 'Fight Club',
  releaseYear: 1999,
  posterPath: '/poster.jpg',
  popularity: 1036.49,
};

// Same formatting as the widget, to compare with the French thousands separator.
const formatPopularity = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/** Returns the text displayed by the "Film le plus populaire" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Film le plus populaire' })
    .textContent;
}

describe('MostPopularMovieWidget', () => {
  it('renders the label, the poster, the title, the year and the popularity', () => {
    // Arrange and act: render the widget with the most popular movie.
    render(<MostPopularMovieWidget status="success" {...movie} />);

    // Assert: the widget shows the movie information and its popularity.
    expect(
      screen.getByRole('img', { name: 'Affiche de Fight Club' }),
    ).toBeTruthy();
    expect(screen.getByText('Fight Club')).toBeTruthy();
    expect(screen.getByText('1999')).toBeTruthy();
    expect(getWidgetText()).toContain(
      `${formatPopularity(1036.49)} popularité`,
    );
  });

  it('renders the popularity with two decimals and its label only', () => {
    // Arrange and act: render the widget with a whole popularity.
    const { rerender } = render(
      <MostPopularMovieWidget status="success" {...movie} popularity={87} />,
    );

    // Assert: the popularity has two decimals, a decimal comma and its label.
    expect(getWidgetText()).toContain('87,00 popularité');

    // Act: render a popularity with more decimals.
    rerender(
      <MostPopularMovieWidget
        status="success"
        {...movie}
        popularity={12.345}
      />,
    );

    // Assert: the popularity is rounded and not shown as a rating or votes.
    expect(getWidgetText()).toContain('12,35 popularité');
    expect(getWidgetText()).not.toContain('/ 10');
    expect(getWidgetText()).not.toContain('vote');
  });

  it('renders a popularity of zero as a known value', () => {
    // Arrange and act: render the widget with a popularity of zero.
    render(
      <MostPopularMovieWidget status="success" {...movie} popularity={0} />,
    );

    // Assert: zero is displayed as a popularity.
    expect(getWidgetText()).toContain('0,00 popularité');
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['negative', -5],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])(
    'keeps the movie and states an unknown popularity when it is %s',
    (_case, popularity) => {
      // Arrange and act: render the widget with an unknown popularity.
      render(
        <MostPopularMovieWidget
          status="success"
          {...movie}
          popularity={popularity}
        />,
      );

      // Assert: the movie stays visible and the popularity is not shown as zero.
      expect(screen.getByText('Fight Club')).toBeTruthy();
      expect(screen.getByText('Popularité inconnue')).toBeTruthy();
      expect(getWidgetText()).not.toContain('0,00');
    },
  );

  it('renders the poster placeholder when the poster is missing', () => {
    // Arrange and act: render the widget without poster.
    render(
      <MostPopularMovieWidget status="success" {...movie} posterPath={null} />,
    );

    // Assert: an explicit placeholder replaces the poster.
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('keeps a long title readable', () => {
    // Arrange: a movie with a long title.
    const longTitle =
      'Le Seigneur des anneaux : Le Retour du roi – Version longue';

    // Act: render the widget with this movie.
    render(
      <MostPopularMovieWidget status="success" {...movie} title={longTitle} />,
    );

    // Assert: the full title is displayed.
    expect(screen.getByText(longTitle)).toBeTruthy();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['blank', '   '],
  ])('renders the empty state when the title is %s', (_case, title) => {
    // Arrange and act: render the widget without movie.
    render(
      <MostPopularMovieWidget status="success" {...movie} title={title} />,
    );

    // Assert: the empty message replaces the movie.
    expect(
      screen.getByText('Aucun film populaire pour le moment.'),
    ).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the loading state while the movie is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<MostPopularMovieWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the movie could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(<MostPopularMovieWidget status="error" {...movie} />);

    // Assert: the error message replaces the movie.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le film le plus populaire.',
    );
    expect(screen.queryByText('Fight Club')).toBeNull();
  });
});
