import DashboardWidget, {
  type WidgetStatus,
} from '../DashboardWidget/DashboardWidget';
import MovieHighlight from '../MovieHighlight/MovieHighlight';

type MostPopularMovieWidgetProps = {
  /** Current display state of the widget. */
  status: WidgetStatus;
  /** Title of the most popular movie. */
  title?: string | null;
  /** Release year of the movie; absent when unknown. */
  releaseYear?: number | null;
  /** TMDB poster path of the movie; absent when unknown. */
  posterPath?: string | null;
  /**
   * TMDB popularity index of the movie. It has no upper bound: it is neither
   * a rating out of 10 nor a number of votes. Absent when unknown.
   */
  popularity?: number | null;
};

// Popularity is displayed with two decimals, with the French number format.
const popularityFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Checks that the popularity index is a usable value.
 * @returns True when the value is a finite positive or zero number.
 */
function isValidPopularity(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Dashboard widget "Film le plus populaire": poster, title, release year and
 * TMDB popularity index of the most popular movie, as provided.
 * @returns The JSX element representing the widget.
 */
export default function MostPopularMovieWidget({
  status,
  title,
  releaseYear,
  posterPath,
  popularity,
}: MostPopularMovieWidgetProps) {
  const movieTitle = title?.trim();
  // A successful load without a movie is displayed as the empty state.
  const displayedStatus: WidgetStatus =
    status === 'success' && !movieTitle ? 'empty' : status;

  return (
    <DashboardWidget
      title="Film le plus populaire"
      status={displayedStatus}
      emptyMessage="Aucun film populaire pour le moment."
      errorMessage="Impossible de charger le film le plus populaire."
    >
      {movieTitle && (
        <MovieHighlight
          title={movieTitle}
          releaseYear={releaseYear}
          posterPath={posterPath}
        >
          <p className="dashboard-widget-caption">
            {isValidPopularity(popularity) ? (
              <>
                <strong>{popularityFormat.format(popularity)}</strong>{' '}
                popularité
              </>
            ) : (
              'Popularité inconnue'
            )}
          </p>
        </MovieHighlight>
      )}
    </DashboardWidget>
  );
}
