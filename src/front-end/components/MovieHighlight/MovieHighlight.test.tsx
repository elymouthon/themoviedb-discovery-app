// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MovieHighlight from './MovieHighlight';

afterEach(cleanup);

describe('MovieHighlight', () => {
  it('renders the poster, the title, the year and the indicator', () => {
    // Arrange and act: render a movie with all its information.
    render(
      <MovieHighlight
        title="Fight Club"
        releaseYear={1999}
        posterPath="/poster.jpg"
      >
        <p>9,1 / 10</p>
      </MovieHighlight>,
    );

    // Assert: the poster has an accessible name and the TMDB URL.
    const poster = screen.getByRole('img', { name: 'Affiche de Fight Club' });
    expect(poster.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w185/poster.jpg',
    );

    // Assert: the title, the year and the indicator are displayed.
    expect(screen.getByText('Fight Club')).toBeTruthy();
    expect(screen.getByText('1999')).toBeTruthy();
    expect(screen.getByText('9,1 / 10')).toBeTruthy();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['empty', ''],
  ])(
    'renders an explicit placeholder when the poster is %s',
    (_case, posterPath) => {
      // Arrange and act: render a movie without poster.
      render(
        <MovieHighlight
          title="Fight Club"
          releaseYear={1999}
          posterPath={posterPath}
        />,
      );

      // Assert: an accessible placeholder replaces the poster.
      const placeholder = screen.getByRole('img', {
        name: 'Affiche indisponible pour Fight Club',
      });
      expect(placeholder.tagName).toBe('DIV');
      expect(placeholder.textContent).toBe('Affiche indisponible');
    },
  );

  it('replaces a poster that could not be loaded with the placeholder', () => {
    // Arrange: render a movie whose poster is unreachable.
    render(
      <MovieHighlight
        title="Fight Club"
        releaseYear={1999}
        posterPath="/unreachable.jpg"
      />,
    );
    const poster = screen.getByRole('img', { name: 'Affiche de Fight Club' });

    // Act: the browser fails to load the poster.
    fireEvent.error(poster);

    // Assert: the placeholder replaces the poster.
    expect(
      screen.queryByRole('img', { name: 'Affiche de Fight Club' }),
    ).toBeNull();
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Fight Club' }),
    ).toBeTruthy();
  });

  it('displays a new poster after a previous one failed to load', () => {
    // Arrange: a first poster fails to load.
    const { rerender } = render(
      <MovieHighlight title="Fight Club" posterPath="/unreachable.jpg" />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Affiche de Fight Club' }));

    // Act: render the movie with another poster.
    rerender(<MovieHighlight title="Fight Club" posterPath="/poster.jpg" />);

    // Assert: the new poster is displayed.
    expect(
      screen
        .getByRole('img', { name: 'Affiche de Fight Club' })
        .getAttribute('src'),
    ).toBe('https://image.tmdb.org/t/p/w185/poster.jpg');
  });

  it.each([
    ['absent', undefined],
    ['null', null],
  ])('renders a readable label when the year is %s', (_case, releaseYear) => {
    // Arrange and act: render a movie whose release year is unknown.
    render(<MovieHighlight title="Fight Club" releaseYear={releaseYear} />);

    // Assert: the unknown year is explicitly stated.
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });
});
