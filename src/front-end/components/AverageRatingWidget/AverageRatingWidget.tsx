import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';

type AverageRatingWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /**
   * Simple (unweighted) average of the TMDB ratings, on a 0 to 10 scale.
   * It is computed on every rated movie of the catalog, not by the
   * component. Absent when no movie is rated: the widget then shows its
   * empty state, which is distinct from a rating of zero.
   */
  averageRating?: number | null;
  /** Number of rated movies used to compute the average. */
  ratedMoviesCount?: number;
};

// Maximum value of the TMDB rating scale.
const RATING_SCALE = 10;

// Ratings are displayed with two decimals, with the French number format.
const ratingFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormat = new Intl.NumberFormat('fr-FR');

/**
 * Checks that the average rating is a usable value.
 * @returns True when the value is a finite number on the 0 to 10 scale.
 */
function isValidRating(value?: number | null): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= RATING_SCALE
  );
}

/**
 * Builds the caption explaining how the average rating is computed.
 * @returns The caption, mentioning the number of rated movies when known.
 */
function formatCaption(ratedMoviesCount?: number): string {
  if (ratedMoviesCount === undefined) {
    return 'Moyenne simple des notes TMDB';
  }
  const unit = ratedMoviesCount > 1 ? 'films notés' : 'film noté';
  return `Moyenne simple sur ${countFormat.format(ratedMoviesCount)} ${unit}`;
}

/**
 * Dashboard widget "Note moyenne": simple average of the TMDB ratings of the
 * catalog movies, on a 0 to 10 scale.
 * @returns The JSX element representing the widget.
 */
export default function AverageRatingWidget({
  status,
  averageRating,
  ratedMoviesCount,
}: AverageRatingWidgetProps) {
  const hasRating = isValidRating(averageRating);
  // A successful load without a valid rating is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && !hasRating ? 'empty' : status;

  return (
    <DashboardWidget
      title="Note moyenne"
      status={displayedStatus}
      emptyMessage="Aucune note disponible pour le moment."
      errorMessage="Impossible de charger la note moyenne."
    >
      {hasRating && (
        <>
          <p className="dashboard-widget-value">
            {ratingFormat.format(averageRating)}
            <span className="dashboard-widget-unit"> / {RATING_SCALE}</span>
          </p>
          <p className="dashboard-widget-caption">
            {formatCaption(ratedMoviesCount)}
          </p>
        </>
      )}
    </DashboardWidget>
  );
}
