// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import {
  deleteUnusedGenres,
  getGenreById,
  getGenres,
  upsertGenres,
} from './genre-repository';

describe('genre-repository.ts', () => {
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

  it('finds an existing genre and returns undefined for an unknown id', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [{ id: 18, name: 'Drame' }]);

    // Act
    const existingGenre = getGenreById(database, 18);
    const missingGenre = getGenreById(database, 99);

    // Assert
    expect(existingGenre).toEqual({ id: 18, name: 'Drame' });
    expect(missingGenre).toBeUndefined();
  });

  it('lists genres in ascending id order', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [
      { id: 35, name: 'Comédie' },
      { id: 18, name: 'Drame' },
    ]);

    // Act
    const genres = getGenres(database);

    // Assert
    expect(genres).toEqual([
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comédie' },
    ]);
  });

  it('upserts arrays and other iterables without creating duplicates', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comédie' },
      { id: 18, name: 'Drama' },
    ]);

    // Act
    upsertGenres(
      database,
      new Set([
        { id: 35, name: 'Comedy' },
        { id: 10751, name: 'Familial' },
      ]),
    );

    // Assert
    expect(getGenres(database)).toEqual([
      { id: 18, name: 'Drama' },
      { id: 35, name: 'Comedy' },
      { id: 10751, name: 'Familial' },
    ]);
  });

  it('does not modify data for an empty iterable and enforces a genre name', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [{ id: 18, name: 'Drame' }]);

    // Act and assert
    upsertGenres(database, []);
    expect(getGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
    expect(() =>
      upsertGenres(database, [{ id: 35, name: null as unknown as string }]),
    ).toThrow(/NOT NULL constraint failed/);
  });

  it('deletes only genres that are not associated with a movie', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [
      { id: 18, name: 'Drame' },
      { id: 35, name: 'Comédie' },
    ]);
    database
      .prepare(
        `INSERT INTO movies (
          id, title, original_title, original_language, overview, collected_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(1, 'Film', 'Movie', 'fr', 'Résumé', '2026-11-03');
    database
      .prepare('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)')
      .run(1, 18);

    // Act
    const deletedCount = deleteUnusedGenres(database);

    // Assert
    expect(deletedCount).toBe(1);
    expect(getGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
  });
});
