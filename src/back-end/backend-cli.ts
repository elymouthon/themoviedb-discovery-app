#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { parseGenresCsv } from './utils/genres-csv.ts';

/** Command-line interface for movie database operations. */
const program = new Command()
  .description('CLI pour les opérations de la base de données des films')
  .option('-p, --path <path>', 'chemin vers la base SQLite');

function getDatabasePath(localPath?: string): string {
  return localPath ?? program.opts().path ?? DEFAULT_DATABASE_PATH;
}

program
  .command('create-database')
  .description('Create and initialize the movies database schema')
  .option('-p, --path <path>', 'chemin vers la base SQLite')
  .action(({ path }: { path?: string }) => {
    const databasePath = getDatabasePath(path);
    const database = getDatabase(databasePath);
    database.close();
    console.log(`Base de données disponible : ${resolve(databasePath)}`);
  });

program
  .command('add-genres <csv-file>')
  .description('Importe ou actualise les genres depuis un fichier CSV')
  .action((csvFile: string) => {
    const genres = parseGenresCsv(readFileSync(resolve(csvFile), 'utf8'));
    const databasePath = getDatabasePath();
    const database = getDatabase(databasePath);

    try {
      upsertGenres(database, genres);
    } finally {
      database.close();
    }

    console.log(
      `${genres.length} genre(s) importé(s) dans ${resolve(databasePath)}`,
    );
  });

program
  .command('clean-genres')
  .description('Supprime les genres inutilisés')
  .action(() => {
    const databasePath = getDatabasePath();
    const database = getDatabase(databasePath);
    let deletedCount: number;

    try {
      deletedCount = deleteUnusedGenres(database);
    } finally {
      database.close();
    }

    console.log(
      `${deletedCount} genre(s) supprimé(s) depuis ${resolve(databasePath)}`,
    );
  });

program.parse();
