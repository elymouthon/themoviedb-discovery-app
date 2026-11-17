import { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from '../database/country-repository';
import { upsertGenres } from '../database/genre-repository';
import {
  saveMoviesWithRelations,
  type MovieWithRelations,
} from '../database/movie-repository';
import type { TmdbMovieSyncDetails } from '../types/MoviesTypes';
import type { TmdbClient } from './tmdb-client';

// TMDB Discover does not return pages beyond 500.
const MAX_TMDB_PAGE = 500;

export type MovieSyncOptions = {
  fromYear: number;
  toYear: number;
  pagesPerYear: number;
};

export type MovieSyncSummary = {
  genres: number;
  countries: number;
  movies: number;
};

function parseInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${label} doit être un entier positif : ${value}`);
  }
  return Number(value);
}

/**
 * Validates the synchronization options received as strings from the CLI.
 * @param raw The years and number of pages to collect.
 * @returns The validated synchronization options.
 */
export function parseMovieSyncOptions(raw: {
  from: string;
  to?: string;
  pages: string;
}): MovieSyncOptions {
  const fromYear = parseInteger(raw.from, 'L’année de début');
  const toYear = parseInteger(raw.to ?? raw.from, 'L’année de fin');
  const pagesPerYear = parseInteger(raw.pages, 'Le nombre de pages');

  for (const year of [fromYear, toYear]) {
    if (year < 1000 || year > 9999) {
      throw new Error(
        `L’année doit être comprise entre 1000 et 9999 : ${year}`,
      );
    }
  }

  if (fromYear > toYear) {
    throw new Error('L’année de début doit précéder l’année de fin.');
  }

  if (pagesPerYear < 1 || pagesPerYear > MAX_TMDB_PAGE) {
    throw new Error(
      `Le nombre de pages doit être compris entre 1 et ${MAX_TMDB_PAGE}.`,
    );
  }

  return { fromYear, toYear, pagesPerYear };
}

function positiveOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null;
}

function textOrNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

/**
 * Converts TMDB movie details into a movie record with its genres and countries.
 * Runtime, budget and revenue equal to zero are unknown and stored as null.
 * @param details The TMDB movie details.
 * @param collectedAt The ISO timestamp of the observation.
 * @returns The movie with its relations, ready to be saved.
 */
export function toMovieWithRelations(
  details: TmdbMovieSyncDetails,
  collectedAt: string,
): MovieWithRelations {
  return {
    movie: {
      id: details.id,
      title: details.title,
      original_title: details.original_title,
      original_language: details.original_language,
      overview: details.overview ?? '',
      release_date: textOrNull(details.release_date),
      popularity: details.popularity ?? null,
      vote_average: details.vote_average ?? null,
      vote_count: details.vote_count ?? null,
      poster_path: textOrNull(details.poster_path),
      backdrop_path: textOrNull(details.backdrop_path),
      runtime_minutes: positiveOrNull(details.runtime),
      budget: positiveOrNull(details.budget),
      revenue: positiveOrNull(details.revenue),
      collected_at: collectedAt,
    },
    genres: details.genres,
    countries: details.production_countries.map((country) => ({
      code: country.iso_3166_1,
      name: country.name,
    })),
  };
}

/**
 * Updates genres, countries and movies of the given release years from TMDB.
 * The catalogs are refreshed first, then each Discover page is enriched with
 * the movie details and saved in its own transaction.
 * @param database The SQLite database.
 * @param client The TMDB client.
 * @param options The years and number of Discover pages per year.
 * @param onProgress Optional callback receiving a progress message per page.
 * @returns The number of genres, countries and movies synchronized.
 */
export async function syncMovies(
  database: DatabaseSync,
  client: TmdbClient,
  options: MovieSyncOptions,
  onProgress: (message: string) => void = () => {},
): Promise<MovieSyncSummary> {
  const collectedAt = new Date().toISOString();

  const genres = await client.getGenres();
  upsertGenres(database, genres);

  const countries = await client.getCountries();
  upsertCountries(database, countries);

  const movieIds = new Set<number>();

  for (let year = options.fromYear; year <= options.toYear; year++) {
    for (let page = 1; page <= options.pagesPerYear; page++) {
      const discover = await client.discoverMovies(year, page);
      const entries: MovieWithRelations[] = [];

      for (const result of discover.results) {
        const details = await client.getMovieDetails(result.id);
        entries.push(toMovieWithRelations(details, collectedAt));
        movieIds.add(details.id);
      }

      saveMoviesWithRelations(database, entries);
      onProgress(`Année ${year}, page ${page} : ${entries.length} film(s)`);

      if (page >= discover.total_pages) {
        break;
      }
    }
  }

  return {
    genres: genres.length,
    countries: countries.length,
    movies: movieIds.size,
  };
}
