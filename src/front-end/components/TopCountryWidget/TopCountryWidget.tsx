import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';

type TopCountryWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /** Name of the production country associated with the most movies. */
  countryName?: string | null;
  /**
   * Number of movies associated with the country, as provided: a movie
   * produced by several countries is counted once for each of them by the
   * data source, and the component never recounts these associations.
   */
  movieCount?: number | null;
};

const countFormat = new Intl.NumberFormat('fr-FR');

/**
 * Checks that the number of movies is a usable value.
 * @returns True when the value is a strictly positive integer.
 */
function isValidCount(value?: number | null): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Dashboard widget "Pays le plus représenté": production country associated
 * with the most movies, and its number of movies.
 * @returns The JSX element representing the widget.
 */
export default function TopCountryWidget({
  status,
  countryName,
  movieCount,
}: TopCountryWidgetProps) {
  const name = countryName?.trim();
  const count = isValidCount(movieCount) ? movieCount : null;
  const hasCountry = Boolean(name) && count !== null;
  // A successful load without a known country is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && !hasCountry ? 'empty' : status;

  return (
    <DashboardWidget
      title="Pays le plus représenté"
      status={displayedStatus}
      emptyMessage="Aucun pays de production connu pour le moment."
      errorMessage="Impossible de charger le pays le plus représenté."
    >
      {hasCountry && (
        <>
          <p className="dashboard-widget-label">{name}</p>
          <p className="dashboard-widget-caption">
            <strong>{countFormat.format(count)}</strong>
            {count > 1 ? ' films' : ' film'}
          </p>
        </>
      )}
    </DashboardWidget>
  );
}
