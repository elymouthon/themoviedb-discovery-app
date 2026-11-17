import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const getDatabaseMock = vi.fn(() => ({
  close: closeMock,
}));
const upsertGenresMock = vi.fn();
const deleteUnusedGenresMock = vi.fn();
const upsertCountriesMock = vi.fn();
const deleteUnusedCountriesMock = vi.fn();
const upsertMoviesMock = vi.fn();

vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));

vi.mock('./database/genre-repository.ts', () => ({
  deleteUnusedGenres: deleteUnusedGenresMock,
  upsertGenres: upsertGenresMock,
}));

vi.mock('./database/country-repository.ts', () => ({
  deleteUnusedCountries: deleteUnusedCountriesMock,
  upsertCountries: upsertCountriesMock,
}));

vi.mock('./database/movie-repository.ts', () => ({
  upsertMovies: upsertMoviesMock,
}));

const MOVIES_CSV_HEADERS =
  'id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime_minutes,budget,revenue,collected_at';

/**
 * Executes the backend CLI with the specified command-line arguments
 * @param args The command-line arguments to pass to the CLI
 */
async function runCliWithArgs(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

describe('backend-cli.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('create-database', () => {
    it('uses the default database path when the subcommand has no path option', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database']);

        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Base de données disponible : ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('uses the path passed in --path', async () => {
      const customDatabasePath = './data/custom-movies.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database', '--path', customDatabasePath]);

        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Base de données disponible : ${resolve(customDatabasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });
  });

  it('importe un CSV après validation et ferme la base sélectionnée', async () => {
    // Arrange
    const directory = mkdtempSync(join(tmpdir(), 'genres-cli-'));
    const csvPath = join(directory, 'genres.csv');
    const databasePath = join(directory, 'movies.sqlite');
    writeFileSync(csvPath, 'id,name\n18,Drame\n35,Comédie\n');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    try {
      await runCliWithArgs(['--path', databasePath, 'add-genres', csvPath]);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(databasePath);
      expect(upsertGenresMock).toHaveBeenCalledWith(expect.anything(), [
        { id: 18, name: 'Drame' },
        { id: 35, name: 'Comédie' },
      ]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `2 genre(s) importé(s) dans ${resolve(databasePath)}`,
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('valide le CSV avant d’ouvrir la base', async () => {
    // Arrange
    const directory = mkdtempSync(join(tmpdir(), 'genres-cli-'));
    const csvPath = join(directory, 'genres.csv');
    writeFileSync(csvPath, 'code,name\n18,Drame\n');

    // Act et assert
    await expect(runCliWithArgs(['add-genres', csvPath])).rejects.toThrow(
      'en-têtes',
    );
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it('supprime les genres inutilisés et affiche le nombre supprimé', async () => {
    // Arrange
    const databasePath = './data/custom-movies.sqlite';
    deleteUnusedGenresMock.mockReturnValueOnce(3);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    try {
      await runCliWithArgs(['--path', databasePath, 'clean-genres']);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(databasePath);
      expect(deleteUnusedGenresMock).toHaveBeenCalledWith(expect.anything());
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `3 genre(s) supprimé(s) depuis ${resolve(databasePath)}`,
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('importe les pays après validation et ferme la base sélectionnée', async () => {
    // Arrange
    const directory = mkdtempSync(join(tmpdir(), 'countries-cli-'));
    const csvPath = join(directory, 'countries.csv');
    const databasePath = join(directory, 'movies.sqlite');
    writeFileSync(csvPath, 'code,name\nFR,France\nUS,États-Unis\n');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    try {
      await runCliWithArgs(['--path', databasePath, 'add-countries', csvPath]);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(databasePath);
      expect(upsertCountriesMock).toHaveBeenCalledWith(expect.anything(), [
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'États-Unis' },
      ]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `2 pays importé(s) dans ${resolve(databasePath)}`,
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('valide le CSV des pays avant d’ouvrir la base', async () => {
    // Arrange
    const directory = mkdtempSync(join(tmpdir(), 'countries-cli-'));
    const csvPath = join(directory, 'countries.csv');
    writeFileSync(csvPath, 'id,name\nFR,France\n');

    // Act et assert
    await expect(runCliWithArgs(['add-countries', csvPath])).rejects.toThrow(
      'en-têtes',
    );
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it('supprime les pays inutilisés et affiche le nombre supprimé', async () => {
    // Arrange
    const databasePath = './data/custom-movies.sqlite';
    deleteUnusedCountriesMock.mockReturnValueOnce(2);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    try {
      await runCliWithArgs(['--path', databasePath, 'clean-countries']);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(databasePath);
      expect(deleteUnusedCountriesMock).toHaveBeenCalledWith(expect.anything());
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `2 pays supprimé(s) depuis ${resolve(databasePath)}`,
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  describe('add-movies', () => {
    it('importe les films après validation et ferme la base sélectionnée', async () => {
      // Arrange : un CSV de deux films, dont un avec des champs optionnels vides.
      const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
      const csvPath = join(directory, 'movies.csv');
      const databasePath = join(directory, 'movies.sqlite');
      writeFileSync(
        csvPath,
        `${MOVIES_CSV_HEADERS}\n` +
          '550,"Fight Club, édition cinéma",Fight Club,en,Résumé,1999-10-15,61.4,8.4,26280,/poster.jpg,/backdrop.jpg,139,63000000,100853753,2026-11-16T00:00:00.000Z\n' +
          '603,Matrix,The Matrix,en,Résumé,,,,,,,,,,2026-11-16T00:00:00.000Z\n',
      );
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      try {
        await runCliWithArgs(['--path', databasePath, 'add-movies', csvPath]);

        // Assert : les films convertis sont transmis au repository.
        expect(getDatabaseMock).toHaveBeenCalledWith(databasePath);
        expect(upsertMoviesMock).toHaveBeenCalledWith(expect.anything(), [
          expect.objectContaining({
            id: 550,
            title: 'Fight Club, édition cinéma',
            runtime_minutes: 139,
            budget: 63000000,
          }),
          expect.objectContaining({
            id: 603,
            release_date: null,
            popularity: null,
            budget: null,
          }),
        ]);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `2 film(s) importé(s) dans ${resolve(databasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('valide le CSV des films avant d’ouvrir la base', async () => {
      // Arrange : des en-têtes incomplets.
      const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
      const csvPath = join(directory, 'movies.csv');
      writeFileSync(csvPath, 'id,title\n550,Fight Club\n');

      // Act et assert : l'erreur est levée sans ouvrir la base.
      await expect(runCliWithArgs(['add-movies', csvPath])).rejects.toThrow(
        'en-têtes',
      );
      expect(getDatabaseMock).not.toHaveBeenCalled();
      expect(upsertMoviesMock).not.toHaveBeenCalled();
    });

    it('propage l’erreur d’import et ferme quand même la base', async () => {
      // Arrange : le repository échoue pendant l'import.
      const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
      const csvPath = join(directory, 'movies.csv');
      writeFileSync(
        csvPath,
        `${MOVIES_CSV_HEADERS}\n603,Matrix,The Matrix,en,Résumé,,,,,,,,,,2026-11-16T00:00:00.000Z\n`,
      );
      upsertMoviesMock.mockImplementationOnce(() => {
        throw new Error('échec SQLite');
      });

      // Act et assert : l'erreur remonte et la connexion est fermée.
      await expect(runCliWithArgs(['add-movies', csvPath])).rejects.toThrow(
        'échec SQLite',
      );
      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(closeMock).toHaveBeenCalledOnce();
    });
  });
});
