// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './AverageRatingWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const { Nominal, NoteZero, SansNotes, Chargement, Erreur } = composeStories(
  stories,
  preview,
);

/** Returns the text displayed by the "Note moyenne" widget. */
function getWidgetText(): string | null {
  return screen.getByRole('region', { name: 'Note moyenne' }).textContent;
}

describe('AverageRatingWidget stories', () => {
  it('renders the "Nominal" story with 6,78 / 10', () => {
    // Arrange and act: render the nominal story.
    render(<Nominal />);

    // Assert: the story displays the rating in French format with its scale.
    expect(getWidgetText()).toContain('6,78 / 10');
    expect(getWidgetText()).toContain('Moyenne simple sur');
  });

  it('renders the "NoteZero" story with a rating of zero', () => {
    // Arrange and act: render the story with a rating of zero.
    render(<NoteZero />);

    // Assert: zero is displayed as a rating.
    expect(getWidgetText()).toContain('0,00 / 10');
  });

  it('renders the "SansNotes" story with the empty state', () => {
    // Arrange and act: render the story without any rating.
    render(<SansNotes />);

    // Assert: the story displays the empty message instead of a rating.
    expect(
      screen.getByText('Aucune note disponible pour le moment.'),
    ).toBeTruthy();
    expect(getWidgetText()).not.toContain('/ 10');
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
      'Impossible de charger la note moyenne.',
    );
  });
});
