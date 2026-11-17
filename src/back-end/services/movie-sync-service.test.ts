// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from '../database/schema';
import { getCountries } from '../database/country-repository';
import { getGenres } from '../database/genre-repository';
import {
  getMovieById,
  getMovieCountryCodes,
  getMovieGenreIds,
  getMovies,
} from '../database/movie-repository';
import type {
  TmdbMovie,
  TmdbMovieSyncDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';
import {
  parseMovieSyncOptions,
  syncMovies,
  toMovieWithRelations,
} from './movie-sync-service';
import type { TmdbClient } from './tmdb-client';

const COLLECTED_AT = '2026-11-17T10:00:00.000Z';

function createDetails(
  overrides: Partial<TmdbMovieSyncDetails> = {},
): TmdbMovieSyncDetails {
  return {
    id: 1,
    title: 'Film',
    original_title: 'Movie',
    original_language: 'fr',
    overview: 'Résumé',
    release_date: '2020-05-01',
    popularity: 12.5,
    vote_average: 7.8,
    vote_count: 100,
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    runtime: 120,
    budget: 1000000,
    revenue: 2500000,
    genres: [{ id: 18, name: 'Drame' }],
    production_countries: [{ iso_3166_1: 'FR', name: 'France' }],
    ...overrides,
  };
}

function discoverPage(
  ids: number[],
  page = 1,
  totalPages = 1,
): TmdbMoviesRawResponse {
  return {
    page,
    results: ids.map((id) => ({ id }) as TmdbMovie),
    total_pages: totalPages,
    total_results: ids.length,
  };
}

/**
 * Creates a fake TMDB client whose Discover pages are indexed by "year-page".
 * @param pages The Discover responses by year and page.
 */
function createClient(pages: Record<string, TmdbMoviesRawResponse>) {
  return {
    getGenres: vi.fn().mockResolvedValue([
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comédie' },
    ]),
    getCountries: vi.fn().mockResolvedValue([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'États-Unis' },
    ]),
    discoverMovies: vi.fn(async (year: number, page: number) => {
      return pages[`${year}-${page}`] ?? discoverPage([], page, page);
    }),
    getMovieDetails: vi.fn(async (id: number) =>
      createDetails({ id, title: `Film ${id}` }),
    ),
  } satisfies TmdbClient;
}

