import type { Request } from 'express';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';

function getNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function createDiscoverMovieQueryParams(
  query: Request['query'],
): URLSearchParams {
  const year = getNonEmptyString(query.year);

  if (!year || !/^\d{4}$/.test(year) || Number(year) < 1000) {
    throw new Error('Year must be a four-digit string between 1000 and 9999.');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('primary_release_year', year);
  queryParams.append(
    'language',
    getNonEmptyString(query.language) ?? DEFAULT_LANGUAGE,
  );
  queryParams.append(
    'page',
    getNonEmptyString(query.page) ?? String(DEFAULT_PAGE),
  );
  queryParams.append(
    'region',
    getNonEmptyString(query.region) ?? DEFAULT_REGION,
  );

  return queryParams;
}
