import { parse } from 'csv-parse/sync';
import type { Country } from '../types/MoviesTypes';

const EXPECTED_COLUMNS = new Set(['code', 'name']);

export function parseCountriesCsv(csv: string): Country[] {
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
          throw new Error(
            'Les en-têtes CSV doivent être exactement code et name.',
          );
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

    throw new Error(`CSV des pays invalide : ${String(error)}`);
  }

  if (!hasHeaders) {
    throw new Error('Le fichier CSV doit contenir les en-têtes code et name.');
  }

  return records.map((record, index) => {
    const code = record.code.trim();
    const name = record.name.trim();

    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(
        `Code pays invalide à la ligne ${index + 2} : ${record.code}`,
      );
    }

    if (name.length === 0) {
      throw new Error(`Nom de pays vide à la ligne ${index + 2}.`);
    }

    return { code, name };
  });
}
