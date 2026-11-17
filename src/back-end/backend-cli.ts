#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import {
  deleteUnusedCountries,
  upsertCountries,
} from './database/country-repository.ts';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { parseMoviesCsv } from './database/movie-csv-importer.ts';
import { upsertMovies } from './database/movie-repository.ts';
import {
  parseMovieSyncOptions,
  syncMovies,
  type MovieSyncSummary,
} from './services/movie-sync-service.ts';
import { createTmdbClient } from './services/tmdb-client.ts';
import { DEFAULT_LANGUAGE } from './utils/constants.ts';
import { parseCountriesCsv } from './utils/countries-csv.ts';
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

program
  .command('add-countries <csv-file>')
  .description('Importe ou actualise les pays depuis un fichier CSV')
  .action((csvFile: string) => {
    const countries = parseCountriesCsv(readFileSync(resolve(csvFile), 'utf8'));
    const databasePath = getDatabasePath();
    const database = getDatabase(databasePath);

    try {
      upsertCountries(database, countries);
    } finally {
      database.close();
    }

    console.log(
      `${countries.length} pays importé(s) dans ${resolve(databasePath)}`,
    );
  });

program
  .command('clean-countries')
  .description('Supprime les pays inutilisés')
  .action(() => {
    const databasePath = getDatabasePath();
    const database = getDatabase(databasePath);
    let deletedCount: number;

    try {
      deletedCount = deleteUnusedCountries(database);
    } finally {
      database.close();
    }

    console.log(
      `${deletedCount} pays supprimé(s) depuis ${resolve(databasePath)}`,
    );
  });

program
  .command('add-movies <csv-file>')
  .description('Importe ou actualise les films depuis un fichier CSV')
  .action((csvFile: string) => {
    const movies = parseMoviesCsv(readFileSync(resolve(csvFile), 'utf8'));
    const databasePath = getDatabasePath();
    const database = getDatabase(databasePath);

    try {
      upsertMovies(database, movies);
    } finally {
      database.close();
    }

    console.log(
      `${movies.length} film(s) importé(s) dans ${resolve(databasePath)}`,
    );
  });

program
  .command('sync-movies')
  .description(
    'Met à jour les genres, les pays et les films des années choisies depuis TMDB',
  )
  .requiredOption('--from <year>', 'année de sortie de début')
  .option('--to <year>', 'année de sortie de fin (par défaut --from)')
  .option('--pages <count>', 'nombre de pages Discover par année', '1')
  .option('--language <language>', 'langue des libellés', DEFAULT_LANGUAGE)
  .action(
    async (rawOptions: {
      from: string;
      to?: string;
      pages: string;
      language: string;
    }) => {
      const options = parseMovieSyncOptions(rawOptions);
      // The TMDB token is only required by this command.
      const { tmdbAccessToken } = await import('./utils/config.ts');
      const client = createTmdbClient({
        accessToken: tmdbAccessToken as string,
        language: rawOptions.language,
      });
      const databasePath = getDatabasePath();
      const database = getDatabase(databasePath);
      let summary: MovieSyncSummary;

      try {
        summary = await syncMovies(database, client, options, console.log);
      } finally {
        database.close();
      }

      console.log(
        `${summary.movies} film(s), ${summary.genres} genre(s) et ${summary.countries} pays synchronisés dans ${resolve(databasePath)}`,
      );
    },
  );

await program.parseAsync();
