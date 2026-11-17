// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardPage from './DashboardPage';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('renders the dashboard header and the empty state without widgets', () => {
    // Arrange and act: render the page before any widget exists.
    render(<DashboardPage />);

    // Assert: the page title, its description and the widgets section are available.
    expect(screen.getByRole('main')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Indicateurs sur les films, leurs genres et leurs pays de production/,
      ),
    ).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Indicateurs' })).toBeTruthy();

    // Assert: an explicit empty state replaces the widgets.
    expect(screen.getByText('Aucun widget pour le moment')).toBeTruthy();
    expect(
      screen.getByText(
        'Les indicateurs du catalogue apparaîtront ici dès que les widgets seront disponibles.',
      ),
    ).toBeTruthy();
  });
});
