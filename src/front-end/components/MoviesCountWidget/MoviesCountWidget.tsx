import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';
import './MoviesCountWidget.css';

type MoviesCountWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /** Number of movies stored in the database. */
  count?: number;
  /** Release year of the oldest movie stored in the database. */
  firstYear?: number;
  /** Release year of the most recent movie stored in the database. */
  lastYear?: number;
};

const numberFormat = new Intl.NumberFormat('fr-FR');

/**
 * Builds the label describing the release period covered by the movies.
 * @returns The period label, or null when the period is unknown.
 */
function formatPeriod(firstYear?: number, lastYear?: number): string | null {
  if (firstYear === undefined || lastYear === undefined) {
    return null;
  }
  return firstYear === lastYear
    ? `Sortis en ${firstYear}`
    : `Sortis de ${firstYear} à ${lastYear}`;
}

/**
 * Dashboard widget "Films en base": number of movies stored in the database
 * and the release period they cover.
 * @returns The JSX element representing the widget.
 */
export default function MoviesCountWidget({
  status,
  count = 0,
  firstYear,
  lastYear,
}: MoviesCountWidgetProps) {
  // A successful load without any movie is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && count === 0 ? 'empty' : status;
  const period = formatPeriod(firstYear, lastYear);

  return (
    <DashboardWidget
      title="Films en base"
      status={displayedStatus}
      emptyMessage="Aucun film en base pour le moment."
      errorMessage="Impossible de charger le nombre de films."
    >
      <p className="movies-count-value">
        {numberFormat.format(count)}
        <span className="movies-count-unit">
          {count > 1 ? ' films' : ' film'}
        </span>
      </p>
      {period && <p className="movies-count-period">{period}</p>}
    </DashboardWidget>
  );
}
