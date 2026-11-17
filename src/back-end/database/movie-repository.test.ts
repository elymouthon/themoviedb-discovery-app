// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import {
  getMovieById,
  getMovieCountryCodes,
  getMovieGenreIds,
  getMovies,
  saveMoviesWithRelations,
  upsertMovies,
} from './movie-repository';
import { getGenres } from './genre-repository';
import { getCountries, upsertCountries } from './country-repository';
import type { MovieRecordInput } from '../types/MoviesTypes';

describe('movie-repository.ts', () => {
  const databases: DatabaseSync[] = [];

  afterEach(() => {
    for (const database of databases) {
      database.close();
    }
    databases.length = 0;
  });

  function createDatabase(): DatabaseSync {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);
    databases.push(database);
    return database;
  }

  function createMovie(
    overrides: Partial<MovieRecordInput> = {},
  ): MovieRecordInput {
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
      runtime_minutes: 120,
      budget: 1000000,
      revenue: 2500000,
      collected_at: '2026-11-16T00:00:00.000Z',
      ...overrides,
    };
  }

  it('finds an existing movie and returns undefined for an unknown id', () => {
    // Arrange
    const database = createDatabase();
    const movie = createMovie();
    upsertMovies(database, [movie]);

    // Act
    const existingMovie = getMovieById(database, 1);
    const missingMovie = getMovieById(database, 99);

    // Assert
    expect(existingMovie).toEqual({
      ...movie,
      release_year: 2020,
    });
    expect(missingMovie).toBeUndefined();
  });

  it('lists movies in ascending id order and returns an empty list when needed', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(getMovies(database)).toEqual([]);
    upsertMovies(database, [
      createMovie({ id: 20, title: 'Second film' }),
      createMovie({ id: 10, title: 'First film' }),
    ]);
    expect(getMovies(database).map(({ id, title }) => ({ id, title }))).toEqual(
      [
        { id: 10, title: 'First film' },
        { id: 20, title: 'Second film' },
      ],
    );
  });

  it('upserts arrays and other iterables without creating duplicates', () => {
    // Arrange
    const database = createDatabase();
    upsertMovies(database, [
      createMovie({ id: 1, title: 'Original title' }),
      createMovie({ id: 1, title: 'Updated title' }),
    ]);

    // Act
    upsertMovies(
      database,
      new Set([
        createMovie({ id: 1, title: 'Final title' }),
        createMovie({ id: 2, title: 'Second film' }),
      ]),
    );

    // Assert
    expect(getMovies(database).map(({ id, title }) => ({ id, title }))).toEqual(
      [
        { id: 1, title: 'Final title' },
        { id: 2, title: 'Second film' },
      ],
    );
  });

  it('does not modify data for an empty iterable', () => {
    // Arrange
    const database = createDatabase();
    const movie = createMovie();
    upsertMovies(database, [movie]);

    // Act
    upsertMovies(database, []);

    // Assert
    expect(getMovies(database)).toEqual([{ ...movie, release_year: 2020 }]);
  });

  it('rolls back all changes when a movie violates the schema', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(() =>
      upsertMovies(database, [
        createMovie({ id: 1 }),
        createMovie({ id: 2, runtime_minutes: 0 }),
      ]),
    ).toThrow(/CHECK constraint failed/);
    expect(getMovies(database)).toEqual([]);
  });

  describe('saveMoviesWithRelations', () => {
    it('enregistre un film avec ses genres et ses pays de production', () => {
      // Arrange
      const database = createDatabase();

      // Act
      saveMoviesWithRelations(database, [
        {
          movie: createMovie({ id: 550 }),
          genres: [
            { id: 18, name: 'Drame' },
            { id: 53, name: 'Thriller' },
          ],
          countries: [
            { code: 'US', name: 'États-Unis' },
            { code: 'DE', name: 'Allemagne' },
          ],
        },
      ]);

      // Assert : le film, les catalogues et les associations sont créés.
      expect(getMovieById(database, 550)?.title).toBe('Film');
      expect(getMovieGenreIds(database, 550)).toEqual([18, 53]);
      expect(getMovieCountryCodes(database, 550)).toEqual(['DE', 'US']);
      expect(getGenres(database)).toHaveLength(2);
      expect(getCountries(database)).toHaveLength(2);
    });

    it('actualise un film et remplace ses associations sans toucher aux autres films', () => {
      // Arrange : deux films déjà enregistrés.
      const database = createDatabase();
      saveMoviesWithRelations(database, [
        {
          movie: createMovie({ id: 1, title: 'Ancien titre' }),
          genres: [{ id: 18, name: 'Drama' }],
          countries: [{ code: 'FR', name: 'France' }],
        },
        {
          movie: createMovie({ id: 2, release_date: '2015-01-01' }),
          genres: [{ id: 18, name: 'Drama' }],
          countries: [{ code: 'FR', name: 'France' }],
        },
      ]);

      // Act : le premier film est actualisé avec de nouveaux genres et pays.
      saveMoviesWithRelations(
        database,
        new Set([
          {
            movie: createMovie({ id: 1, title: 'Nouveau titre' }),
            genres: [
              { id: 18, name: 'Drame' },
              { id: 35, name: 'Comédie' },
              { id: 35, name: 'Comédie' },
            ],
            countries: [{ code: 'BE', name: 'Belgique' }],
          },
        ]),
      );

      // Assert
      expect(getMovies(database)).toHaveLength(2);
      expect(getMovieById(database, 1)?.title).toBe('Nouveau titre');
      expect(getMovieGenreIds(database, 1)).toEqual([18, 35]);
      expect(getMovieCountryCodes(database, 1)).toEqual(['BE']);
      expect(getMovieGenreIds(database, 2)).toEqual([18]);
      expect(getMovieCountryCodes(database, 2)).toEqual(['FR']);
      expect(getGenres(database)).toContainEqual({ id: 18, name: 'Drame' });
    });

    it('conserve le nom traduit d’un pays déjà présent dans le catalogue', () => {
      // Arrange : le catalogue contient le nom traduit du pays.
      const database = createDatabase();
      upsertCountries(database, [{ code: 'US', name: 'États-Unis' }]);

      // Act : le détail TMDB fournit le nom anglais.
      saveMoviesWithRelations(database, [
        {
          movie: createMovie({ id: 1 }),
          genres: [],
          countries: [{ code: 'US', name: 'United States of America' }],
        },
      ]);

      // Assert
      expect(getCountries(database)).toEqual([
        { code: 'US', name: 'États-Unis' },
      ]);
      expect(getMovieCountryCodes(database, 1)).toEqual(['US']);
    });

    it('ne modifie rien pour une entrée vide', () => {
      // Arrange
      const database = createDatabase();

      // Act
      saveMoviesWithRelations(database, []);

      // Assert
      expect(getMovies(database)).toEqual([]);
      expect(getGenres(database)).toEqual([]);
    });

    it('annule toutes les modifications quand un film est invalide', () => {
      // Arrange : le second film viole la contrainte de durée positive.
      const database = createDatabase();

      // Act et assert
      expect(() =>
        saveMoviesWithRelations(database, [
          {
            movie: createMovie({ id: 1 }),
            genres: [{ id: 18, name: 'Drame' }],
            countries: [{ code: 'FR', name: 'France' }],
          },
          {
            movie: createMovie({ id: 2, runtime_minutes: 0 }),
            genres: [],
            countries: [],
          },
        ]),
      ).toThrow();
      expect(getMovies(database)).toEqual([]);
      expect(getGenres(database)).toEqual([]);
      expect(getCountries(database)).toEqual([]);
      expect(getMovieGenreIds(database, 1)).toEqual([]);
    });
  });
});
