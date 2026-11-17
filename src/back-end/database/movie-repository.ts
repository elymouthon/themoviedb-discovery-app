import { DatabaseSync } from 'node:sqlite';
import type {
  Country,
  Genre,
  MovieRecord,
  MovieRecordInput,
} from '../types/MoviesTypes';

/** A movie with the genres and production countries to associate with it. */
export type MovieWithRelations = {
  movie: MovieRecordInput;
  genres: Genre[];
  countries: Country[];
};

const MOVIE_COLUMNS = `
  id,
  title,
  original_title,
  original_language,
  overview,
  release_date,
  release_year,
  popularity,
  vote_average,
  vote_count,
  poster_path,
  backdrop_path,
  runtime_minutes,
  budget,
  revenue,
  collected_at
`;

const MOVIE_UPSERT_SQL = `
    INSERT INTO movies (
      id,
      title,
      original_title,
      original_language,
      overview,
      release_date,
      popularity,
      vote_average,
      vote_count,
      poster_path,
      backdrop_path,
      runtime_minutes,
      budget,
      revenue,
      collected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      original_title = excluded.original_title,
      original_language = excluded.original_language,
      overview = excluded.overview,
      release_date = excluded.release_date,
      popularity = excluded.popularity,
      vote_average = excluded.vote_average,
      vote_count = excluded.vote_count,
      poster_path = excluded.poster_path,
      backdrop_path = excluded.backdrop_path,
      runtime_minutes = excluded.runtime_minutes,
      budget = excluded.budget,
      revenue = excluded.revenue,
      collected_at = excluded.collected_at
`;

function toMovieParameters(movie: MovieRecordInput) {
  return [
    movie.id,
    movie.title,
    movie.original_title,
    movie.original_language,
    movie.overview,
    movie.release_date,
    movie.popularity,
    movie.vote_average,
    movie.vote_count,
    movie.poster_path,
    movie.backdrop_path,
    movie.runtime_minutes,
    movie.budget,
    movie.revenue,
    movie.collected_at,
  ];
}

export function getMovieById(
  database: DatabaseSync,
  id: number,
): MovieRecord | undefined {
  const row = database
    .prepare(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE id = ?`)
    .get(id) as MovieRecord | undefined;

  return row;
}

export function getMovies(database: DatabaseSync): MovieRecord[] {
  return database
    .prepare(`SELECT ${MOVIE_COLUMNS} FROM movies ORDER BY id ASC`)
    .all() as MovieRecord[];
}

export function upsertMovies(
  database: DatabaseSync,
  movies: Iterable<MovieRecordInput>,
): void {
  const entries = Array.from(movies);

  if (entries.length === 0) {
    return;
  }

  const statement = database.prepare(MOVIE_UPSERT_SQL);

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const movie of entries) {
      statement.run(...toMovieParameters(movie));
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Inserts or updates movies together with their genres and production countries.
 * Missing genres and countries are created; existing countries keep their name.
 * The previous associations of each movie are replaced so that the movie, its
 * genres and its countries stay consistent. Everything runs in one transaction.
 * @param database The SQLite database.
 * @param entries The movies to save with their genres and countries.
 */
export function saveMoviesWithRelations(
  database: DatabaseSync,
  entries: Iterable<MovieWithRelations>,
): void {
  const items = Array.from(entries);

  if (items.length === 0) {
    return;
  }

  const upsertGenre = database.prepare(`
    INSERT INTO genres (id, name) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `);
  // TMDB movie details only provide English country names: an existing
  // country keeps the translated name imported from the countries catalog.
  const insertMissingCountry = database.prepare(
    'INSERT OR IGNORE INTO countries (code, name) VALUES (?, ?)',
  );
  const upsertMovie = database.prepare(MOVIE_UPSERT_SQL);
  const deleteGenres = database.prepare(
    'DELETE FROM movie_genres WHERE movie_id = ?',
  );
  const deleteCountries = database.prepare(
    'DELETE FROM production_countries WHERE movie_id = ?',
  );
  const insertGenre = database.prepare(
    'INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
  );
  const insertCountry = database.prepare(
    'INSERT OR IGNORE INTO production_countries (movie_id, country_code) VALUES (?, ?)',
  );

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const { movie, genres, countries } of items) {
      for (const genre of genres) {
        upsertGenre.run(genre.id, genre.name);
      }
      for (const country of countries) {
        insertMissingCountry.run(country.code, country.name);
      }

      upsertMovie.run(...toMovieParameters(movie));
      deleteGenres.run(movie.id);
      deleteCountries.run(movie.id);

      for (const genre of genres) {
        insertGenre.run(movie.id, genre.id);
      }
      for (const country of countries) {
        insertCountry.run(movie.id, country.code);
      }
    }
    database.exec('COMMIT;');
  } catch (error) {
    database.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Lists the genre identifiers associated with a movie.
 * @param database The SQLite database.
 * @param movieId The movie identifier.
 * @returns The genre identifiers in ascending order.
 */
export function getMovieGenreIds(
  database: DatabaseSync,
  movieId: number,
): number[] {
  return (
    database
      .prepare(
        'SELECT genre_id FROM movie_genres WHERE movie_id = ? ORDER BY genre_id ASC',
      )
      .all(movieId) as Array<{ genre_id: number }>
  ).map(({ genre_id }) => genre_id);
}

/**
 * Lists the production country codes associated with a movie.
 * @param database The SQLite database.
 * @param movieId The movie identifier.
 * @returns The country codes in ascending order.
 */
export function getMovieCountryCodes(
  database: DatabaseSync,
  movieId: number,
): string[] {
  return (
    database
      .prepare(
        'SELECT country_code FROM production_countries WHERE movie_id = ? ORDER BY country_code ASC',
      )
      .all(movieId) as Array<{ country_code: string }>
  ).map(({ country_code }) => country_code);
}
