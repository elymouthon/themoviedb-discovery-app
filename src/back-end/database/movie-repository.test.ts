// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import { getMovieById, getMovies, upsertMovies } from './movie-repository';
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
});
