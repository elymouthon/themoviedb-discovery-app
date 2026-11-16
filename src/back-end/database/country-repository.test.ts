// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import {
  getCountries,
  getCountryByCode,
  upsertCountries,
} from './country-repository';

describe('country-repository.ts', () => {
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

  it('finds an existing country and returns undefined for an unknown code', () => {
    // Arrange
    const database = createDatabase();
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    // Act
    const existingCountry = getCountryByCode(database, 'FR');
    const missingCountry = getCountryByCode(database, 'DE');

    // Assert
    expect(existingCountry).toEqual({ code: 'FR', name: 'France' });
    expect(missingCountry).toBeUndefined();
  });

  it('lists countries in ascending code order and returns an empty list when needed', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(getCountries(database)).toEqual([]);
    upsertCountries(database, [
      { code: 'US', name: 'United States' },
      { code: 'FR', name: 'France' },
    ]);
    expect(getCountries(database)).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
  });

  it('upserts arrays and other iterables without creating duplicates', () => {
    // Arrange
    const database = createDatabase();
    upsertCountries(database, [
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
      { code: 'FR', name: 'France métropolitaine' },
    ]);

    // Act
    upsertCountries(
      database,
      new Set([
        { code: 'US', name: 'États-Unis' },
        { code: 'BE', name: 'Belgique' },
      ]),
    );

    // Assert
    expect(getCountries(database)).toEqual([
      { code: 'BE', name: 'Belgique' },
      { code: 'FR', name: 'France métropolitaine' },
      { code: 'US', name: 'États-Unis' },
    ]);
  });

  it('does not modify data for an empty iterable', () => {
    // Arrange
    const database = createDatabase();
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    // Act
    upsertCountries(database, []);

    // Assert
    expect(getCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
  });

  it('rolls back all changes when a country violates the schema', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(() =>
      upsertCountries(database, [
        { code: 'FR', name: 'France' },
        { code: 'US', name: null as unknown as string },
      ]),
    ).toThrow(/NOT NULL constraint failed/);
    expect(getCountries(database)).toEqual([]);
  });
});
