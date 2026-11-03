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

vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));

vi.mock('./database/genre-repository.ts', () => ({
  deleteUnusedGenres: deleteUnusedGenresMock,
  upsertGenres: upsertGenresMock,
}));

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
});
