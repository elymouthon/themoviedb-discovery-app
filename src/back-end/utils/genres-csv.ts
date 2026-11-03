import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes';

const EXPECTED_COLUMNS = new Set(['id', 'name']);

export function parseGenresCsv(csv: string): Genre[] {
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
            'Les en-têtes CSV doivent être exactement id et name.',
          );
        }

        return normalizedHeaders;
      },
      skip_empty_lines: true,
    }) as Array<Record<string, string>>;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Les en-têtes')) {
      throw error;
    }

    throw new Error(
      `CSV des genres invalide : ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (records.length === 0) {
    throw new Error('Le fichier CSV doit contenir les en-têtes id et name.');
  }

  return records.map((record, index) => {
    const rawId = record.id.trim();
    const name = record.name.trim();
    const id = Number(rawId);

    if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error(
        `Identifiant de genre invalide à la ligne ${index + 2} : ${record.id}`,
      );
    }

    if (name.length === 0) {
      throw new Error(`Nom de genre vide à la ligne ${index + 2}.`);
    }

    return { id, name };
  });
}
