import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';
import { createDiscoverMovieQueryParams } from './discover-movie-query-params';

describe('createDiscoverMovieQueryParams', () => {
  it('creates Discover parameters with defaults', () => {
    // Arrange et act
    const queryParams = createDiscoverMovieQueryParams({ year: '2020' });

    // Assert
    expect(Object.fromEntries(queryParams)).toEqual({
      primary_release_year: '2020',
      language: DEFAULT_LANGUAGE,
      page: String(DEFAULT_PAGE),
      region: DEFAULT_REGION,
    });
  });

  it('keeps non-empty string options', () => {
    // Arrange et act
    const queryParams = createDiscoverMovieQueryParams({
      year: '2020',
      language: 'en-US',
      page: '2',
      region: 'US',
    });

    // Assert
    expect(Object.fromEntries(queryParams)).toEqual({
      primary_release_year: '2020',
      language: 'en-US',
      page: '2',
      region: 'US',
    });
  });

  it('uses defaults for non-string or empty optional values', () => {
    // Arrange et act
    const queryParams = createDiscoverMovieQueryParams({
      year: '2020',
      language: '',
      page: ['2'],
      region: { value: 'US' },
    });

    // Assert
    expect(queryParams.get('language')).toBe(DEFAULT_LANGUAGE);
    expect(queryParams.get('page')).toBe(String(DEFAULT_PAGE));
    expect(queryParams.get('region')).toBe(DEFAULT_REGION);
  });

  it('rejects missing, malformed, repeated and out-of-range years', () => {
    // Arrange
    const invalidQueries = [
      {},
      { year: '20' },
      { year: '10000' },
      { year: '0999' },
      { year: ['2020'] },
      { year: { value: '2020' } },
    ];

    // Act et assert
    for (const query of invalidQueries) {
      expect(() => createDiscoverMovieQueryParams(query)).toThrow('four-digit');
    }
  });
});
