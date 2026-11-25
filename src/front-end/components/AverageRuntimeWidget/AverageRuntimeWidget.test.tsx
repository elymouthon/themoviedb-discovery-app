// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageRuntimeWidget from './AverageRuntimeWidget';

afterEach(cleanup);

describe('AverageRuntimeWidget', () => {
  it('renders the label, the average runtime and the minutes unit', () => {
    // Arrange and act: render the widget with an average runtime.
    render(<AverageRuntimeWidget status="success" averageRuntime={107} />);

    // Assert: the widget shows its label, the value and the unit.
    const widget = screen.getByRole('region', { name: 'Durée moyenne' });
    expect(widget.textContent).toContain('107 min');
    expect(screen.getByTitle('minutes').textContent).toBe('min');
  });

  it('rounds the average runtime to whole minutes', () => {
    // Arrange and act: render the widget with a decimal average.
    render(<AverageRuntimeWidget status="success" averageRuntime={106.6} />);

    // Assert: the value is rounded to the nearest minute.
    const widget = screen.getByRole('region', { name: 'Durée moyenne' });
    expect(widget.textContent).toContain('107 min');
  });

  it.each([
    ['absent', undefined],
    ['null', null],
    ['zero', 0],
    ['negative', -12],
    ['not a number', Number.NaN],
  ])(
    'renders the empty state instead of zero when the runtime is %s',
    (_case, averageRuntime) => {
      // Arrange and act: render the widget without a valid average runtime.
      render(
        <AverageRuntimeWidget
          status="success"
          averageRuntime={averageRuntime}
        />,
      );

      // Assert: the empty message is shown and no value is displayed.
      expect(
        screen.getByText('Aucune durée connue pour le moment.'),
      ).toBeTruthy();
      expect(screen.queryByTitle('minutes')).toBeNull();
    },
  );

  it('renders the loading state while the runtime is loading', () => {
    // Arrange and act: render the widget while loading.
    render(<AverageRuntimeWidget status="loading" />);

    // Assert: the loading message is announced.
    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('renders the error state when the runtime could not be loaded', () => {
    // Arrange and act: render the widget after a loading error.
    render(<AverageRuntimeWidget status="error" averageRuntime={107} />);

    // Assert: the error message replaces the value.
    expect(screen.getByRole('alert').textContent).toBe(
      'Impossible de charger la durée moyenne.',
    );
    expect(screen.queryByTitle('minutes')).toBeNull();
  });
});
