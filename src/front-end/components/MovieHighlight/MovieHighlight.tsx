import { useState, type ReactNode } from 'react';
import './MovieHighlight.css';

type MovieHighlightProps = {
  /** Title of the movie. */
  title: string;
  /** Release year of the movie; absent when unknown. */
  releaseYear?: number | null;
  /** TMDB poster path of the movie (for example `/abc.jpg`); absent when unknown. */
  posterPath?: string | null;
  /** Indicator displayed under the title (rating, popularity, ROI...). */
  children?: ReactNode;
};

// Base URL of the TMDB posters, in a size suited to the widget cards.
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w185';

/**
 * Movie presentation shared by the dashboard widgets highlighting a movie:
 * poster, title, release year and an indicator. A missing or unreachable
 * poster is replaced by an explicit placeholder.
 * @returns The JSX element representing the highlighted movie.
 */
export default function MovieHighlight({
  title,
  releaseYear,
  posterPath,
  children,
}: MovieHighlightProps) {
  // Poster path that failed to load, to display the placeholder instead.
  const [failedPosterPath, setFailedPosterPath] = useState<string | null>(null);
  const poster =
    posterPath && posterPath !== failedPosterPath ? posterPath : null;

  return (
    <div className="movie-highlight">
      {poster ? (
        <img
          className="movie-highlight-poster"
          src={`${POSTER_BASE_URL}${poster}`}
          alt={`Affiche de ${title}`}
          loading="lazy"
          onError={() => setFailedPosterPath(poster)}
        />
      ) : (
        <div
          className="movie-highlight-poster movie-highlight-poster-placeholder"
          role="img"
          aria-label={`Affiche indisponible pour ${title}`}
        >
          <span aria-hidden="true">Affiche indisponible</span>
        </div>
      )}
      <div className="movie-highlight-details">
        <p className="movie-highlight-title">{title}</p>
        <p className="movie-highlight-year">
          {releaseYear ?? 'Année inconnue'}
        </p>
        {children}
      </div>
    </div>
  );
}
