import { useId, type ReactNode } from 'react';
import './DashboardWidget.css';

/** Display state shared by every dashboard widget. */
export type WidgetStatus = 'loading' | 'error' | 'empty' | 'success';

type DashboardWidgetProps = {
  /** Title displayed at the top of the widget. */
  title: string;
  /** Current display state of the widget. */
  status: WidgetStatus;
  /** Message displayed when there is no data to show. */
  emptyMessage?: string;
  /** Message displayed when the data could not be loaded. */
  errorMessage?: string;
  /** Widget content, rendered only in the success state. */
  children?: ReactNode;
};

/**
 * Card shared by the dashboard widgets. It displays the widget title and
 * handles the loading, error and empty states, so each widget only renders
 * its own content.
 * @returns The JSX element representing the widget card.
 */
export default function DashboardWidget({
  title,
  status,
  emptyMessage = 'Aucune donnée disponible.',
  errorMessage = 'Impossible de charger les données.',
  children,
}: DashboardWidgetProps) {
  const titleId = useId();

  return (
    <section
      className={`dashboard-widget dashboard-widget-${status}`}
      aria-labelledby={titleId}
      aria-busy={status === 'loading'}
    >
      <h3 id={titleId} className="dashboard-widget-title">
        {title}
      </h3>
      {status === 'loading' && (
        <p className="dashboard-widget-message" role="status">
          Chargement…
        </p>
      )}
      {status === 'error' && (
        <p className="dashboard-widget-message" role="alert">
          {errorMessage}
        </p>
      )}
      {status === 'empty' && (
        <p className="dashboard-widget-message">{emptyMessage}</p>
      )}
      {status === 'success' && (
        <div className="dashboard-widget-content">{children}</div>
      )}
    </section>
  );
}
