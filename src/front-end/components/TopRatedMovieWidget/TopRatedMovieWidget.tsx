import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';
import MovieHighlight from '../MovieHighlight/MovieHighlight';

type TopRatedMovieWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /** Title of the top rated movie. */
  title?: string | null;
  /** Release year of the movie; absent when unknown. */
  releaseYear?: number | null;
  /** TMDB poster path of the movie; absent when unknown. */
  posterPath?: string | null;
  /** TMDB rating of the movie, on a 0 to 10 scale. */
  rating?: number | null;
};

// Maximum value of the TMDB rating scale.
const RATING_SCALE = 10;

// Ratings are displayed with one decimal, with the French number format.
const ratingFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Checks that the rating is a usable value.
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
 * Dashboard widget "Film le mieux noté": poster, title, release year and
 * rating of the top rated movie, as provided.
 * @returns The JSX element representing the widget.
 */
export default function TopRatedMovieWidget({
  status,
  title,
  releaseYear,
  posterPath,
  rating,
}: TopRatedMovieWidgetProps) {
  const movieTitle = title?.trim();
  const movieRating = isValidRating(rating) ? rating : null;
  const hasMovie = Boolean(movieTitle) && movieRating !== null;
  // A successful load without a rated movie is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && !hasMovie ? 'empty' : status;

  return (
    <DashboardWidget
      title="Film le mieux noté"
      status={displayedStatus}
      emptyMessage="Aucun film noté pour le moment."
      errorMessage="Impossible de charger le film le mieux noté."
    >
      {movieTitle && movieRating !== null && (
        <MovieHighlight
          title={movieTitle}
          releaseYear={releaseYear}
          posterPath={posterPath}
        >
          <p className="dashboard-widget-caption">
            Note{' '}
            <strong>
              {ratingFormat.format(movieRating)} / {RATING_SCALE}
            </strong>
          </p>
        </MovieHighlight>
      )}
    </DashboardWidget>
  );
}