describe('movie-sync-service.ts', () => {
  const databases: DatabaseSync[] = [];

  afterEach(() => {
    for (const database of databases) {
      database.close();
    }
    databases.length = 0;
    vi.useRealTimers();
  });

  function createDatabase(): DatabaseSync {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);
    databases.push(database);
    return database;
  }

  describe('parseMovieSyncOptions', () => {
    it('convertit les options valides et utilise l’année de début par défaut', () => {
      // Act et assert
      expect(
        parseMovieSyncOptions({ from: '2015', to: '2024', pages: '2' }),
      ).toEqual({ fromYear: 2015, toYear: 2024, pagesPerYear: 2 });
      expect(parseMovieSyncOptions({ from: '2020', pages: '1' })).toEqual({
        fromYear: 2020,
        toYear: 2020,
        pagesPerYear: 1,
      });
    });

    it('rejette les années et nombres de pages invalides', () => {
      // Arrange
      const invalidOptions = [
        [{ from: 'abc', pages: '1' }, 'entier positif'],
        [{ from: '999', pages: '1' }, 'entre 1000 et 9999'],
        [{ from: '2020', to: '10000', pages: '1' }, 'entre 1000 et 9999'],
        [{ from: '2024', to: '2015', pages: '1' }, 'précéder'],
        [{ from: '2020', pages: '0' }, 'entre 1 et 500'],
        [{ from: '2020', pages: '501' }, 'entre 1 et 500'],
      ] as const;

      // Act et assert
      for (const [options, message] of invalidOptions) {
        expect(() => parseMovieSyncOptions(options)).toThrow(message);
      }
    });
  });

  describe('toMovieWithRelations', () => {
    it('convertit le détail TMDB et considère les valeurs nulles ou à zéro comme inconnues', () => {
      // Arrange
      const details = createDetails({
        overview: null,
        release_date: '',
        popularity: null,
        vote_average: null,
        vote_count: null,
        poster_path: null,
        backdrop_path: '',
        runtime: 0,
        budget: 0,
        revenue: null,
        production_countries: [
          { iso_3166_1: 'BE', name: 'Belgium' },
          { iso_3166_1: 'FR', name: 'France' },
        ],
      });

      // Act
      const { movie, genres, countries } = toMovieWithRelations(
        details,
        COLLECTED_AT,
      );

      // Assert
      expect(movie).toEqual({
        id: 1,
        title: 'Film',
        original_title: 'Movie',
        original_language: 'fr',
        overview: '',
        release_date: null,
        popularity: null,
        vote_average: null,
        vote_count: null,
        poster_path: null,
        backdrop_path: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
        collected_at: COLLECTED_AT,
      });
      expect(genres).toEqual([{ id: 18, name: 'Drame' }]);
      expect(countries).toEqual([
        { code: 'BE', name: 'Belgium' },
        { code: 'FR', name: 'France' },
      ]);
    });
  });

  describe('syncMovies', () => {
    it('met à jour les catalogues puis les films de chaque année avec leurs relations', async () => {
      // Arrange : deux années, la première sur deux pages.
      vi.useFakeTimers({ now: new Date(COLLECTED_AT), toFake: ['Date'] });
      const database = createDatabase();
      const client = createClient({
        '2020-1': discoverPage([1, 2], 1, 2),
        '2020-2': discoverPage([3], 2, 2),
        '2021-1': discoverPage([4], 1, 1),
      });
      const onProgress = vi.fn();

      // Act
      const summary = await syncMovies(
        database,
        client,
        { fromYear: 2020, toYear: 2021, pagesPerYear: 3 },
        onProgress,
      );

      // Assert
      expect(summary).toEqual({ genres: 2, countries: 2, movies: 4 });
      expect(getGenres(database)).toHaveLength(2);
      expect(getCountries(database)).toHaveLength(2);
      expect(getMovies(database).map(({ id }) => id)).toEqual([1, 2, 3, 4]);
      expect(getMovieById(database, 3)).toMatchObject({
        title: 'Film 3',
        release_year: 2020,
        collected_at: COLLECTED_AT,
      });
      expect(getMovieGenreIds(database, 3)).toEqual([18]);
      expect(getMovieCountryCodes(database, 3)).toEqual(['FR']);
      expect(client.discoverMovies.mock.calls).toEqual([
        [2020, 1],
        [2020, 2],
        [2021, 1],
      ]);
      expect(onProgress).toHaveBeenCalledWith('Année 2020, page 1 : 2 film(s)');
      expect(onProgress).toHaveBeenCalledTimes(3);
    });

    it('limite le nombre de pages et actualise un film sans doublon', async () => {
      // Arrange : un film déjà synchronisé revient avec un nouveau titre.
      const database = createDatabase();
      const client = createClient({
        '2020-1': discoverPage([1], 1, 10),
        '2020-2': discoverPage([2], 2, 10),
      });
      await syncMovies(database, client, {
        fromYear: 2020,
        toYear: 2020,
        pagesPerYear: 1,
      });
      client.getMovieDetails.mockResolvedValueOnce(
        createDetails({ id: 1, title: 'Titre actualisé', genres: [] }),
      );

      // Act
      const summary = await syncMovies(database, client, {
        fromYear: 2020,
        toYear: 2020,
        pagesPerYear: 1,
      });

      // Assert
      expect(summary.movies).toBe(1);
      expect(getMovies(database)).toHaveLength(1);
      expect(getMovieById(database, 1)?.title).toBe('Titre actualisé');
      expect(getMovieGenreIds(database, 1)).toEqual([]);
    });

    it('propage une erreur TMDB en conservant les pages déjà enregistrées', async () => {
      // Arrange : le détail d'un film de la seconde page échoue.
      const database = createDatabase();
      const client = createClient({
        '2020-1': discoverPage([1], 1, 2),
        '2020-2': discoverPage([2], 2, 2),
      });
      client.getMovieDetails.mockImplementation(async (id: number) => {
        if (id === 2) {
          throw new Error('TMDB indisponible');
        }
        return createDetails({ id });
      });

      // Act et assert
      await expect(
        syncMovies(database, client, {
          fromYear: 2020,
          toYear: 2020,
          pagesPerYear: 2,
        }),
      ).rejects.toThrow('TMDB indisponible');
      expect(getMovies(database).map(({ id }) => id)).toEqual([1]);
    });
  });
});
