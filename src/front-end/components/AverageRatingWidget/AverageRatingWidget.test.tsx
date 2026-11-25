// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRatingWidget from './AverageRatingWidget';

afterEach(cleanup);

/** Returns the text displayed by the "Note moyenne" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Note moyenne' }).textContent;
}

describe('AverageRatingWidget', () => {
  it('renders the label, the rating in French format and the scale', () => {
    // Arrange and act: render the widget with an average rating.
    render(<AverageRatingWidget status="success" averageRating={6.78} />);

    // Assert: the rating uses a decimal comma, two decimals and the / 10 scale.
    expect(getWidgetText()).toContain('6,78 / 10');
    expect(screen.getByText('Moyenne simple des notes TMDB')).toBeTruthy();
  });

  it('always renders two decimals', () => {
    // Arrange and act: render the widget with a whole rating.
    const { rerender } = render(
      <AverageRatingWidget status="success" averageRating={7} />,
    );

    // Assert: a whole rating is padded with two decimals.
    expect(getWidgetText()).toContain('7,00 / 10');

    // Act: render a rating with more than two decimals.
    rerender(<AverageRatingWidget status="success" averageRating={6.7849} />);

    // Assert: the rating is rounded to two decimals.
    expect(getWidgetText()).toContain('6,78 / 10');
  });

  it('renders a rating of zero, which is distinct from a missing rating', () => {
    // Arrange and act: render the widget with a rating of zero.
    render(<AverageRatingWidget status="success" averageRating={0} />);

    // Assert: zero is displayed as a rating, not as the empty state.
    expect(getWidgetText()).toContain('0,00 / 10');
    expect(
      screen.queryByText('Aucune note disponible pour le moment.'),
    ).toBeNull();
  });

  it('mentions the number of rated movies used by the simple average', () => {
    // Arrange and act: render the widget with several rated movies.
    const { rerender } = render(
      <AverageRatingWidget
        status="success"
        averageRating={6.78}
        ratedMoviesCount={1234}
      />,
    );

    // Assert: the caption mentions the formatted number of rated movies.
    const formattedCount = new Intl.NumberFormat('fr-FR').format(1234);
    expect(getWidgetText()).toContain(
      `Moyenne simple sur ${formattedCount} films notés`,
    );

    // Act: render the widget with a single rated movie.
    rerender(
      <AverageRatingWidget
        status="success"
        averageRating={6.78}
        ratedMoviesCount={1}
      />,
    );

    // Assert: the caption uses the singular.
    expect(screen.getByText('Moyenne simple sur 1 film noté')).toBeTruthy();
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['negative', -1],
    ['above the scale', 10.5],
    ['not a number', Number.NaN],
  ])(
    'renders the empty state when the rating is %s',
    (_case, averageRating) => {
      // Arrange and act: render the widget without a valid rating.
      render(
        <AverageRatingWidget status="success" averageRating={averageRating} />,
      );

      // Assert: the empty message is shown and no rating is displayed.
      expect(
        screen.getByText('Aucune note disponible pour le moment.'),
      ).toBeTruthy();
      expect(getWidgetText()).not.toContain('/ 10');
    },
  );

  it('renders the loading state while the rating is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<AverageRatingWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the rating could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(<AverageRatingWidget status="error" averageRating={6.78} />);

    // Assert: the error message replaces the rating.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la note moyenne.',
    );
    expect(getWidgetText()).not.toContain('/ 10');
  });
});
