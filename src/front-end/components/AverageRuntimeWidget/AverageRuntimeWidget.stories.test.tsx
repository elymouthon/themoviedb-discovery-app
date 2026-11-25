// @vitest-environment jsdom

import { composeStories } from '@storybook/react-vite';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../../.storybook/preview';
import * as stories from './AverageRuntimeWidget.stories';

afterEach(cleanup);

// Stories composed with the Storybook preview (theme and router decorators).
const { Nominal, Mobile, SansDonnees, Chargement, Erreur } = composeStories(
  stories,
  preview,
);

describe('AverageRuntimeWidget stories', () => {
  it.each([
    ['Nominal', Nominal],
    ['Mobile', Mobile],
  ])('renders the "%s" story with 107 minutes', (_name, Story) => {
    // Arrange and act: render the story with an average runtime of 107 min.
    render(<Story />);

    // Assert: the story displays the label, the value and the unit.
    const widget = screen.getByRole('region', { name: 'Durée moyenne' });
    expect(widget.textContent).toContain('107 min');
    expect(screen.getByTitle('minutes')).toBeTruthy();
  });

  it('renders the "SansDonnees" story with the empty state', () => {
    // Arrange and act: render the story without any known runtime.
    render(<SansDonnees />);

    // Assert: the story displays the empty message instead of zero.
    expect(
      screen.getByText('Aucune durée connue pour le moment.'),
    ).toBeTruthy();
    expect(screen.queryByTitle('minutes')).toBeNull();
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
      'Impossible de charger la durée moyenne.',
    );
  });
});
