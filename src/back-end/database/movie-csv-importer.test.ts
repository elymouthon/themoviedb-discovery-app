// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeSchema } from './schema';
import { importMoviesFromCsv, parseMoviesCsv } from './movie-csv-importer';
import { getMovieById, getMovies } from './movie-repository';

const HEADERS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime_minutes',
  'budget',
  'revenue',
  'collected_at',
];

function quoteCsvValue(value: string): string {
  return /[,"\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function moviesCsv(rows: string[][]): string {
  return [
    HEADERS.join(','),
    ...rows.map((row) => row.map(quoteCsvValue).join(',')),
  ].join('\n');
}

function completeMovieRow(title = 'Film'): string[] {
  return [
    '1',
    title,
    'Movie',
    'fr',
    'Résumé du film',
    '2020-01-02',
    '12.5',
    '7.5',
    '100',
    '/poster.jpg',
    '/backdrop.jpg',
    '120',
    '1000',
    '2500',
    '2026-11-16T00:00:00.000Z',
  ];
}

describe('movie-csv-importer.ts', () => {
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

  it('parse un film complet et conserve les champs CSV quotés', () => {
    // Arrange
    const row = completeMovieRow('Film, premier');
    row[4] = 'Résumé avec, une virgule';

    // Act
    const movies = parseMoviesCsv(`\ufeff${moviesCsv([row])}`);

    // Assert
    expect(movies).toEqual([
      {
        id: 1,
        title: 'Film, premier',
        original_title: 'Movie',
        original_language: 'fr',
        overview: 'Résumé avec, une virgule',
        release_date: '2020-01-02',
        popularity: 12.5,
        vote_average: 7.5,
        vote_count: 100,
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        runtime_minutes: 120,
        budget: 1000,
        revenue: 2500,
        collected_at: '2026-11-16T00:00:00.000Z',
      },
    ]);
  });

  it('convertit les champs optionnels vides en null', () => {
    // Arrange
    const row = completeMovieRow();
    row[5] = '';
    row[6] = '';
    row[7] = '';
    row[8] = '';
    row[9] = '';
    row[10] = '';
    row[11] = '';
    row[12] = '';
    row[13] = '';

    // Act
    const [movie] = parseMoviesCsv(moviesCsv([row]));

    // Assert
    expect(movie).toMatchObject({
      release_date: null,
      popularity: null,
      vote_average: null,
      vote_count: null,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: null,
      budget: null,
      revenue: null,
    });
  });

  it('retourne une liste vide pour un fichier limité aux en-têtes', () => {
    // Arrange et act
    const movies = parseMoviesCsv(`${HEADERS.join(',')}\n`);

    // Assert
    expect(movies).toEqual([]);
  });

  it('rejette un fichier vide sans en-têtes', () => {
    // Arrange et act et assert : aucun en-tête n'est fourni.
    expect(() => parseMoviesCsv('')).toThrow(
      'Le fichier CSV doit contenir les en-têtes des films.',
    );
  });

  it('importe puis actualise un film sans créer de doublon', () => {
    // Arrange
    const database = createDatabase();
    const firstImport = moviesCsv([completeMovieRow('Titre initial')]);
    const secondRow = completeMovieRow('Titre actualisé');
    secondRow[0] = '1';

    // Act
    const firstCount = importMoviesFromCsv(database, firstImport);
    const secondCount = importMoviesFromCsv(database, moviesCsv([secondRow]));

    // Assert
    expect(firstCount).toBe(1);
    expect(secondCount).toBe(1);
    expect(getMovies(database)).toHaveLength(1);
    expect(getMovieById(database, 1)?.title).toBe('Titre actualisé');
  });

  it('rejette les en-têtes, valeurs et syntaxes invalides', () => {
    // Arrange
    const invalidCsvs = [
      ['wrong,name', 'en-têtes'],
      [moviesCsv([Object.assign(completeMovieRow(), { 0: '0' })]), 'id'],
      [moviesCsv([Object.assign(completeMovieRow(), { 11: '0' })]), 'runtime'],
      [moviesCsv([Object.assign(completeMovieRow(), { 1: '' })]), 'title'],
      [`${HEADERS.join(',')}\n1,"Film,Movie`, 'CSV des films invalide'],
    ];

    // Act et assert
    for (const [csv, expectedMessage] of invalidCsvs) {
      expect(() => parseMoviesCsv(csv)).toThrow(expectedMessage);
    }
  });
});
