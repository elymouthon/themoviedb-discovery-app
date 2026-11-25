// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardWidget from './DashboardWidget';

afterEach(cleanup);

describe('DashboardWidget', () => {
  it('renders its title and content in the success state', () => {
    // Arrange and act: render a widget with data.
    render(
      <DashboardWidget title="Mon indicateur" status="success">
        <p>42</p>
      </DashboardWidget>,
    );

    // Assert: the widget is a region named after its title and shows its content.
    const widget = screen.getByRole('region', { name: 'Mon indicateur' });
    expect(widget.getAttribute('aria-busy')).toBe('false');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Mon indicateur' }),
    ).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders a loading message instead of its content while loading', () => {
    // Arrange and act: render a widget whose data is still loading.
    render(
      <DashboardWidget title="Mon indicateur" status="loading">
        <p>42</p>
      </DashboardWidget>,
    );

    // Assert: the widget is busy and announces the loading state.
    const widget = screen.getByRole('region', { name: 'Mon indicateur' });
    expect(widget.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
    expect(screen.queryByText('42')).toBeNull();
  });

  it('renders the default error message when the data could not be loaded', () => {
    // Arrange and act: render a widget in the error state.
    render(<DashboardWidget title="Mon indicateur" status="error" />);

    // Assert: the default error message is announced as an alert.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger les données.',
    );
  });

  it('renders a custom error message when one is provided', () => {
    // Arrange and act: render a widget in the error state with its own message.
    render(
      <DashboardWidget
        title="Mon indicateur"
        status="error"
        errorMessage="Le serveur ne répond pas."
      />,
    );

    // Assert: the custom error message replaces the default one.
    expect(screen.getByRole('alert').textContent).toBe(
      'Le serveur ne répond pas.',
    );
  });

  it('renders the default empty message when there is no data', () => {
    // Arrange and act: render a widget without data.
    render(<DashboardWidget title="Mon indicateur" status="empty" />);

    // Assert: the default empty message is displayed.
    expect(screen.getByText('Aucune donnée disponible.')).toBeTruthy();
  });

  it('renders a custom empty message when one is provided', () => {
    // Arrange and act: render a widget without data and with its own message.
    render(
      <DashboardWidget
        title="Mon indicateur"
        status="empty"
        emptyMessage="Aucun film en base."
      />,
    );

    // Assert: the custom empty message replaces the default one.
    expect(screen.getByText('Aucun film en base.')).toBeTruthy();
    expect(screen.queryByText('Aucune donnée disponible.')).toBeNull();
  });
});
