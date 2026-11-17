import { parse } from 'csv-parse/sync';
import { upsertMovies } from './movie-repository';
import type { MovieRecordInput } from '../types/MoviesTypes';

const EXPECTED_COLUMNS = new Set([
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
]);

function requiredText(value: string, field: string, line: number): string {
  const text = value.trim();
  if (text.length === 0) {
    throw new Error(
      `Valeur obligatoire vide pour ${field} à la ligne ${line}.`,
    );
  }
  return text;
}

function optionalText(value: string): string | null {
  const text = value.trim();
  return text.length === 0 ? null : text;
}

function numericValue(
  value: string,
  field: string,
  line: number,
  options: { integer?: boolean; positive?: boolean } = {},
): number | null {
  const text = value.trim();
  if (text.length === 0) {
    return null;
  }

  const number = Number(text);
  const validInteger = !options.integer || Number.isInteger(number);
  const validSign = !options.positive || number > 0;
  if (!Number.isFinite(number) || !validInteger || !validSign) {
    throw new Error(
      `Valeur numérique invalide pour ${field} à la ligne ${line}.`,
    );
  }

  return number;
}

export function parseMoviesCsv(csv: string): MovieRecordInput[] {
  let hasHeaders = false;
  let records: Array<Record<string, string>>;

  try {
    records = parse(csv, {
      bom: true,
      columns: (headers: string[]) => {
        const normalizedHeaders = headers.map((header) =>
          header.trim().toLowerCase(),
        );

        if (
          normalizedHeaders.length !== EXPECTED_COLUMNS.size ||
          normalizedHeaders.some((header) => !EXPECTED_COLUMNS.has(header)) ||
          new Set(normalizedHeaders).size !== EXPECTED_COLUMNS.size
        ) {
          throw new Error('Les en-têtes CSV des films sont invalides.');
        }

        hasHeaders = true;
        return normalizedHeaders;
      },
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Les en-têtes')) {
      throw error;
    }
    throw new Error(`CSV des films invalide : ${String(error)}`);
  }

  if (!hasHeaders) {
    throw new Error('Le fichier CSV doit contenir les en-têtes des films.');
  }

  return records.map((record, index) => {
    const line = index + 2;
    return {
      id: numericValue(record.id, 'id', line, {
        integer: true,
        positive: true,
      }) as number,
      title: requiredText(record.title, 'title', line),
      original_title: requiredText(
        record.original_title,
        'original_title',
        line,
      ),
      original_language: requiredText(
        record.original_language,
        'original_language',
        line,
      ),
      overview: requiredText(record.overview, 'overview', line),
      release_date: optionalText(record.release_date),
      popularity: numericValue(record.popularity, 'popularity', line),
      vote_average: numericValue(record.vote_average, 'vote_average', line),
      vote_count: numericValue(record.vote_count, 'vote_count', line, {
        integer: true,
      }),
      poster_path: optionalText(record.poster_path),
      backdrop_path: optionalText(record.backdrop_path),
      runtime_minutes: numericValue(
        record.runtime_minutes,
        'runtime_minutes',
        line,
        { integer: true, positive: true },
      ),
      budget: numericValue(record.budget, 'budget', line, {
        integer: true,
        positive: true,
      }),
      revenue: numericValue(record.revenue, 'revenue', line, {
        integer: true,
        positive: true,
      }),
      collected_at: requiredText(record.collected_at, 'collected_at', line),
    };
  });
}

export function importMoviesFromCsv(
  database: Parameters<typeof upsertMovies>[0],
  csv: string,
): number {
  const movies = parseMoviesCsv(csv);
  upsertMovies(database, movies);
  return movies.length;
}
