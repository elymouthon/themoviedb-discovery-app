// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopCountryWidget from './TopCountryWidget';

afterEach(cleanup);

/** Returns the text displayed by the "Pays le plus représenté" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Pays le plus représenté' })
    .textContent;
}

describe('TopCountryWidget', () => {
  it('renders the label, the country name and its number of movies', () => {
    // Arrange and act: render the widget with the most represented country.
    render(
      <TopCountryWidget
        status="success"
        countryName="United States of America"
        movieCount={725}
      />,
    );

    // Assert: the widget shows the country name, the count and the unit.
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(getWidgetText()).toContain('725 films');
  });

  it('renders the count as provided, in French format', () => {
    // Arrange and act: render the widget with a count above one thousand.
    render(
      <TopCountryWidget
        status="success"
        countryName="France"
        movieCount={1234}
      />,
    );

    // Assert: the provided count is formatted with the French separator.
    const formattedCount = new Intl.NumberFormat('fr-FR').format(1234);
    expect(getWidgetText()).toContain(`${formattedCount} films`);
  });

  it('renders the singular unit for a single movie', () => {
    // Arrange and act: render the widget with a country having one movie.
    render(
      <TopCountryWidget
        status="success"
        countryName="Belgique"
        movieCount={1}
      />,
    );

    // Assert: the unit is singular.
    expect(getWidgetText()).toContain('1 film');
    expect(getWidgetText()).not.toContain('films');
  });

  it('renders a long country name in full', () => {
    // Arrange: a country with a long name.
    const longName = 'United Kingdom of Great Britain and Northern Ireland';

    // Act: render the widget with the long name.
    render(
      <TopCountryWidget
        status="success"
        countryName={longName}
        movieCount={312}
      />,
    );

    // Assert: the full name is displayed with the wrapping label style.
    const name = screen.getByText(longName);
    expect(name.className).toBe('dashboard-widget-label');
  });

  it('trims the spaces around the country name', () => {
    // Arrange and act: render the widget with a name surrounded by spaces.
    render(
      <TopCountryWidget
        status="success"
        countryName="  France "
        movieCount={8}
      />,
    );

    // Assert: the name is displayed without the surrounding spaces.
    expect(screen.getByText('France').textContent).toBe('France');
  });

  it.each([
    ['the country is absent', undefined, 725],
    ['the country is null', null, 725],
    ['the country name is blank', '   ', 725],
    ['the count is absent', 'France', undefined],
    ['the count is null', 'France', null],
    ['the count is zero', 'France', 0],
    ['the count is negative', 'France', -3],
    ['the count is not an integer', 'France', 2.5],
  ])('renders the empty state when %s', (_case, countryName, movieCount) => {
    // Arrange and act: render the widget without a known country.
    render(
      <TopCountryWidget
        status="success"
        countryName={countryName}
        movieCount={movieCount}
      />,
    );

    // Assert: the empty message replaces the country.
    expect(
      screen.getByText('Aucun pays de production connu pour le moment.'),
    ).toBeTruthy();
    expect(getWidgetText()).not.toContain('film ');
  });

  it('renders the loading state while the country is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<TopCountryWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the country could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(
      <TopCountryWidget
        status="error"
        countryName="United States of America"
        movieCount={725}
      />,
    );

    // Assert: the error message replaces the country.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger le pays le plus représenté.',
    );
    expect(screen.queryByText('United States of America')).toBeNull();
  });
});
