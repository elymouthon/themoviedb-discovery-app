// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './TopCountryWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const { Nominal, NomLong, AucunPays, Chargement, Erreur } = composeStories(
  stories,
  preview,
);

/** Returns the text displayed by the "Pays le plus représenté" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Pays le plus représenté' })
    .textContent;
}

describe('TopCountryWidget stories', () => {
  it('renders the "Nominal" story with United States of America and 725 films', () => {
    // Arrange and act: render the nominal story.
    render(<Nominal />);

    // Assert: the story displays the country name, the count and the unit.
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(getWidgetText()).toContain('725 films');
  });

  it('renders the "NomLong" story with the full long name', () => {
    // Arrange and act: render the story with a long country name.
    render(<NomLong />);

    // Assert: the full name and the count are displayed.
    expect(
      screen.getByText('United Kingdom of Great Britain and Northern Ireland'),
    ).toBeTruthy();
    expect(getWidgetText()).toContain('312 films');
  });

  it('renders the "AucunPays" story with the empty state', () => {
    // Arrange and act: render the story without any known country.
    render(<AucunPays />);

    // Assert: the story displays the empty message.
    expect(
      screen.getByText('Aucun pays de production connu pour le moment.'),
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
      'Impossible de charger le pays le plus représenté.',
    );
  });
});
